import { z } from "zod";
import { CATEGORIES, CYCLE_MAX_DAYS, CYCLE_MIN_DAYS } from "../constants";

const productFields = {
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).default(""),
  category: z.enum(CATEGORIES),
  price: z.number().int().min(100).max(10_000_000),
  subscriptionDiscount: z.number().int().min(0).max(90).default(5),
  recommendedCycleDays: z.number().int().min(CYCLE_MIN_DAYS).max(CYCLE_MAX_DAYS).default(28),
  stock: z.number().int().min(0).max(1_000_000).default(0),
  imageUrl: z.string().trim().url().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
};

export const createProductSchema = z.object(productFields);
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: productFields.name.optional(),
  description: z.string().trim().max(500).optional(),
  category: productFields.category.optional(),
  price: productFields.price.optional(),
  subscriptionDiscount: z.number().int().min(0).max(90).optional(),
  recommendedCycleDays: z.number().int().min(CYCLE_MIN_DAYS).max(CYCLE_MAX_DAYS).optional(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  imageUrl: productFields.imageUrl,
  isActive: z.boolean().optional(),
}).refine((v) => Object.values(v).some((x) => x !== undefined), { message: "변경할 값이 없습니다." });
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const adminProductQuerySchema = z.object({
  q: z.string().trim().max(50).optional(),
  includeInactive: z.stringbool().default(true),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type AdminProductQuery = z.infer<typeof adminProductQuerySchema>;
