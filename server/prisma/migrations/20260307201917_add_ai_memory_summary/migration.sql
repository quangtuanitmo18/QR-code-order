-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AiChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" INTEGER,
    "accountId" INTEGER,
    "messages" TEXT NOT NULL,
    "summary" TEXT,
    "summaryVersion" INTEGER NOT NULL DEFAULT 0,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiChatSession_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiChatSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AiChatSession" ("accountId", "completionTokens", "createdAt", "guestId", "id", "messages", "promptTokens", "totalTokens", "updatedAt") SELECT "accountId", "completionTokens", "createdAt", "guestId", "id", "messages", "promptTokens", "totalTokens", "updatedAt" FROM "AiChatSession";
DROP TABLE "AiChatSession";
ALTER TABLE "new_AiChatSession" RENAME TO "AiChatSession";
CREATE INDEX "AiChatSession_guestId_idx" ON "AiChatSession"("guestId");
CREATE INDEX "AiChatSession_accountId_idx" ON "AiChatSession"("accountId");
CREATE INDEX "AiChatSession_updatedAt_idx" ON "AiChatSession"("updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
