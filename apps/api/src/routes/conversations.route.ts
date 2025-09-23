import { FastifyInstance } from "fastify";

export default async function conversationsRoutes(app: FastifyInstance) {
  app.post("/conversations", async (request) => {
    const body = (request.body ?? {}) as { title?: string; domainMode?: "generic" | "mikrotik" };

    const user = await app.prisma.user.upsert({
      where: { username: "web_default" },
      update: {},
      create: { name: "Web User", username: "web_default", email: "web_default@example.com" }
    });

    const conv = await app.prisma.conversation.create({
      data: {
        userId: user.id,
        channel: "web",
        title: body.title ?? "Web chat",
        domainMode: body.domainMode ?? "generic",
      }
    });

    return { id: conv.id, domainMode: conv.domainMode };
  });
}
