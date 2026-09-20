"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CATEGORIES, CATEGORY_LABELS, CYCLE_MAX_DAYS, CYCLE_MIN_DAYS, formatKrw, type Category, type ProductAdminDto } from "@routinebox/shared";
import { Badge, Button, Card, Dialog, Input, Select, Skeleton } from "@/components/ui";
import { useAdminActions, useAdminProducts } from "./useAdmin";
import styles from "./Admin.module.scss";

interface Form { name: string; description: string; category: Category; price: string; subscriptionDiscount: string; recommendedCycleDays: string; stock: string; imageUrl: string; isActive: boolean }
const empty: Form = { name: "", description: "", category: "DETERGENT", price: "", subscriptionDiscount: "5", recommendedCycleDays: "28", stock: "0", imageUrl: "", isActive: true };
const fromProduct = (p: ProductAdminDto): Form => ({ name: p.name, description: p.description, category: p.category, price: String(p.price), subscriptionDiscount: String(p.subscriptionDiscount), recommendedCycleDays: String(p.recommendedCycleDays), stock: String(p.stock), imageUrl: p.imageUrl ?? "", isActive: p.isActive });

export function AdminProducts() {
  const [q, setQ] = useState("");
  const { data, isPending } = useAdminProducts(q || undefined);
  const { createProduct, updateProduct } = useAdminActions();
  const [editing, setEditing] = useState<ProductAdminDto | null | "new">(null);
  const [form, setForm] = useState<Form>(empty);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const open = (p: ProductAdminDto | "new") => { setForm(p === "new" ? empty : fromProduct(p)); setEditing(p); };
  const busy = createProduct.isPending || updateProduct.isPending;

  const submit = () => {
    const input = {
      name: form.name, description: form.description, category: form.category, price: Number(form.price), subscriptionDiscount: Number(form.subscriptionDiscount),
      recommendedCycleDays: Number(form.recommendedCycleDays), stock: Number(form.stock), imageUrl: form.imageUrl.trim() || null, isActive: form.isActive,
    };
    if (editing === "new") createProduct.mutate(input, { onSuccess: () => setEditing(null) });
    else if (editing) updateProduct.mutate({ id: editing.id, input }, { onSuccess: () => setEditing(null) });
  };

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>상품 <span className={styles.subtitle}>{data ? `${data.total}개` : ""}</span></h1>
        <div className={styles.toolbar}>
          <Input placeholder="상품명 검색" value={q} onChange={(e) => setQ(e.target.value)} aria-label="상품명 검색" className={styles.toolbarField} />
          <Button leadingIcon={<Plus />} onClick={() => open("new")}>상품 등록</Button>
        </div>
      </div>
      {isPending || !data ? <Skeleton height={240} /> : (
        <Card padding="none" className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>상품</th><th>카테고리</th><th className="num">정가</th><th className="num">구독가</th><th className="num">재고</th><th>추천 주기</th><th>상태</th><th></th></tr></thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id}>
                  <td className="wrap"><strong>{p.name}</strong></td>
                  <td>{CATEGORY_LABELS[p.category]}</td>
                  <td className="num">{formatKrw(p.price)}</td>
                  <td className="num">{formatKrw(p.subscriptionPrice)} <span className={styles.muted}>(-{p.subscriptionDiscount}%)</span></td>
                  <td className="num">{p.stock === 0 ? <span className={styles.danger}>품절</span> : p.stock}</td>
                  <td>{p.recommendedCycleDays}일</td>
                  <td>{p.isActive ? <Badge status="active" icon={false}>판매 중</Badge> : <Badge status="cancelled" icon={false}>비활성</Badge>}</td>
                  <td>
                    <Button size="sm" variant="secondary" onClick={() => open(p)}>수정</Button>{" "}
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => updateProduct.mutate({ id: p.id, input: p.stock === 0 ? { stock: 50 } : { stock: 0 } })}>{p.stock === 0 ? "재입고(50)" : "품절 처리"}</Button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && <tr><td colSpan={8} className={styles.muted}>상품이 없어요.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "상품 등록" : "상품 수정"} size="lg"
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>취소</Button><Button onClick={submit} loading={busy}>{editing === "new" ? "등록" : "저장"}</Button></>}>
        <div className={styles.form}>
          <Input label="상품명" value={form.name} onChange={(e) => set("name", e.target.value)} className={styles.formFull} required />
          <Select label="카테고리" value={form.category} onChange={(e) => set("category", e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </Select>
          <Input label="정가(원)" type="number" min={100} step={100} value={form.price} onChange={(e) => set("price", e.target.value)} required />
          <Input label="구독 할인율(%)" type="number" min={0} max={90} value={form.subscriptionDiscount} onChange={(e) => set("subscriptionDiscount", e.target.value)} />
          <Input label="추천 주기(일)" type="number" min={CYCLE_MIN_DAYS} max={CYCLE_MAX_DAYS} value={form.recommendedCycleDays} onChange={(e) => set("recommendedCycleDays", e.target.value)} />
          <Input label="재고" type="number" min={0} value={form.stock} onChange={(e) => set("stock", e.target.value)} helper="0이면 품절로 표시되고 새 구독을 만들 수 없어요." />
          <Input label="이미지 URL" type="url" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://" />
          <Input label="설명" value={form.description} onChange={(e) => set("description", e.target.value)} className={styles.formFull} />
          <label className={styles.check}><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> 판매 중 (끄면 목록·검색에서 숨겨져요)</label>
        </div>
      </Dialog>
    </>
  );
}
