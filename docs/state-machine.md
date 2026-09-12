# 구독 상태 머신

## 상태
| 상태 | 의미 | 스케줄러 조회 대상 |
|---|---|---|
| PENDING | 구독 생성됨, 결제 수단(빌링키) 미등록 | 아니오 |
| ACTIVE | 진행 중, nextBillingDate에 자동 결제 | 예 |
| PAUSED | 일시정지 | 아니오 |
| PAYMENT_FAILED | 결제 승인 실패, 재시도 대기 (failCount 1~2) | 예 (nextRetryAt ≤ 오늘) |
| CANCELLED | 해지 (최종 상태) | 아니오 |

## 전이
| 현재 | 이벤트 | 다음 | 처리 |
|---|---|---|---|
| PENDING | 빌링키 등록 완료 | ACTIVE | nextBillingDate = firstDeliveryDate − 3일, 구독 시작 알림 |
| ACTIVE | 건너뛰기 | ACTIVE | nextBillingDate += cycleDays, Notification(SKIPPED) |
| ACTIVE | 주기·수량 변경 | ACTIVE | cycleDays·quantity·amount 재계산, nextBillingDate 유지 |
| ACTIVE | 일시정지 | PAUSED | pausedAt 기록 |
| PAUSED | 재개 | ACTIVE | nextBillingDate = 요청값 또는 오늘+3일 |
| ACTIVE | 승인 실패 | PAYMENT_FAILED | failCount += 1, nextRetryAt = 내일 09:00, 실패 알림 |
| PAYMENT_FAILED | 재시도 성공 / 카드 변경 후 재시도 | ACTIVE | failCount = 0, 주문 생성, nextBillingDate += cycleDays |
| PAYMENT_FAILED | 3회 연속 실패 | CANCELLED | cancelledReason = PAYMENT_FAILED, 자동 해지 안내 |
| ACTIVE · PAUSED · PAYMENT_FAILED | 해지 | CANCELLED | cancelledAt 기록, 빌링키 연결 유지(다른 구독에서 사용 가능) |

허용되지 않은 전이는 `INVALID_TRANSITION`(409)으로 거부한다. 전이 로직은 `apps/api/src/modules/subscription/state-machine.ts` 한 곳에만 둔다.

## 자동 결제 배치 (매일 09:00, node-cron)
1. `status = ACTIVE AND nextBillingDate <= today` 또는 `status = PAYMENT_FAILED AND nextRetryAt <= now` 구독을 조회한다.
2. 구독마다 `orderKey = sub_{id}_{YYYYMMDD}`를 만든다. 같은 orderKey의 Order가 이미 있으면 건너뛴다(멱등).
3. 토스 자동결제 승인 API를 호출한다(`orderId = orderKey`).
4. 성공: 트랜잭션으로 Order(PAID)·Payment 생성, `nextBillingDate += cycleDays`, `failCount = 0`, 결제 완료 알림.
5. 실패: `PAYMENT_FAILED` 전이(위 표), Payment(FAILED, failReason) 기록.
6. 배치는 구독 단위로 독립 처리하며, 한 건의 예외가 다른 건을 막지 않는다.

## D-1 알림 배치 (매일 09:05)
`status = ACTIVE AND nextBillingDate = 내일` 구독에 결제 예정 메일을 보내고 Notification(BILLING_D1, 회차)을 기록한다. 같은 회차에 이미 기록이 있으면 보내지 않는다.

## 불변식
- ACTIVE·PAYMENT_FAILED 구독은 반드시 유효한 PaymentMethod를 가진다.
- Order.orderKey는 유니크하다.
- CANCELLED에서 다른 상태로 돌아가지 않는다(재구독은 새 구독 생성).
