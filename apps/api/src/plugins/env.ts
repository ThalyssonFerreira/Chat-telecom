import * as dotenv from "dotenv";
dotenv.config();

const required = ["PORT"] as const;
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[ENV] Missing required variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT) || 3333,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
  GEMINI_THINKING_BUDGET:
    typeof process.env.GEMINI_THINKING_BUDGET === "string"
      ? Number(process.env.GEMINI_THINKING_BUDGET)
      : -1,
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ?? ""
};
