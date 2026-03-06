-- CreateTable
CREATE TABLE "AiChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" INTEGER,
    "accountId" INTEGER,
    "messages" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiChatSession_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiChatSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AiChatSession_guestId_idx" ON "AiChatSession"("guestId");

-- CreateIndex
CREATE INDEX "AiChatSession_accountId_idx" ON "AiChatSession"("accountId");

-- CreateIndex
CREATE INDEX "AiChatSession_updatedAt_idx" ON "AiChatSession"("updatedAt");
