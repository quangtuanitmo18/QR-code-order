-- CreateTable
CREATE TABLE "ExecutionTrace" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "originalMessage" TEXT NOT NULL,
    "taskCount" INTEGER NOT NULL,
    "completedCount" INTEGER NOT NULL,
    "blockedCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "totalLatencyMs" INTEGER NOT NULL,
    "traceData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ExecutionTrace_sessionId_idx" ON "ExecutionTrace"("sessionId");

-- CreateIndex
CREATE INDEX "ExecutionTrace_createdAt_idx" ON "ExecutionTrace"("createdAt");
