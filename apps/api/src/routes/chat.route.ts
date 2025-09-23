import { FastifyInstance } from "fastify";
import { generateGeminiReply } from "../services/gemini";

export default async function chatRoutes(app: FastifyInstance) {
  app.post("/chat", async (request, reply) => {
    const body = request.body as { conversationId: string; text: string; domainMode?: "generic" | "mikrotik" };
    if (!body?.conversationId || !body?.text) return reply.code(400).send({ error: "conversationId e text são obrigatórios" });

    const conv = await app.prisma.conversation.findUnique({ where: { id: body.conversationId } });
    if (!conv) return reply.code(404).send({ error: "Conversation não encontrada" });

 
    if (body.domainMode && body.domainMode !== conv.domainMode) {
      await app.prisma.conversation.update({
        where: { id: conv.id },
        data: { domainMode: body.domainMode }
      });
    }

    await app.prisma.message.create({
      data: { conversationId: conv.id, role: "user", content: body.text }
    });

    const answer = await generateGeminiReply({
      prisma: app.prisma,
      conversationId: conv.id,
      userText: body.text
    });

    await app.prisma.message.create({
      data: { conversationId: conv.id, role: "assistant", content: answer }
    });

    return { answer };
  });
}
