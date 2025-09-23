import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

export type Prisma = PrismaClient;

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default fp(async (app) => {
  const prisma = new PrismaClient();

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  app.decorate("prisma", prisma);
});
