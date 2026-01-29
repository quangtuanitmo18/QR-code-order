/*
  Warnings:

  - You are about to drop the column `dishSnapshotId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Order` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "dishSnapshotId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_dishSnapshotId_fkey" FOREIGN KEY ("dishSnapshotId") REFERENCES "DishSnapshot" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "guestId" INTEGER,
    "tableNumber" INTEGER,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "orderHandlerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "paymentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Order_orderHandlerId_fkey" FOREIGN KEY ("orderHandlerId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Order_tableNumber_fkey" FOREIGN KEY ("tableNumber") REFERENCES "Table" ("number") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "Order_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);
INSERT INTO "new_Order" ("createdAt", "guestId", "id", "orderHandlerId", "paymentId", "status", "tableNumber", "updatedAt") SELECT "createdAt", "guestId", "id", "orderHandlerId", "paymentId", "status", "tableNumber", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
