import type { Metadata } from "next";
import { RequireAuth } from "@/components/RequireAuth";
import { AccountView } from "@/features/account/AccountView";

export const metadata: Metadata = { title: "내 정보" };

export default function AccountPage() {
  return <RequireAuth><AccountView /></RequireAuth>;
}
