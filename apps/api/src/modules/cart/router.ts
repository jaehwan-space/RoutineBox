import { Router } from "express";
import { cartCheckoutSchema, cartItemSchema, type CartCheckoutInput, type CartItemInput } from "@routinebox/shared";
import { getAuth, requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as cart from "./service.js";

export const cartRouter = Router();
cartRouter.use("/cart", requireAuth);

cartRouter.get("/cart", async (_req, res) => {
  res.json({ data: await cart.getCart(getAuth(res).userId) });
});

cartRouter.put("/cart/items", validate(cartItemSchema), async (_req, res) => {
  res.json({ data: await cart.putItem(getAuth(res).userId, res.locals.body as CartItemInput) });
});

cartRouter.delete("/cart/items/:productId", async (req, res) => {
  res.json({ data: await cart.removeItem(getAuth(res).userId, String(req.params.productId)) });
});

/** 담긴 상품 전부를 구독으로 만들고 장바구니를 비운다. */
cartRouter.post("/cart/checkout", validate(cartCheckoutSchema), async (_req, res) => {
  res.status(201).json({ data: await cart.checkout(getAuth(res).userId, res.locals.body as CartCheckoutInput) });
});
