"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { addDays, formatKrw, todayKst } from "@routinebox/shared";
import { Button, Card, Input, Skeleton } from "@/components/ui";
import { cx } from "@/lib/cx";
import { useAdminActions, useDashboard } from "./useAdmin";
import styles from "./Admin.module.scss";

export function AdminDashboard() {
  const { data: d, isPending } = useDashboard();
  const { runBilling, runReminders } = useAdminActions();
  const [asOf, setAsOf] = useState(todayKst());
  const max = d ? Math.max(1, ...d.last14Days.map((x) => x.paid + x.failed)) : 1;

  return (
    <>
      <div className={styles.head}>
        <div><h1 className={styles.title}>대시보드</h1><p className={styles.subtitle}>오늘 {todayKst()} · 매일 09:00 자동 결제, 09:05 D-1 알림</p></div>
      </div>
      {isPending || !d ? (
        <div className={styles.stats}><Skeleton height={88} /><Skeleton height={88} /><Skeleton height={88} /><Skeleton height={88} /></div>
      ) : (
        <>
          <div className={styles.stats}>
            <Card padding="sm" className={styles.stat}><span className={styles.statLabel}>진행 중 구독</span><strong className={styles.statValue}>{d.activeSubscriptions}</strong><span className={styles.statSub}>일시정지 {d.pausedSubscriptions} · 회원 {d.users}명</span></Card>
            <Card padding="sm" className={styles.stat}><span className={styles.statLabel}>오늘 결제 예정</span><strong className={styles.statValue}>{d.todayDue}</strong><span className={styles.statSub}>성공 {d.todayPaid} · 실패 {d.todayFailed}</span></Card>
            <Card padding="sm" className={cx(styles.stat, d.failedSubscriptions > 0 && styles.statDanger)}><span className={styles.statLabel}>결제 실패 (재시도 대기)</span><strong className={styles.statValue}>{d.failedSubscriptions}</strong><span className={styles.statSub}>3회 연속 실패 시 자동 해지</span></Card>
            <Card padding="sm" className={styles.stat}><span className={styles.statLabel}>이번 달 구독 매출</span><strong className={styles.statValue}>{formatKrw(d.monthlyRevenue)}</strong><span className={styles.statSub}>결제 {d.monthlyOrders}건 · 배송 준비 {d.preparingOrders}건</span></Card>
          </div>
          <Card>
            <div className={styles.head}><h2 style={{ fontSize: 18 }}>최근 14일 결제 건수</h2><div className={styles.legend}><span><i style={{ background: "var(--color-primary)" }} />성공</span><span><i style={{ background: "var(--color-danger)" }} />실패</span></div></div>
            <div className={styles.chart} role="img" aria-label={`최근 14일 결제 건수. 오늘 성공 ${d.last14Days[13].paid}건, 실패 ${d.last14Days[13].failed}건`}>
              {d.last14Days.map((x) => (
                <div key={x.date} className={styles.bar} title={`${x.date} · 성공 ${x.paid} · 실패 ${x.failed} · ${formatKrw(x.amount)}`}>
                  {x.failed > 0 && <span className={styles.barFailed} style={{ height: `${(x.failed / max) * 100}%` }} />}
                  <span className={styles.barPaid} style={{ height: `${(x.paid / max) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className={styles.chartLabels}>{d.last14Days.map((x) => <span key={x.date}>{x.date.slice(5).replace("-", "/")}</span>)}</div>
          </Card>
        </>
      )}
      <Card>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>결제 배치 수동 실행</h2>
        <p className={styles.subtitle} style={{ marginBottom: 12 }}>스케줄러와 같은 로직입니다. 기준일을 미래로 두면 그 날짜까지의 결제 예정 구독을 지금 처리합니다(점검·시연용). 같은 회차는 두 번 결제되지 않아요.</p>
        <div className={styles.toolbar}>
          <Input type="date" label="기준일" value={asOf} min={addDays(todayKst(), -1)} onChange={(e) => setAsOf(e.target.value)} className={styles.toolbarField} />
          <Button leadingIcon={<Play />} onClick={() => runBilling.mutate(asOf)} loading={runBilling.isPending}>결제 배치 실행</Button>
          <Button variant="secondary" onClick={() => runReminders.mutate(asOf)} loading={runReminders.isPending}>D-1 알림 실행</Button>
        </div>
        {runBilling.data && (
          <ul className={styles.runResult} style={{ marginTop: 12 }}>
            {runBilling.data.items.length === 0 && <li className={styles.muted}>처리할 구독이 없었어요.</li>}
            {runBilling.data.items.map((i) => (
              <li key={i.orderKey || i.subscriptionId}><span className={i.result === "PAID" ? undefined : i.result === "SKIPPED" ? styles.muted : styles.danger}>{i.result}</span><span className={styles.muted}>{i.orderKey}</span>{i.message && <span>{i.message}</span>}</li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
