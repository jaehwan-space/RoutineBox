import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.ts";
import { prisma } from "../src/lib/prisma.ts";

const app = createApp();
const tag = `t${Date.now()}`;
const names = [`${tag} 세탁세제`, `${tag} 화장지`, `${tag} 생수`];

beforeAll(async () => {
  await prisma.product.createMany({
    data: [
      { name: names[0]!, description: "고농축", category: "DETERGENT", price: 12900, recommendedCycleDays: 28, stock: 10 },
      { name: names[1]!, description: "3겹", category: "TISSUE", price: 15900, recommendedCycleDays: 28, stock: 10 },
      { name: names[2]!, description: "무라벨", category: "WATER", price: 9900, recommendedCycleDays: 14, stock: 10, isActive: false },
    ],
  });
});
afterAll(async () => {
  await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
  await prisma.$disconnect();
});

describe("상품 API", () => {
  it("목록: 활성 상품만, 구독가 포함", async () => {
    const res = await request(app).get(`/products?q=${tag}&pageSize=10`);
    expect(res.status).toBe(200);
    const items = res.body.data.items as Array<{ name: string; price: number; subscriptionPrice: number }>;
    expect(items.map((i) => i.name).sort()).toEqual([names[0], names[1]].sort());
    const detergent = items.find((i) => i.name === names[0])!;
    expect(detergent.subscriptionPrice).toBe(12250); // 12900 × 0.95 = 12255 → 10원 단위 내림
    expect(res.body.data.total).toBe(2);
  });

  it("카테고리 필터", async () => {
    const res = await request(app).get(`/products?q=${tag}&category=TISSUE`);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].category).toBe("TISSUE");
  });

  it("페이지네이션", async () => {
    const res = await request(app).get(`/products?q=${tag}&page=2&pageSize=1`);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.page).toBe(2);
  });

  it("잘못된 카테고리는 400", async () => {
    const res = await request(app).get("/products?category=NOPE");
    expect(res.status).toBe(400);
  });

  it("상세: 없는 id 또는 비활성은 404", async () => {
    const inactive = await prisma.product.findFirst({ where: { name: names[2] } });
    expect((await request(app).get("/products/nope")).status).toBe(404);
    expect((await request(app).get(`/products/${inactive!.id}`)).status).toBe(404);
  });
});
