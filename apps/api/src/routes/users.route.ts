import { FastifyInstance } from "fastify";

export default async function usersRoutes(app: FastifyInstance) {
  // listar todos
  app.get("/users", async () => {
    const users = await app.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users;
  });
// criar usuarios
  app.post("/users", async (request, reply) => {
    const body = request.body as { name: string; username: string; email: string };
    if (!body?.name || !body?.username || !body?.email) {
      return reply.code(400).send({ error: "name, username e email são obrigatórios" });
    }
    const created = await app.prisma.user.create({ data: body });
    return reply.code(201).send(created);
  });
}
