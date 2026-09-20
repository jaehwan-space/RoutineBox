# API 목록 (v1)

- Base URL: 로컬 `http://localhost:4000`, 운영 `https://<domain>/api` (Nginx가 `/api` 프리픽스를 제거해 전달)
- 인증: httpOnly 쿠키 `access_token`(15분), `refresh_token`(14일). 🔒 = 로그인 필요, 🛡 = ADMIN
- 응답: 성공 `{ data }`, 실패 `{ error: { code, message, details? } }`
- 검증: 모든 요청 본문·쿼리는 `@routinebox/shared`의 zod 스키마로 검증(400)

## 인증 `/auth`
| 메서드 | 경로 | 설명 | 요청 | 응답 |
|---|---|---|---|---|
| POST | /auth/register | 회원가입 | { email, password, name } | 201 { user } + 쿠키 |
| POST | /auth/login | 로그인 | { email, password } | 200 { user } + 쿠키 |
| POST | /auth/refresh | 토큰 재발급(회전) | 쿠키 refresh_token | 200 { user } + 새 쿠키 |
| POST | /auth/logout | 로그아웃(리프레시 폐기) | 쿠키 | 204 |
| GET | /auth/kakao | 카카오 인가 페이지로 리다이렉트(state 쿠키) | - | 302 |
| GET | /auth/kakao/callback | 코드 교환·계정 연결·쿠키 발급 | ?code&state | 302 → APP_URL |
| GET | /auth/google | 구글 인가 페이지로 리다이렉트 | - | 302 |
| GET | /auth/google/callback | 코드 교환·계정 연결·쿠키 발급 | ?code&state | 302 → APP_URL |
| GET | /me 🔒 | 내 정보 | - | { id, email, name, role, providers[] } |

## 상품 `/products`
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | /products?category=&q=&page=&pageSize= | 목록·검색 → `{ items, page, pageSize, total }`. 각 항목에 `subscriptionPrice`(할인 적용, 10원 단위 내림) 포함. 활성 상품만 |
| GET | /products/:id | 상세 (비활성·없음 404) |
| POST | /products 🛡 | 등록 (관리자 주차) |
| PATCH | /products/:id 🛡 | 수정·품절 (관리자 주차) |

## 장바구니 `/cart` 🔒
| GET | /cart | 내 장바구니 → `{ items[{ productId, quantity, product, lineTotal }], itemCount, total }` |
| PUT | /cart/items | { productId, quantity } 추가·수량 변경(upsert). 비활성 상품 404 |
| DELETE | /cart/items/:productId | 삭제 |
| POST | /cart/checkout | 일괄 구독 시작. `{ firstDeliveryDate, paymentMethodId?, cycles?[{ productId, cycleDays }] }` → 담긴 상품마다 구독 생성(수량은 장바구니 값, 주기는 지정값 없으면 추천 주기, 결제수단 없으면 PENDING) 후 장바구니 비움 → 201 `{ subscriptions[], cart }`. 빈 장바구니 400, 품절 상품 포함 409(아무것도 만들지 않음) |

## 결제 수단 `/payment-methods` 🔒
| POST | /payment-methods/billing-auth | { authKey, customerKey } → 토스 빌링키 발급·AES-256-GCM 암호화 저장. customerKey 는 `cust_{userId}` 여야 함(400) |
| POST | /payment-methods/mock | 모의 카드(테스트카드 0000) 등록. `PAYMENTS_MOCK=true` 이고, 운영에서는 `TOSS_SECRET_KEY` 가 테스트 키(`test_sk_`)일 때만 라우트가 존재. 모의 카드는 결제 배치에서 토스를 부르지 않고 승인 처리된다 |
| GET | /payment-methods | 등록 카드 `[{ id, cardCompany, cardLast4, createdAt }]` |
| DELETE | /payment-methods/:id | 삭제(ACTIVE·PAUSED·PAYMENT_FAILED 구독이 쓰면 409) |

## 구독 `/subscriptions` 🔒
| 메서드 | 경로 | 설명 | 상태 전이 |
|---|---|---|---|
| GET | /subscriptions | 내 구독 목록 → `{ items, monthlyDue(이번 달 ACTIVE 예정 결제 합계), activeCount }` | - |
| POST | /subscriptions | { productId, quantity, cycleDays, firstDeliveryDate, paymentMethodId? }. 첫 배송일은 오늘+3일 이후(400). 결제일 = 배송일 − 3 | paymentMethodId 있으면 ACTIVE, 없으면 PENDING |
| POST | /subscriptions/:id/activate | { paymentMethodId } 카드 연결 후 시작 | PENDING → ACTIVE |
| GET | /subscriptions/:id | 상세(회차 이력) | - |
| POST | /subscriptions/:id/skip | 이번 회차 건너뛰기 | ACTIVE → ACTIVE (nextBillingDate += cycleDays) |
| POST | /subscriptions/:id/pause | 일시정지 | ACTIVE → PAUSED |
| POST | /subscriptions/:id/resume | 재개 { nextBillingDate? } | PAUSED → ACTIVE |
| PATCH | /subscriptions/:id | 주기·수량 변경 | ACTIVE → ACTIVE |
| POST | /subscriptions/:id/cancel | 해지 | ACTIVE·PAUSED·PAYMENT_FAILED → CANCELLED |

결제 실패(PAYMENT_FAILED) 구독은 별도 재시도 API 없이 매일 09:00 배치가 자동으로 재시도한다. 회원이 결제 수단을 바꾸면 다음 재시도에서 새 카드로 승인한다.

구독 응답 `SubscriptionDto`: `{ id, status, product{id,name,category}, quantity, cycleDays, amount(회당, 스냅샷), firstDeliveryDate, nextBillingDate, nextDeliveryDate(=결제일+3), failCount, paymentMethod|null, createdAt, orders?[] }`

## 주문 `/orders` 🔒
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | /orders?page=&pageSize= | 내 주문(회차) 목록 → `{ items[OrderListItemDto], page, pageSize, total }`. 항목: `{ id, orderKey, amount, quantity, status(PENDING·PAID·FAILED·CANCELLED), deliveryStatus(PREPARING·SHIPPED·DELIVERED), billingDate, deliveryDate, subscriptionId, product{id,name,category}, cycleDays, createdAt }` |
| GET | /orders/:id | 상세 `OrderDetailDto` = 목록 항목 + `payment{ status(APPROVED·FAILED), amount, paymentKey, approvedAt, failReason }` + `paymentMethod{ cardCompany, cardLast4 }`. 타인 주문 404 |

## 알림 `/notifications` 🔒
| GET | /notifications | 내 알림 이력 최근 50건 `[{ id, type, subscriptionId, productName, sentAt }]`. type: SUBSCRIPTION_STARTED·BILLING_D1·PAYMENT_SUCCESS·PAYMENT_FAILED·SHIPPED·SKIPPED·CANCELLED |

## 관리자 `/admin` 🛡
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | /admin/dashboard | `{ activeSubscriptions, pausedSubscriptions, failedSubscriptions, todayDue, todayPaid, todayFailed, monthlyRevenue, monthlyOrders, preparingOrders, users, last14Days[{date, paid, failed, amount}] }` |
| GET | /admin/products?q=&includeInactive=&page=&pageSize= | 상품 전체(비활성 포함) `ProductAdminDto` = ProductDto + `isActive, createdAt, updatedAt` |
| POST | /products | 상품 등록 `{ name, description?, category, price, subscriptionDiscount?, recommendedCycleDays?, stock?, imageUrl?, isActive? }` → 201 |
| PATCH | /products/:id | 상품 수정·품절(`stock: 0`)·비활성(`isActive: false`, 목록·상세에서 숨김) |
| GET | /admin/orders?status=&deliveryStatus=&q=&page=&pageSize= | 주문 목록(회원 정보·결제 결과 포함). q 는 회원 이메일·이름·상품명·orderKey |
| PATCH | /admin/orders/:id/delivery | `{ deliveryStatus }` 배송 상태 변경. PAID 주문만(409). SHIPPED 로 바뀌면 배송 출발 알림·메일(회차당 1회) |
| GET | /admin/subscriptions?status=&q=&page=&pageSize= | 구독 목록(회원 정보, nextRetryAt, cancelledReason 포함) |
| GET | /admin/payments/failed | 결제 실패 구독 `[{ subscriptionId, user, product, amount, failCount, nextRetryAt, lastFailReason, lastFailedAt }]` |

## 내부·시스템
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | /health | 상태 확인 `{ status:"ok", db:"ok" }` |
| POST | /internal/billing/run 🛡 | 결제 배치 수동 실행(스케줄러와 동일 로직). `{ asOf?: "YYYY-MM-DD" }` 를 주면 그 날짜를 오늘로 보고 처리(점검·시연용). 응답 `{ asOf, processed, paid, failed, skipped, cancelled, items[{ subscriptionId, orderKey, result, message? }] }`. 동시 실행 시 409 |
| POST | /internal/billing/remind 🛡 | D-1 알림 배치 수동 실행 `{ asOf? }` → `{ asOf, sent, skipped }` |

### 자동 결제 배치 (매일 09:00 KST, node-cron)
- 대상: `ACTIVE AND nextBillingDate ≤ 오늘` + `PAYMENT_FAILED AND nextRetryAt ≤ 오늘 23:59`
- `orderKey = sub_{구독ID}_{예정일 YYYYMMDD}` 가 회차 식별자. 같은 orderKey 의 PAID 주문이 있으면 건너뛴다(멱등). 토스 `orderId` 는 첫 시도 orderKey, 재시도는 `orderKey_r{n}`.
- 성공: Order(PAID)·Payment(APPROVED) 기록, `nextBillingDate = 예정일 + cycleDays`(오늘 이후가 될 때까지), `failCount = 0`, PAYMENT_SUCCESS 알림 — 한 트랜잭션.
- 실패: Order(FAILED)·Payment(FAILED, failReason), PAYMENT_FAILED 전이(`failCount += 1`, `nextRetryAt = 내일 09:00`), 3회째면 CANCELLED(cancelledReason=PAYMENT_FAILED). 네트워크 오류 등 승인 응답이 아닌 예외는 실패로 세지 않고 다음 배치에서 다시 시도한다.
- 모의 카드(`mock_…` 빌링키)는 토스를 부르지 않고 승인, `mock_fail…` 은 항상 실패(테스트용).
- `BILLING_CRON_ENABLED=false` 로 끌 수 있고, `BILLING_CRON`·`REMINDER_CRON` 으로 시각을 바꾼다.

## 오류 코드
| code | HTTP | 의미 |
|---|---|---|
| VALIDATION_ERROR | 400 | zod 검증 실패 |
| UNAUTHORIZED | 401 | 토큰 없음·만료 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| CONFLICT | 409 | 중복 이메일, 활성 구독 있는 카드 삭제 등 |
| INVALID_TRANSITION | 409 | 허용되지 않는 구독 상태 전이 |
| PAYMENT_FAILED | 402 | 토스 승인 실패 |
