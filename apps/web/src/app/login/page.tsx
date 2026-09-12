import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/LoginForm";
import styles from "@/features/auth/AuthForm.module.scss";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <div className={styles.wrap}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
