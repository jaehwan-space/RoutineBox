import { Router } from "express";
import { productQuerySchema, type ProductQuery } from "@routinebox/shared";
import { validate } from "../../middleware/validate.js";
import * as products from "./service.js";

export const productRouter = Router();

productRouter.get("/products", validate(productQuerySchema, "query"), async (_req, res) => {
  res.json({ data: await products.listProducts(res.locals.query as ProductQuery) });
});

productRouter.get("/products/:id", async (req, res) => {
  res.json({ data: await products.getProduct(String(req.params.id)) });
});
