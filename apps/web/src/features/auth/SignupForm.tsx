"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerSchema, type RegisterInput } from "@routinebox/shared";
import { Button, Input } from "@/components/ui";
import { mergeLocalCart } from "@/features/cart/useCart";
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
      await mergeLocalCart(qc);
      router.push("/");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "회원가입 중 오류가 발생했습니다.");
    }
  });

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <div>
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>이메일로 가입하거나 소셜 계정으로 시작하세요.</p>
      </div>
      {serverError && <div className={styles.alert} role="alert">{serverError}</div>}
      <Input label="이름" autoComplete="name" error={errors.name?.message} {...register("name")} />
      <Input label="이메일" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Input label="비밀번호" type="password" autoComplete="new-password" helper="8자 이상" error={errors.password?.message} {...register("password")} />
      <Button type="submit" fullWidth loading={isSubmitting}>가입하기</Button>
      <div className={styles.divider}>또는</div>
      <SocialButtons />
      <p className={styles.footer}>이미 계정이 있으신가요? <Link href="/login">로그인</Link></p>
    </form>
  );
}
