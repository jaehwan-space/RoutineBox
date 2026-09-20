import type { Prisma, Product } from "@prisma/client";
import { subscriptionUnitPrice, type AdminProductQuery, type CreateProductInput, type Paginated, type ProductAdminDto, type ProductDto, type ProductQuery, type UpdateProductInput } from "@routinebox/shared";
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

// ---- 관리자 ----
export function toProductAdminDto(p: Product): ProductAdminDto {
  return { ...toProductDto(p), isActive: p.isActive, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

export async function listAllProducts(query: AdminProductQuery): Promise<Paginated<ProductAdminDto>> {
  const where: Prisma.ProductWhereInput = {
    ...(query.includeInactive ? {} : { isActive: true }),
    ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy: [{ createdAt: "asc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
  ]);
  return { items: rows.map(toProductAdminDto), page: query.page, pageSize: query.pageSize, total };
}

export async function createProduct(input: CreateProductInput): Promise<ProductAdminDto> {
  const p = await prisma.product.create({ data: { ...input, imageUrl: input.imageUrl ?? null } });
  return toProductAdminDto(p);
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductAdminDto> {
  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) throw new AppError("NOT_FOUND", "상품을 찾을 수 없습니다.");
  const p = await prisma.product.update({ where: { id }, data: input });
  return toProductAdminDto(p);
}
