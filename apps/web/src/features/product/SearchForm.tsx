"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui";
import { cx } from "@/lib/cx";
import styles from "./SearchForm.module.scss";

export function SearchForm({ initial = "", category, className, compact }: { initial?: string; category?: string; className?: string; compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (category) p.set("category", category);
    const s = p.toString();
    router.push(`/products${s ? `?${s}` : ""}`);
  };
  return (
    <form role="search" onSubmit={onSubmit} className={cx(styles.form, compact && styles.compact, className)}>
      <Input aria-label="상품 검색" placeholder="무엇을 정기적으로 받아볼까요?" leading={<Search />} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
    </form>
  );
}
