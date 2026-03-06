-- AlterTable: Add token tracking fields to AiChatSession
ALTER TABLE "AiChatSession" ADD COLUMN "promptTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AiChatSession" ADD COLUMN "completionTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AiChatSession" ADD COLUMN "totalTokens" INTEGER NOT NULL DEFAULT 0;