/*
  Warnings:

  - Made the column `typeId` on table `CalendarEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Conversation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL DEFAULT 'direct',
    "name" TEXT,
    "avatar" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversationId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "lastReadAt" DATETIME,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationParticipant_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationPin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversationId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "pinnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationPin_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationPin_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversationId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "replyToId" INTEGER,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageAttachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "messageId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "messageId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageReaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageReadReceipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "messageId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageReadReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageReadReceipt_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CalendarEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "typeId" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "color" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringRule" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarEvent_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "CalendarType" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);
INSERT INTO "new_CalendarEvent" ("allDay", "color", "createdAt", "createdById", "description", "endDate", "id", "isRecurring", "location", "recurringRule", "startDate", "title", "typeId", "updatedAt") SELECT "allDay", "color", "createdAt", "createdById", "description", "endDate", "id", "isRecurring", "location", "recurringRule", "startDate", "title", "typeId", "updatedAt" FROM "CalendarEvent";
DROP TABLE "CalendarEvent";
ALTER TABLE "new_CalendarEvent" RENAME TO "CalendarEvent";
CREATE INDEX "CalendarEvent_startDate_endDate_idx" ON "CalendarEvent"("startDate", "endDate");
CREATE INDEX "CalendarEvent_typeId_idx" ON "CalendarEvent"("typeId");
CREATE INDEX "CalendarEvent_createdById_idx" ON "CalendarEvent"("createdById");
CREATE TABLE "new_CalendarType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'bg-blue-500',
    "category" TEXT NOT NULL DEFAULT 'personal',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);
INSERT INTO "new_CalendarType" ("category", "color", "createdAt", "createdById", "id", "label", "name", "updatedAt", "visible") SELECT "category", "color", "createdAt", "createdById", "id", "label", "name", "updatedAt", "visible" FROM "CalendarType";
DROP TABLE "CalendarType";
ALTER TABLE "new_CalendarType" RENAME TO "CalendarType";
CREATE UNIQUE INDEX "CalendarType_name_key" ON "CalendarType"("name");
CREATE INDEX "CalendarType_category_idx" ON "CalendarType"("category");
CREATE INDEX "CalendarType_visible_idx" ON "CalendarType"("visible");
CREATE INDEX "CalendarType_createdById_idx" ON "CalendarType"("createdById");
CREATE TABLE "new_Coupon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "minOrderAmount" INTEGER,
    "applicableDishIds" TEXT,
    "maxTotalUsage" INTEGER,
    "maxUsagePerGuest" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Coupon_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);
INSERT INTO "new_Coupon" ("applicableDishIds", "code", "createdAt", "createdById", "discountType", "discountValue", "endDate", "id", "maxTotalUsage", "maxUsagePerGuest", "minOrderAmount", "startDate", "status", "updatedAt", "usageCount") SELECT "applicableDishIds", "code", "createdAt", "createdById", "discountType", "discountValue", "endDate", "id", "maxTotalUsage", "maxUsagePerGuest", "minOrderAmount", "startDate", "status", "updatedAt", "usageCount" FROM "Coupon";
DROP TABLE "Coupon";
ALTER TABLE "new_Coupon" RENAME TO "Coupon";
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX "Coupon_status_startDate_endDate_idx" ON "Coupon"("status", "startDate", "endDate");
CREATE TABLE "new_CouponUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "couponId" INTEGER NOT NULL,
    "guestId" INTEGER,
    "orderId" INTEGER,
    "paymentId" INTEGER,
    "discountAmount" INTEGER NOT NULL,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CouponUsage_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "CouponUsage_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);
INSERT INTO "new_CouponUsage" ("couponId", "discountAmount", "guestId", "id", "orderId", "paymentId", "usedAt") SELECT "couponId", "discountAmount", "guestId", "id", "orderId", "paymentId", "usedAt" FROM "CouponUsage";
DROP TABLE "CouponUsage";
ALTER TABLE "new_CouponUsage" RENAME TO "CouponUsage";
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
CREATE INDEX "CouponUsage_guestId_couponId_idx" ON "CouponUsage"("guestId", "couponId");
CREATE TABLE "new_EmployeeSpin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "rewardId" INTEGER,
    "eventId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "claimedAt" DATETIME,
    "expiredAt" DATETIME,
    "spinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdById" INTEGER,
    CONSTRAINT "EmployeeSpin_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "EmployeeSpin_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "SpinReward" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "EmployeeSpin_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SpinEvent" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "EmployeeSpin_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);
INSERT INTO "new_EmployeeSpin" ("claimedAt", "createdById", "employeeId", "eventId", "expiredAt", "id", "notes", "rewardId", "spinDate", "status") SELECT "claimedAt", "createdById", "employeeId", "eventId", "expiredAt", "id", "notes", "rewardId", "spinDate", "status" FROM "EmployeeSpin";
DROP TABLE "EmployeeSpin";
ALTER TABLE "new_EmployeeSpin" RENAME TO "EmployeeSpin";
CREATE INDEX "EmployeeSpin_employeeId_spinDate_idx" ON "EmployeeSpin"("employeeId", "spinDate");
CREATE INDEX "EmployeeSpin_status_expiredAt_idx" ON "EmployeeSpin"("status", "expiredAt");
CREATE INDEX "EmployeeSpin_createdById_idx" ON "EmployeeSpin"("createdById");
CREATE INDEX "EmployeeSpin_eventId_idx" ON "EmployeeSpin"("eventId");
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guestId" INTEGER,
    "tableNumber" INTEGER,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "orderHandlerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "paymentId" INTEGER,
    "couponId" INTEGER,
    "discountAmount" INTEGER DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Order_orderHandlerId_fkey" FOREIGN KEY ("orderHandlerId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Order_tableNumber_fkey" FOREIGN KEY ("tableNumber") REFERENCES "Table" ("number") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Order_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);
INSERT INTO "new_Order" ("couponId", "createdAt", "discountAmount", "guestId", "id", "orderHandlerId", "paymentId", "status", "tableNumber", "totalAmount", "updatedAt") SELECT "couponId", "createdAt", "discountAmount", "guestId", "id", "orderHandlerId", "paymentId", "status", "tableNumber", "totalAmount", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guestId" INTEGER,
    "tableNumber" INTEGER,
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "transactionRef" TEXT NOT NULL,
    "externalTransactionId" TEXT,
    "externalCustomerId" TEXT,
    "externalSessionId" TEXT,
    "paymentUrl" TEXT,
    "returnUrl" TEXT,
    "ipAddress" TEXT,
    "responseCode" TEXT,
    "responseMessage" TEXT,
    "bankCode" TEXT,
    "cardType" TEXT,
    "paymentIntentStatus" TEXT,
    "last4Digits" TEXT,
    "cardBrand" TEXT,
    "currency" TEXT DEFAULT 'VND',
    "metadata" TEXT,
    "description" TEXT,
    "note" TEXT,
    "paymentHandlerId" INTEGER,
    "couponId" INTEGER,
    "discountAmount" INTEGER DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    CONSTRAINT "Payment_paymentHandlerId_fkey" FOREIGN KEY ("paymentHandlerId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Payment_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Payment_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);
INSERT INTO "new_Payment" ("amount", "bankCode", "cardBrand", "cardType", "couponId", "createdAt", "currency", "description", "discountAmount", "externalCustomerId", "externalSessionId", "externalTransactionId", "guestId", "id", "ipAddress", "last4Digits", "metadata", "note", "paidAt", "paymentHandlerId", "paymentIntentStatus", "paymentMethod", "paymentUrl", "responseCode", "responseMessage", "returnUrl", "status", "tableNumber", "transactionRef", "updatedAt") SELECT "amount", "bankCode", "cardBrand", "cardType", "couponId", "createdAt", "currency", "description", "discountAmount", "externalCustomerId", "externalSessionId", "externalTransactionId", "guestId", "id", "ipAddress", "last4Digits", "metadata", "note", "paidAt", "paymentHandlerId", "paymentIntentStatus", "paymentMethod", "paymentUrl", "responseCode", "responseMessage", "returnUrl", "status", "tableNumber", "transactionRef", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_transactionRef_key" ON "Payment"("transactionRef");
CREATE TABLE "new_SpinEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpinEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);
INSERT INTO "new_SpinEvent" ("createdAt", "createdById", "description", "endDate", "id", "isActive", "name", "startDate", "updatedAt") SELECT "createdAt", "createdById", "description", "endDate", "id", "isActive", "name", "startDate", "updatedAt" FROM "SpinEvent";
DROP TABLE "SpinEvent";
ALTER TABLE "new_SpinEvent" RENAME TO "SpinEvent";
CREATE INDEX "SpinEvent_isActive_startDate_endDate_idx" ON "SpinEvent"("isActive", "startDate", "endDate");
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "dueDate" DATETIME,
    "assignedToId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assignedToId", "category", "createdAt", "createdById", "description", "dueDate", "id", "priority", "status", "title", "updatedAt") SELECT "assignedToId", "category", "createdAt", "createdById", "description", "dueDate", "id", "priority", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_category_idx" ON "Task"("category");
CREATE INDEX "Task_priority_idx" ON "Task"("priority");
CREATE INDEX "Task_title_idx" ON "Task"("title");
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");
CREATE TABLE "new_TaskAttachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskAttachment" ("createdAt", "fileName", "filePath", "fileSize", "id", "mimeType", "taskId", "uploadedById") SELECT "createdAt", "fileName", "filePath", "fileSize", "id", "mimeType", "taskId", "uploadedById" FROM "TaskAttachment";
DROP TABLE "TaskAttachment";
ALTER TABLE "new_TaskAttachment" RENAME TO "TaskAttachment";
CREATE INDEX "TaskAttachment_taskId_idx" ON "TaskAttachment"("taskId");
CREATE TABLE "new_TaskComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskComment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskComment" ("content", "createdAt", "createdById", "id", "taskId", "updatedAt") SELECT "content", "createdAt", "createdById", "id", "taskId", "updatedAt" FROM "TaskComment";
DROP TABLE "TaskComment";
ALTER TABLE "new_TaskComment" RENAME TO "TaskComment";
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Conversation_createdById_idx" ON "Conversation"("createdById");

-- CreateIndex
CREATE INDEX "Conversation_type_idx" ON "Conversation"("type");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_conversationId_idx" ON "ConversationParticipant"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_accountId_idx" ON "ConversationParticipant"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_accountId_key" ON "ConversationParticipant"("conversationId", "accountId");

-- CreateIndex
CREATE INDEX "ConversationPin_conversationId_idx" ON "ConversationPin"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationPin_accountId_idx" ON "ConversationPin"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationPin_conversationId_accountId_key" ON "ConversationPin"("conversationId", "accountId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_replyToId_idx" ON "Message"("replyToId");

-- CreateIndex
CREATE INDEX "Message_isDeleted_idx" ON "Message"("isDeleted");

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_idx" ON "MessageAttachment"("messageId");

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

-- CreateIndex
CREATE INDEX "MessageReaction_accountId_idx" ON "MessageReaction"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_accountId_emoji_key" ON "MessageReaction"("messageId", "accountId", "emoji");

-- CreateIndex
CREATE INDEX "MessageReadReceipt_messageId_idx" ON "MessageReadReceipt"("messageId");

-- CreateIndex
CREATE INDEX "MessageReadReceipt_accountId_idx" ON "MessageReadReceipt"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReadReceipt_messageId_accountId_key" ON "MessageReadReceipt"("messageId", "accountId");
