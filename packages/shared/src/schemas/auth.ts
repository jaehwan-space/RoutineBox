import { z } from "zod";

export const registerSchema = z.object({
  email: z.email({ message: "올바른 이메일을 입력하세요." }).max(254),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(72),
  name: z.string().trim().min(1, "이름을 입력하세요.").max(30),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
