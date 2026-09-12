import type { Prisma, Product } from "@prisma/client";
import { subscriptionUnitPrice, type Paginated, type ProductDto, type ProductQuery } from "@routinebox/shared";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

export function toProductDto(p: Product): ProductDto {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    subscriptionDiscount: p.subscriptionDiscount,
    subscriptionPrice: subscriptionUnitPrice(p.price, p.subscriptionDiscount),
    recommendedCycleDays: p.recommendedCycleDays,
    stock: p.stock,
    imageUrl: p.imageUrl,
  };
}

export async function listProducts(query: ProductQuery): Promise<Paginated<ProductDto>> {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(query.category ? { category: query.category } : {}),
    ...(query.q
      ? { OR: [{ name: { contains: query.q, mode: "insensitive" } }, { description: { contains: query.q, mode: "insensitive" } }] }
      : {}),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy: [{ createdAt: "asc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
  ]);
  return { items: rows.map(toProductDto), page: query.page, pageSize: query.pageSize, total };
}

export async function getProduct(id: string): Promise<ProductDto> {
  const p = await prisma.product.findFirst({ where: { id, isActive: true } });
  if (!p) throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  return toProductDto(p);
}
