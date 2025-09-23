import { GoogleGenAI } from "@google/genai";
import { env } from "../plugins/env";

async function main() {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({
    model: env.GEMINI_MODEL || "gemini-2.5-pro",
    contents: "Explique roteador em linguagem simples.",
    config: { thinkingConfig: { thinkingBudget: env.GEMINI_THINKING_BUDGET ?? -1 } }
  });
  console.log("Resposta:", res.text);
}

main().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});
