"use client";

import Link from "next/link";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { Button, IconButton } from "@/components/ui";
import { useLogout, useMe } from "@/features/auth/useMe";
import styles from "./Header.module.scss";

export function HeaderUser() {
  const { data: me, isPending } = useMe();
  const logout = useLogout();

  if (isPending) return <span className={styles.userPlaceholder} aria-hidden />;
  if (!me) {
    return <Button href="/login" variant="secondary" size="sm" leadingIcon={<User />}>로그인</Button>;
  }
  return (
    <div className={styles.user}>
      {me.role === "ADMIN" && <Link href="/admin" className={styles.iconLink} aria-label="관리자"><ShieldCheck /></Link>}
      <Link href="/account" className={styles.userName}>{me.name}님</Link>
      <IconButton aria-label="로그아웃" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut /></IconButton>
    </div>
  );
}
