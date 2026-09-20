import { z } from "zod";
import { CATEGORIES } from "../constants";

export const productQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  q: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;
