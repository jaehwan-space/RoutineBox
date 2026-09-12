"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useLogout, useMe } from "@/features/auth/useMe";
import styles from "./Header.module.scss";

export function HeaderUser() {
  const { data: me, isPending } = useMe();
  const logout = useLogout();

  if (isPending) return <span className={styles.userPlaceholder} aria-hidden />;
  if (!me) {
    return (
      <Link href="/login" className={styles.login}>
        <User size={16} /> 로그인
      </Link>
    );
  }
  return (
    <div className={styles.user}>
      <Link href="/account" className={styles.userName}>{me.name}님</Link>
      <button type="button" className={styles.logout} onClick={() => logout.mutate()} disabled={logout.isPending} aria-label="로그아웃">
        <LogOut size={16} />
      </button>
    </div>
  );
}
