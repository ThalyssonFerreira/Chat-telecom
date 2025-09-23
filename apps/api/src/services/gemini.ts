import { GoogleGenAI } from "@google/genai";
import type { PrismaClient } from "@prisma/client";
import { env } from "../plugins/env";

type Role = "user" | "assistant" | "system";
const toGeminiRole = (r: Role): "user" | "model" => (r === "user" ? "user" : "model");

// Base genérica
const SYSTEM_GENERIC = `
Você é o assistente da (Tatione Telecom). Foque em telecom, atendimento claro, prático e humano.
Quando faltar contexto, peça os dados necessários.
`;

// **Especialização MikroTik (RouterOS v7)**
const SYSTEM_MIKROTIK = `
Você é um especialista em redes e MikroTik (RouterOS v7).
Regras:
- Sempre prefira comandos v7 com prefixos (ex.: /interface, /ip, /routing).
- Verifique coerência dos comandos e **não use** ações destrutivas sem confirmação (ex.: /system reset-configuration).
- Para NAT básico: use masquerade em out-interface WAN. Para port-forward, use dst-nat + firewall filter quando necessário.
- Para VLAN: use bridge vlan-filtering, portas trunk/access, tagging correto, pvid e frame-types.
- Para PPPoE: server no concentrador, client no CPE. Checar MTU/MRU 1492 e MSS clamp quando aplicável.
- Para Wi-Fi (CAPsMAN ou wifiwave2), dê comandos por perfil e segurança WPA2/WPA3 quando suportado.
- Sempre explique brevemente **por que** os comandos resolvem o problema.
- Se faltar contexto essencial (modelo do roteador, RouterOS versão, interfaces WAN/LAN, VLAN IDs), peça antes.
Formato:
- Devolva trechos de configuração em blocos de código com sintaxe RouterOS.
- Quando possível, dê também comandos de verificação (/interface/print, /ip/address/print, /log/print).
`;


function systemFor(mode: "generic" | "mikrotik") {
  return mode === "mikrotik" ? SYSTEM_MIKROTIK : SYSTEM_GENERIC;
}

type HistoryItem = { role: Role | string; content: string };

export async function generateGeminiReply({
  prisma,
  conversationId,
  userText,
  maxHistory = 6,
  model = env.GEMINI_MODEL,
}: {
  prisma: PrismaClient;
  conversationId: string;
  userText: string;
  maxHistory?: number;
  model?: string;
}) {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  const mode = (conv?.domainMode as "generic" | "mikrotik" | undefined) ?? "generic";

  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: maxHistory,
  });
  history.reverse();

  const contents = [
    { role: "user", parts: [{ text: systemFor(mode) }] },
    ...history.map((m: { role: string; content: string }) => ({ role: toGeminiRole(m.role as Role), parts: [{ text: m.content }] })),
    { role: "user", parts: [{ text: userText }] },
  ];

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({
    model,
    contents,
    config: { thinkingConfig: { thinkingBudget: env.GEMINI_THINKING_BUDGET ?? 512 } },
  });

  const text = (res.text || "").trim();
  return text || "Desculpe, não consegui gerar uma resposta agora.";
}

export function splitIntoChunks(s: string, max = 3800) {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max));
  return out;
}
