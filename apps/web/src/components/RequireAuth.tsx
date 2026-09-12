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
