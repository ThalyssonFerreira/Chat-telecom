import fp from "fastify-plugin";
import TelegramBot from "node-telegram-bot-api";
import { generateGeminiReply, splitIntoChunks } from "../services/gemini";
import { env } from "./env";

declare module "fastify" {
  interface FastifyInstance {
    telegram: TelegramBot;
  }
}

export default fp(async (app) => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    app.log?.warn?.("[telegram] TELEGRAM_BOT_TOKEN ausente; plugin não inicializado");
    return;
  }

  const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });

  app.addHook("onClose", async () => {
    try {
      await bot.stopPolling();
    } catch {}
  });

  app.decorate("telegram", bot);

  async function ensureConversation(chatId: number) {
    const user = await app.prisma.user.upsert({
      where: { username: "telegram_default" },
      update: {},
      create: { name: "Telegram User", username: "telegram_default", email: "telegram_default@example.com" }
    });

    const conversation = await app.prisma.conversation.upsert({
      where: { externalChatId: String(chatId) },
      update: {},
      create: {
        userId: user.id,
        channel: "telegram",
        externalChatId: String(chatId),
        title: `Chat ${chatId}`
      }
    });

    return conversation;
  }

  bot.onText(/^\/start(?:@\w+)?$/i, async (msg) => {
    const chatId = msg.chat.id;
    const conv = await ensureConversation(chatId);
    await app.prisma.conversation.update({ where: { id: conv.id }, data: { isActive: true } });
    await bot.sendMessage(chatId, "✅ Assistente ativado! Vou responder suas mensagens aqui.\nEnvie /end para pausar quando quiser.");
  });

  bot.onText(/^\/end(?:@\w+)?$/i, async (msg) => {
    const chatId = msg.chat.id;
    const conv = await ensureConversation(chatId);
    await app.prisma.conversation.update({ where: { id: conv.id }, data: { isActive: false } });
    await bot.sendMessage(chatId, "⏸️ Assistente pausado. Envie /start para reativar.");
  });

  bot.onText(/^\/status(?:@\w+)?$/i, async (msg) => {
    const chatId = msg.chat.id;
    const conv = await ensureConversation(chatId);
    await bot.sendMessage(chatId, conv.isActive ? "🟢 Assistente está ativo." : "🔴 Assistente está pausado.");
  });

  bot.onText(/^\/help(?:@\w+)?$/i, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      `Comandos:
• /start – ativar o assistente
• /end – pausar o assistente
• /status – ver estado
• /mode generic | mikrotik – trocar modo
• /mikrotik – atalho para modo MikroTik
• /generic – atalho para modo genérico`
    );
  });

  bot.onText(/^\/mode(?:@\w+)?(?:\s+(generic|mikrotik))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const choice = (match?.[1] ?? "").toLowerCase();
    if (!choice) {
      await bot.sendMessage(chatId, "Use: /mode generic | /mode mikrotik");
      return;
    }
    const conv = await ensureConversation(chatId);
    await app.prisma.conversation.update({ where: { id: conv.id }, data: { domainMode: choice as any } });
    await bot.sendMessage(chatId, `Modo atualizado para: ${choice}`);
  });

  bot.onText(/^\/(mikrotik|generic)(?:@\w+)?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const choice = (match?.[1] ?? "generic").toLowerCase();
    const conv = await ensureConversation(chatId);
    await app.prisma.conversation.update({ where: { id: conv.id }, data: { domainMode: choice as any } });
    await bot.sendMessage(chatId, `Modo atualizado para: ${choice}`);
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ?? "";
    if (text.startsWith("/")) return;

    const conv = await ensureConversation(chatId);

    const me = await bot.getMe();
    const botUsername = me.username ? `@${me.username}` : "";
    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    if (isGroup && botUsername && !text.includes(botUsername)) return;

    if (!conv.isActive) return;

    try {
      await app.prisma.message.create({
        data: { conversationId: conv.id, role: "user", content: text }
      });

      const reply = await generateGeminiReply({
        prisma: app.prisma,
        conversationId: conv.id,
        userText: text
      });

      await app.prisma.message.create({
        data: { conversationId: conv.id, role: "assistant", content: reply }
      });

      for (const chunk of splitIntoChunks(reply)) {
        await bot.sendMessage(chatId, chunk);
      }
    } catch (err) {
      app.log?.error?.({ err }, "[telegram] falha ao processar mensagem");
      await bot.sendMessage(chatId, "Ops! Tive um problema ao processar sua mensagem 😔");
    }
  });

  app.log?.info?.("[telegram] bot iniciado (polling) com comandos");
});
