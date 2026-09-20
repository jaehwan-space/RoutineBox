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
| ACTIVE | 승인 성공 (`PAYMENT_SUCCEEDED`) | ACTIVE | Order(PAID)·Payment 기록, nextBillingDate += cycleDays, failCount = 0, 결제 완료 알림 |
| ACTIVE · PAYMENT_FAILED | 승인 실패 (`PAYMENT_FAILED`) | PAYMENT_FAILED | failCount += 1, nextRetryAt = 내일 09:00, Order(FAILED)·Payment(FAILED) 기록, 실패 알림 |
| PAYMENT_FAILED | 재시도 성공 / 카드 변경 후 재시도 (`PAYMENT_RETRY_SUCCEEDED`) | ACTIVE | failCount = 0, 같은 회차 주문을 PAID 로 갱신, nextBillingDate += cycleDays |
| PAYMENT_FAILED | 3회 연속 실패 | CANCELLED | cancelledReason = PAYMENT_FAILED, 자동 해지 안내 |
| ACTIVE · PAUSED · PAYMENT_FAILED | 해지 | CANCELLED | cancelledAt 기록, 빌링키 연결 유지(다른 구독에서 사용 가능) |

허용되지 않은 전이는 `INVALID_TRANSITION`(409)으로 거부한다. 전이 로직은 `apps/api/src/modules/subscription/state-machine.ts` 한 곳에만 둔다.

## 자동 결제 배치 (매일 09:00 KST, node-cron — `apps/api/src/modules/billing/service.ts`)
1. `status = ACTIVE AND nextBillingDate <= today` 또는 `status = PAYMENT_FAILED AND nextRetryAt <= today 23:59` 구독을 조회한다.
2. 구독마다 `orderKey = sub_{id}_{예정일 YYYYMMDD}`를 만든다. 같은 orderKey의 **PAID** Order가 이미 있으면 건너뛴다(멱등). FAILED Order 는 재시도 시 같은 행을 갱신한다(회차당 Order 1개).
3. 빌링키로 토스 자동결제 승인 API를 호출한다(`orderId` = 첫 시도 orderKey, 재시도 `orderKey_r{n}`, `Idempotency-Key` 헤더 동일). 모의 카드는 토스 없이 승인된다.
4. 성공: 트랜잭션으로 Order(PAID)·Payment(APPROVED) 생성/갱신, `nextBillingDate = 예정일 + cycleDays`(배치가 밀렸으면 오늘 이후가 될 때까지 더한다), `failCount = 0`, Notification(PAYMENT_SUCCESS, orderKey). 커밋 후 메일 발송.
5. 실패: 트랜잭션으로 Order(FAILED)·Payment(FAILED, failReason) 기록, `PAYMENT_FAILED` 전이(위 표). `failCount` 가 3이 되면 이어서 `AUTO_CANCEL`(CANCELLED, cancelledReason = PAYMENT_FAILED) 과 Notification(CANCELLED).
6. 배치는 구독 단위로 독립 처리하며, 한 건의 예외가 다른 건을 막지 않는다. 승인 응답이 아닌 예외(네트워크 등)는 실패로 세지 않는다. 프로세스 안에서 동시에 두 번 돌지 않는다.
7. 관리자는 `POST /internal/billing/run { asOf? }` 로 같은 로직을 즉시 실행할 수 있다(점검·시연).

## D-1 알림 배치 (매일 09:05 KST)
`status = ACTIVE AND nextBillingDate = 내일` 구독에 결제 예정 메일을 보내고 Notification(BILLING_D1, 회차 orderKey)을 기록한다. 같은 회차에 이미 기록이 있으면 보내지 않는다(유니크 제약). `POST /internal/billing/remind` 로 수동 실행.

## 알림·메일
Notification 은 `(subscriptionId, type, periodKey)` 유니크로 회차당 한 번만 남는다. 메일은 `SMTP_HOST` 가 설정된 경우에만 발송하고(nodemailer), 없으면 이력만 남긴다. 발송 대상: BILLING_D1, PAYMENT_SUCCESS, PAYMENT_FAILED, SHIPPED(관리자가 배송 중으로 변경), CANCELLED(자동 해지).

## 불변식
- ACTIVE·PAYMENT_FAILED 구독은 반드시 유효한 PaymentMethod를 가진다.
- Order.orderKey는 유니크하다.
- CANCELLED에서 다른 상태로 돌아가지 않는다(재구독은 새 구독 생성).
