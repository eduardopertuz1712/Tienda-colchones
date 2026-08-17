-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_productId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_tenantId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "minStock",
DROP COLUMN "stock";

-- DropTable
DROP TABLE "InventoryMovement";

-- DropEnum
DROP TYPE "InventoryMovementType";

