/*
  Warnings:

  - A unique constraint covering the columns `[externalChatId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ChannelType" AS ENUM ('web', 'telegram');

-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "channel" "public"."ChannelType" NOT NULL DEFAULT 'web',
ADD COLUMN     "externalChatId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_externalChatId_key" ON "public"."Conversation"("externalChatId");
