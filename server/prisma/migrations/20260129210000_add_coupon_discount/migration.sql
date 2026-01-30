-- CreateTable
CREATE TABLE "Coupon" (
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
    CONSTRAINT "Coupon_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- CreateTable
CREATE TABLE "CouponUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "couponId" INTEGER NOT NULL,
    "guestId" INTEGER,
    "orderId" INTEGER,
    "paymentId" INTEGER,
    "discountAmount" INTEGER NOT NULL,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "CouponUsage_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT "CouponUsage_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "couponId" INTEGER;
ALTER TABLE "Order" ADD COLUMN "discountAmount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "couponId" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "discountAmount" INTEGER DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_status_startDate_endDate_idx" ON "Coupon"("status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");

-- CreateIndex
CREATE INDEX "CouponUsage_guestId_couponId_idx" ON "CouponUsage"("guestId", "couponId");

