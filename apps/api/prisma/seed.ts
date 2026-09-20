import "../src/env.js";
import { Category, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRODUCTS: Array<{ name: string; description: string; category: Category; price: number; recommendedCycleDays: number; stock: number; imageUrl: string }> = [
  { name: "액체 세탁세제 3L", imageUrl: "/images/products/laundry-detergent.svg", description: "표준 세탁 40회 분량. 드럼·통돌이 겸용 고농축 액체 세제.", category: "DETERGENT", price: 12900, recommendedCycleDays: 28, stock: 120 },
  { name: "섬유유연제 2.5L", imageUrl: "/images/products/fabric-softener.svg", description: "은은한 코튼 향, 정전기 방지. 세탁 30회 분량.", category: "DETERGENT", price: 9900, recommendedCycleDays: 42, stock: 90 },
  { name: "3겹 화장지 30롤", imageUrl: "/images/products/toilet-tissue.svg", description: "천연펄프 100%, 롤당 30m. 1인 가구 기준 약 한 달 사용.", category: "TISSUE", price: 15900, recommendedCycleDays: 28, stock: 200 },
  { name: "키친타월 12롤", imageUrl: "/images/products/kitchen-towel.svg", description: "두 겹 엠보싱, 롤당 120매.", category: "TISSUE", price: 8900, recommendedCycleDays: 42, stock: 150 },
  { name: "생수 2L × 12병", imageUrl: "/images/products/water-2l.svg", description: "먹는샘물, 무라벨 친환경 병.", category: "WATER", price: 9900, recommendedCycleDays: 14, stock: 300 },
  { name: "탄산수 500ml × 20병", imageUrl: "/images/products/sparkling-water.svg", description: "플레인 탄산수, 강탄산.", category: "WATER", price: 11900, recommendedCycleDays: 14, stock: 180 },
  { name: "원두 1kg", imageUrl: "/images/products/coffee-beans.svg", description: "브라질·콜롬비아 블렌드, 중배전. 로스팅 후 3일 이내 출고.", category: "COFFEE", price: 18500, recommendedCycleDays: 28, stock: 80 },
  { name: "드립백 커피 30개입", imageUrl: "/images/products/drip-bag-coffee.svg", description: "개별 포장 드립백, 에티오피아 싱글 오리진.", category: "COFFEE", price: 16900, recommendedCycleDays: 28, stock: 100 },
  { name: "주방세제 1L", imageUrl: "/images/products/dish-soap.svg", description: "잔류 없는 식물성 세정 성분, 리필 가능 용기.", category: "KITCHEN", price: 6900, recommendedCycleDays: 42, stock: 140 },
  { name: "종량제 봉투 20L × 20매", imageUrl: "/images/products/trash-bags.svg", description: "서울시 일반 종량제 봉투(자치구 선택은 주문 후 안내).", category: "KITCHEN", price: 10800, recommendedCycleDays: 56, stock: 160 },
  { name: "고양이 모래 7L", imageUrl: "/images/products/cat-litter.svg", description: "벤토나이트, 빠른 응고와 탈취.", category: "PET", price: 14000, recommendedCycleDays: 28, stock: 70 },
  { name: "강아지 배변패드 100매", imageUrl: "/images/products/pee-pads.svg", description: "5겹 흡수, 50×40cm.", category: "PET", price: 17900, recommendedCycleDays: 28, stock: 60 },
];

async function main() {
  for (const p of PRODUCTS) {
    const exists = await prisma.product.findFirst({ where: { name: p.name } });
    if (!exists) await prisma.product.create({ data: p });
    else if (!exists.imageUrl) await prisma.product.update({ where: { id: exists.id }, data: { imageUrl: p.imageUrl } }); // 이미지가 없던 기존 상품에만 채운다
  }
  console.log(`[seed] products: ${await prisma.product.count()}`);

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminPassword) {
    const email = "admin@routinebox.local";
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN", passwordHash },
      create: { email, name: "관리자", role: "ADMIN", passwordHash },
    });
    console.log(`[seed] admin: ${email}`);
  }
}

main().finally(() => prisma.$disconnect());
