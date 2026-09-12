"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@routinebox/shared";
import { Button, Input } from "@/components/ui";
import { mergeLocalCart } from "@/features/cart/useCart";
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
  const next = params.get("next");
  const [serverError, setServerError] = useState<string | null>(OAUTH_ERRORS[params.get("error") ?? ""] ?? null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const user = await authApi.login(values);
      qc.setQueryData(ME_KEY, user);
      await mergeLocalCart(qc);
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "로그인 중 오류가 발생했습니다.");
    }
  });

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <div>
        <h1 className={styles.title}>로그인</h1>
        <p className={styles.subtitle}>루틴박스에 오신 것을 환영합니다.</p>
      </div>
      {serverError && <div className={styles.alert} role="alert">{serverError}</div>}
      <Input label="이메일" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Input label="비밀번호" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
      <Button type="submit" fullWidth loading={isSubmitting}>로그인</Button>
      <div className={styles.divider}>또는</div>
      <SocialButtons />
      <p className={styles.footer}>계정이 없으신가요? <Link href="/signup">회원가입</Link></p>
    </form>
  );
}
