import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./plugins/env";
import { log } from "./lib/logger";
import { healthRoutes } from "./routes/health.route";
import prismaPlugin from "./plugins/prisma";
import telegramPlugin from "./plugins/telegram";

async function bootstrap() {
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(prismaPlugin);
  await app.register(telegramPlugin);

  await app.register(healthRoutes);
  await app.register(import("./routes/users.route"));
  await app.register(import("./routes/conversations.route"));
  await app.register(import("./routes/chat.route"));


  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    log.info(`API running on http://localhost:${env.PORT}`);
  } catch (err) {
    log.error("Failed to start server:", err);
    process.exit(1);
  }
}

bootstrap();
