import type { Metadata } from "next";
import { AdminProducts } from "@/features/admin/AdminProducts";

export const metadata: Metadata = { title: "상품 관리" };

export default function AdminProductsPage() {
  return <AdminProducts />;
}
