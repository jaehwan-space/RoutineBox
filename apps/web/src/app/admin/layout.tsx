import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/AdminShell";

export const metadata: Metadata = { title: { default: "관리자", template: "%s | 관리자 | 루틴박스" } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
