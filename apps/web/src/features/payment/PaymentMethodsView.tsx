"use client";

import { CreditCard, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Card, EmptyState, IconButton, Skeleton, useToast } from "@/components/ui";
import { useMe } from "@/features/auth/useMe";
import { customerKeyFor, MOCK_ENABLED, TOSS_CLIENT_KEY } from "./api";
import { usePaymentMethodActions, usePaymentMethods } from "./usePaymentMethods";
import styles from "./PaymentMethods.module.scss";

/** 토스 카드 등록창을 연다. successUrl 에는 돌아갈 경로를 함께 넘긴다. */
export async function openTossCardRegistration(opts: { userId: string; email: string; name: string; returnTo?: string }) {
  const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
  const toss = await loadTossPayments(TOSS_CLIENT_KEY);
  const payment = toss.payment({ customerKey: customerKeyFor(opts.userId) });
  const success = new URL("/account/payment-methods/success", window.location.origin);
  if (opts.returnTo) success.searchParams.set("returnTo", opts.returnTo);
  const fail = new URL("/account/payment-methods", window.location.origin);
  fail.searchParams.set("error", "billing_failed");
  await payment.requestBillingAuth({ method: "CARD", successUrl: success.toString(), failUrl: fail.toString(), customerEmail: opts.email, customerName: opts.name });
}

export function PaymentMethodsView() {
  const { data: me } = useMe();
  const { data: methods, isPending } = usePaymentMethods();
  const { mock, remove } = usePaymentMethodActions();
  const params = useSearchParams();
  const toast = useToast();
  const [opening, setOpening] = useState(false);
  const returnTo = params.get("returnTo") ?? undefined;
  const failed = params.get("error") === "billing_failed";

  const register = async () => {
    if (!me) return;
    if (!TOSS_CLIENT_KEY) { toast.error("토스페이먼츠 클라이언트 키가 설정되지 않았어요. .env 의 NEXT_PUBLIC_TOSS_CLIENT_KEY 를 확인하세요."); return; }
    setOpening(true);
    try {
      await openTossCardRegistration({ userId: me.id, email: me.email, name: me.name, returnTo });
    } catch (err) {
      // 사용자가 창을 닫은 경우도 여기로 온다
      toast.info(err instanceof Error && err.message ? err.message : "카드 등록을 취소했어요.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>결제 수단</h1>
        <div className={styles.actions}>
          {MOCK_ENABLED && <Button variant="secondary" onClick={() => mock.mutate()} loading={mock.isPending}>테스트 카드 등록</Button>}
          <Button onClick={register} loading={opening} leadingIcon={<CreditCard />}>카드 등록하기</Button>
        </div>
      </div>
      {failed && <p className={styles.alert} role="alert">카드 등록이 완료되지 않았어요. 다시 시도해 주세요.</p>}
      <p className={styles.help}>카드 번호는 저장하지 않아요. 토스페이먼츠가 발급한 빌링키만 암호화해 보관합니다.</p>
      {isPending ? (
        <Skeleton height={88} />
      ) : !methods || methods.length === 0 ? (
        <Card padding="none"><EmptyState icon={<CreditCard />} title="등록된 카드가 없어요" description="카드를 한 번 등록하면 결제일에 자동으로 결제됩니다." /></Card>
      ) : (
        <ul className={styles.list}>
          {methods.map((m) => (
            <Card as="li" key={m.id} padding="sm" className={styles.card}>
              <CreditCard className={styles.cardIcon} aria-hidden />
              <div className={styles.cardMain}>
                <strong>{m.cardCompany} **** {m.cardLast4}</strong>
                <span className={styles.cardMeta}>{new Date(m.createdAt).toLocaleDateString("ko-KR")} 등록</span>
              </div>
              <IconButton aria-label={`${m.cardCompany} ${m.cardLast4} 삭제`} size="sm" onClick={() => remove.mutate(m.id)} disabled={remove.isPending}><Trash2 /></IconButton>
            </Card>
          ))}
        </ul>
      )}
      {returnTo && methods && methods.length > 0 && <Button href={returnTo} variant="secondary">구독 설정으로 돌아가기</Button>}
    </section>
  );
}
