-- AlterEnum: 식품 카테고리 추가 (기존 생활용품 카테고리는 유지)
ALTER TYPE "Category" ADD VALUE 'SALAD_MEAL';
ALTER TYPE "Category" ADD VALUE 'FRUIT_NUT_RICE';
ALTER TYPE "Category" ADD VALUE 'SOUP_SIDE_MAIN';
ALTER TYPE "Category" ADD VALUE 'MEAT_EGG';
ALTER TYPE "Category" ADD VALUE 'BAKERY_CHEESE_DELI';
ALTER TYPE "Category" ADD VALUE 'SEAFOOD';
ALTER TYPE "Category" ADD VALUE 'SNACK';
ALTER TYPE "Category" ADD VALUE 'HEALTH';

-- AlterTable: 상품 상세 정보 (외부 데이터 임포트)
ALTER TABLE "Product"
  ADD COLUMN "externalId" TEXT,
  ADD COLUMN "brand" TEXT,
  ADD COLUMN "detailDescription" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "detailImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "weight" TEXT,
  ADD COLUMN "unitOfSale" TEXT,
  ADD COLUMN "packagingType" TEXT,
  ADD COLUMN "deliveryType" TEXT,
  ADD COLUMN "origin" TEXT,
  ADD COLUMN "allergy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_externalId_key" ON "Product"("externalId");
