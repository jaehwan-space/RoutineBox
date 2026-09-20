import "../src/env.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, type Category } from "@prisma/client";
import { CATEGORY_CYCLE_DAYS } from "@routinebox/shared";

/**
 * 외부 상품 데이터(prisma/data/kurly-products.json) 를 Product 테이블에 넣는다. externalId 기준 upsert 라 여러 번 실행해도 안전하다.
 *   로컬:  pnpm --filter @routinebox/api db:import
 *   운영:  docker compose -f docker-compose.prod.yml exec api pnpm --filter @routinebox/api exec tsx prisma/import-products.ts
 * 이미지는 apps/web/public/media/products/<externalId>/ 에 있어야 한다 (개발은 Next 가, 운영은 nginx 가 /media/ 를 서빙).
 */
interface Row {
  externalId: string; name: string; description: string; detailDescription: string; category: Category;
  price: number; discountRate: number; brand: string | null; weight: string | null; unitOfSale: string | null;
  packagingType: string | null; deliveryType: string | null; origin: string | null; allergy: string | null;
  imageUrl: string; detailImages: string[]; createdAt: string;
}

const prisma = new PrismaClient();
const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "data/kurly-products.json");

async function main() {
  const rows = JSON.parse(readFileSync(file, "utf8")) as Row[];
  let created = 0, updated = 0;
  for (const r of rows) {
    const data = {
      name: r.name, description: r.description, detailDescription: r.detailDescription, category: r.category,
      price: r.price, subscriptionDiscount: r.discountRate > 0 ? Math.min(r.discountRate, 90) : 5,
      recommendedCycleDays: CATEGORY_CYCLE_DAYS[r.category] ?? 14,
      brand: r.brand, weight: r.weight, unitOfSale: r.unitOfSale, packagingType: r.packagingType, deliveryType: r.deliveryType,
      origin: r.origin, allergy: r.allergy, imageUrl: r.imageUrl, detailImages: r.detailImages, isActive: true,
    };
    const exists = await prisma.product.findUnique({ where: { externalId: r.externalId }, select: { id: true } });
    if (exists) { await prisma.product.update({ where: { externalId: r.externalId }, data }); updated += 1; }
    else { await prisma.product.create({ data: { ...data, externalId: r.externalId, stock: 100, createdAt: new Date(r.createdAt) } }); created += 1; }
  }
  console.log(`[import] products: ${rows.length} rows → created ${created}, updated ${updated}, total ${await prisma.product.count()}`);
}

main().catch((err) => { console.error(err); process.exitCode = 1; }).finally(() => prisma.$disconnect());
