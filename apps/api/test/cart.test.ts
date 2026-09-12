import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.ts";
import { prisma } from "../src/lib/prisma.ts";

const app = createApp();
const tag = `cart${Date.now()}`;
const email = `${tag}@test.local`;
let productId = "";

beforeAll(async () => {
  const p = await prisma.product.create({ data: { name: `${tag} 세제`, category: "DETERGENT", price: 10000, recommendedCycleDays: 28, stock: 5 } });
  productId = p.id;
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.product.deleteMany({ where: { name: { startsWith: tag } } });
  await prisma.$disconnect();
});

describe("장바구니 API", () => {
  const agent = request.agent(app);

  it("비로그인은 401", async () => {
    expect((await request(app).get("/cart")).status).toBe(401);
  });

  it("담기 → 수량 변경 → 합계", async () => {
    await agent.post("/auth/register").send({ email, password: "password123", name: "장바구니" });
    let res = await agent.put("/cart/items").send({ productId, quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.itemCount).toBe(2);
    expect(res.body.data.total).toBe(9500 * 2); // 10000 × 0.95 = 9500
    res = await agent.put("/cart/items").send({ productId, quantity: 3 });
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(3);
  });

  it("없는 상품은 404, 수량 0은 400", async () => {
    expect((await agent.put("/cart/items").send({ productId: "nope", quantity: 1 })).status).toBe(404);
    expect((await agent.put("/cart/items").send({ productId, quantity: 0 })).status).toBe(400);
  });

  it("삭제 후 빈 장바구니", async () => {
    const res = await agent.delete(`/cart/items/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });
});
