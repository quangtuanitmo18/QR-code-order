-- CreateTable
CREATE TABLE "SpinReward" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "probability" REAL NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'bg-blue-500',
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "maxQuantity" INTEGER,
    "currentQuantity" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "eventId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpinReward_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SpinEvent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "EmployeeSpin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "rewardId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "claimedAt" DATETIME,
    "expiredAt" DATETIME,
    "spinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdById" INTEGER,
    CONSTRAINT "EmployeeSpin_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "EmployeeSpin_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "SpinReward" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "EmployeeSpin_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON UPDATE NO ACTION
);

-- CreateIndex
CREATE INDEX "SpinReward_isActive_order_idx" ON "SpinReward"("isActive", "order");

-- CreateIndex
CREATE INDEX "SpinReward_isActive_currentQuantity_maxQuantity_idx" ON "SpinReward"("isActive", "currentQuantity", "maxQuantity");

-- CreateIndex
CREATE INDEX "EmployeeSpin_employeeId_spinDate_idx" ON "EmployeeSpin"("employeeId", "spinDate");

-- CreateIndex
CREATE INDEX "EmployeeSpin_status_expiredAt_idx" ON "EmployeeSpin"("status", "expiredAt");

-- CreateIndex
CREATE INDEX "EmployeeSpin_createdById_idx" ON "EmployeeSpin"("createdById");
