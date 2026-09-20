"use client";

import { CYCLE_MAX_DAYS, CYCLE_MIN_DAYS, CYCLE_PRESETS } from "@routinebox/shared";
import { Chip, Input, Stepper } from "@/components/ui";
import styles from "./SubscribeDialog.module.scss";

/** 수량 + 배송 주기(프리셋 칩 / 직접 입력) 공용 입력 */
export function CycleFields({ quantity, onQuantity, cycleDays, onCycle, recommended }: {
  quantity: number; onQuantity: (q: number) => void; cycleDays: number; onCycle: (d: number) => void; recommended?: number;
}) {
  const isPreset = (CYCLE_PRESETS as readonly number[]).includes(cycleDays);
  return (
    <>
      <div className={styles.row}>
        <span className={styles.label}>수량</span>
        <Stepper value={quantity} onChange={onQuantity} min={1} max={20} aria-label="수량" />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>배송 주기 <small>{recommended ? `추천 ${Math.round(recommended / 7)}주` : ""}</small></span>
        <div className={styles.chips}>
          {CYCLE_PRESETS.map((d) => <Chip key={d} size="sm" selected={cycleDays === d} onClick={() => onCycle(d)}>{d / 7}주{d === recommended ? " 추천" : ""}</Chip>)}
          <Chip size="sm" selected={!isPreset} onClick={() => onCycle(isPreset ? 21 : cycleDays)}>직접 입력</Chip>
        </div>
        {!isPreset && (
          <Input type="number" min={CYCLE_MIN_DAYS} max={CYCLE_MAX_DAYS} value={cycleDays} onChange={(e) => onCycle(Number(e.target.value))} helper={`${CYCLE_MIN_DAYS}~${CYCLE_MAX_DAYS}일 사이로 입력`} aria-label="배송 주기(일)" />
        )}
      </div>
    </>
  );
}
