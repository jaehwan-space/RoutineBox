"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@routinebox/shared";
import { ApiError } from "@/lib/api";
import { authApi } from "./api";
import { ME_KEY } from "./useMe";
import { SocialButtons } from "./SocialButtons";
import styles from "./AuthForm.module.scss";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_state: "소셜 로그인 요청이 만료되었습니다. 다시 시도해 주세요.",
  oauth_failed: "소셜 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
};

export function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(OAUTH_ERRORS[params.get("error") ?? ""] ?? null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const user = await authApi.login(values);
      qc.setQueryData(ME_KEY, user);
      router.push("/");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "로그인 중 오류가 발생했습니다.");
    }
  });

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <h1 className={styles.title}>로그인</h1>
      <p className={styles.subtitle}>루틴박스에 오신 것을 환영합니다.</p>
      {serverError && <div className={styles.alert} role="alert">{serverError}</div>}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">이메일</label>
        <input id="email" type="email" autoComplete="email" className={styles.input} aria-invalid={!!errors.email} {...register("email")} />
        {errors.email && <span className={styles.error}>{errors.email.message}</span>}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">비밀번호</label>
        <input id="password" type="password" autoComplete="current-password" className={styles.input} aria-invalid={!!errors.password} {...register("password")} />
        {errors.password && <span className={styles.error}>{errors.password.message}</span>}
      </div>
      <button type="submit" className={styles.submit} disabled={isSubmitting}>{isSubmitting ? "로그인 중…" : "로그인"}</button>
      <div className={styles.divider}>또는</div>
      <SocialButtons />
      <p className={styles.footer}>계정이 없으신가요? <Link href="/signup">회원가입</Link></p>
    </form>
  );
}
