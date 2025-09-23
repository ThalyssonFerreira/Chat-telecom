import { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return {
      ok: true,
      service: "telecom-assistente-api",
      ts: new Date().toISOString()
    };
  });
}
