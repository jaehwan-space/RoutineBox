"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UserDto } from "@routinebox/shared";
import { ApiError } from "@/lib/api";
import { authApi } from "./api";

export const ME_KEY = ["me"] as const;

/** 현재 로그인 사용자. 액세스 토큰이 만료되면 리프레시를 한 번 시도한다. */
export function useMe() {
  return useQuery<UserDto | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          try {
            return await authApi.refresh();
          } catch {
            return null;
          }
        }
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      router.push("/");
      router.refresh();
    },
  });
}
