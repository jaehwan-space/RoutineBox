"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerSchema, type RegisterInput } from "@routinebox/shared";
import { ApiError } from "@/lib/api";
import { authApi } from "./api";
import { ME_KEY } from "./useMe";
import { SocialButtons } from "./SocialButtons";
import styles from "./AuthForm.module.scss";

export function SignupForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const user = await authApi.register(values);
      qc.setQueryData(ME_KEY, user);
      router.push("/");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "회원가입 중 오류가 발생했습니다.");
    }
  });

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <h1 className={styles.title}>회원가입</h1>
      <p className={styles.subtitle}>이메일로 가입하거나 소셜 계정으로 시작하세요.</p>
      {serverError && <div className={styles.alert} role="alert">{serverError}</div>}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">이름</label>
        <input id="name" autoComplete="name" className={styles.input} aria-invalid={!!errors.name} {...register("name")} />
        {errors.name && <span className={styles.error}>{errors.name.message}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">이메일</label>
        <input id="email" type="email" autoComplete="email" className={styles.input} aria-invalid={!!errors.email} {...register("email")} />
        {errors.email && <span className={styles.error}>{errors.email.message}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">비밀번호 (8자 이상)</label>
        <input id="password" type="password" autoComplete="new-password" className={styles.input} aria-invalid={!!errors.password} {...register("password")} />
        {errors.password && <span className={styles.error}>{errors.password.message}</span>}
      </div>
      <button type="submit" className={styles.submit} disabled={isSubmitting}>{isSubmitting ? "가입 중…" : "가입하기"}</button>
      <div className={styles.divider}>또는</div>
      <SocialButtons />
      <p className={styles.footer}>이미 계정이 있으신가요? <Link href="/login">로그인</Link></p>
    </form>
  );
}
