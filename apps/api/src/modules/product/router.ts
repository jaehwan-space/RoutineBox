import { Router } from "express";
import { createProductSchema, productQuerySchema, updateProductSchema, type CreateProductInput, type ProductQuery, type UpdateProductInput } from "@routinebox/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as products from "./service.js";

export const productRouter = Router();

productRouter.get("/products", validate(productQuerySchema, "query"), async (_req, res) => {
  res.json({ data: await products.listProducts(res.locals.query as ProductQuery) });
});

productRouter.get("/products/:id", async (req, res) => {
  res.json({ data: await products.getProduct(String(req.params.id)) });
});

// 관리자: 등록·수정(품절·비활성 포함)
productRouter.post("/products", requireAuth, requireRole("ADMIN"), validate(createProductSchema), async (_req, res) => {
  res.status(201).json({ data: await products.createProduct(res.locals.body as CreateProductInput) });
});

productRouter.patch("/products/:id", requireAuth, requireRole("ADMIN"), validate(updateProductSchema), async (req, res) => {
  res.json({ data: await products.updateProduct(String(req.params.id), res.locals.body as UpdateProductInput) });
});
