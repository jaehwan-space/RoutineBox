"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui";
import { useMe } from "@/features/auth/useMe";

/** 로그인이 필요한 화면을 감싼다. 비로그인이면 /login?next= 로 보낸다. */
export function RequireAuth({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { data: me, isPending } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !me) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isPending, me, router, pathname]);

  if (isPending || !me) return <>{fallback ?? <Skeleton height={160} />}</>;
  return <>{children}</>;
}

/** ADMIN 전용 화면. 비로그인은 로그인으로, 일반 회원은 안내 문구를 본다(API 도 403 으로 막는다). */
export function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AdminGate>{children}</AdminGate>
    </RequireAuth>
  );
}

function AdminGate({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  if (me?.role !== "ADMIN") {
    return (
      <div style={{ maxWidth: 480, margin: "64px auto", padding: "0 16px", textAlign: "center" }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>관리자만 볼 수 있는 화면이에요</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>관리자 계정으로 로그인해 주세요.</p>
      </div>
    );
  }
  return <>{children}</>;
}
