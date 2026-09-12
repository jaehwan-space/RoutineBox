import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/SignupForm";
import styles from "@/features/auth/AuthForm.module.scss";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <div className={styles.wrap}>
      <SignupForm />
    </div>
  );
}
