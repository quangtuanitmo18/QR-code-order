-- CreateTable
CREATE TABLE "Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guestId" INTEGER NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "foodQuality" INTEGER NOT NULL,
    "serviceQuality" INTEGER NOT NULL,
    "ambiance" INTEGER NOT NULL,
    "priceValue" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "images" TEXT,
    "status" TEXT NOT NULL DEFAULT 'HIDDEN',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "approvedAt" DATETIME,
    "approvedBy" INTEGER,
    "replyContent" TEXT,
    "repliedAt" DATETIME,
    "repliedBy" INTEGER,
    CONSTRAINT "Review_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "Review_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Review_repliedBy_fkey" FOREIGN KEY ("repliedBy") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- CreateIndex
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Review_overallRating_idx" ON "Review"("overallRating");

-- CreateIndex
CREATE INDEX "Review_guestId_idx" ON "Review"("guestId");
