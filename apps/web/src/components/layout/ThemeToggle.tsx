"use client";

import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui";
import { useTheme } from "@/design/theme";

/** 라이트/다크 전환 버튼. 현재 해석된 테마의 반대로 바꾼다. */
export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <IconButton aria-label={next === "dark" ? "다크 모드로 전환" : "라이트 모드로 전환"} onClick={() => setTheme(next)}>
      {resolved === "dark" ? <Sun /> : <Moon />}
    </IconButton>
  );
}
