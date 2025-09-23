-- CreateEnum
CREATE TYPE "public"."DomainMode" AS ENUM ('generic', 'mikrotik');

-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "domainMode" "public"."DomainMode" NOT NULL DEFAULT 'generic';
