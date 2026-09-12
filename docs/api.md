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
| GET | /products?category=&q=&page= | 목록·검색 (정가, 구독가, 추천 주기) |
| GET | /products/:id | 상세 |
| POST | /products 🛡 | 등록 |
| PATCH | /products/:id 🛡 | 수정·품절 |

## 장바구니 `/cart` 🔒
| GET | /cart | 내 장바구니 |
| PUT | /cart/items | { productId, quantity } 추가·수량 변경 |
| DELETE | /cart/items/:productId | 삭제 |

## 결제 수단 `/payment-methods` 🔒
| POST | /payment-methods/billing-auth | { authKey, customerKey } → 토스 빌링키 발급·암호화 저장 |
| GET | /payment-methods | 등록 카드(카드사·마지막 4자리) |
| DELETE | /payment-methods/:id | 삭제(활성 구독 있으면 409) |

## 구독 `/subscriptions` 🔒
| 메서드 | 경로 | 설명 | 상태 전이 |
|---|---|---|---|
| GET | /subscriptions | 내 구독 목록 + 이번 달 예정 결제 합계 | - |
| POST | /subscriptions | { productId, quantity, cycleDays, firstDeliveryDate } | → PENDING 또는 ACTIVE |
| GET | /subscriptions/:id | 상세(회차 이력) | - |
| POST | /subscriptions/:id/skip | 이번 회차 건너뛰기 | ACTIVE → ACTIVE (nextBillingDate += cycleDays) |
| POST | /subscriptions/:id/pause | 일시정지 | ACTIVE → PAUSED |
| POST | /subscriptions/:id/resume | 재개 { nextBillingDate? } | PAUSED → ACTIVE |
| PATCH | /subscriptions/:id | 주기·수량 변경 | ACTIVE → ACTIVE |
| POST | /subscriptions/:id/cancel | 해지 | ACTIVE·PAUSED·PAYMENT_FAILED → CANCELLED |
| POST | /subscriptions/:id/retry-payment | 카드 변경 후 즉시 재시도 | PAYMENT_FAILED → ACTIVE |

## 주문 `/orders` 🔒
| GET | /orders | 내 주문(회차) 목록 |
| GET | /orders/:id | 상세(결제 결과, 배송 상태) |

## 관리자 `/admin` 🛡
| GET | /admin/dashboard | 활성 구독, 오늘 결제 예정·성공·실패, 월 매출, 최근 14일 결제 건수 |
| GET | /admin/orders?status= | 주문 목록 |
| PATCH | /admin/orders/:id/delivery | { deliveryStatus } 배송 상태 변경 |
| GET | /admin/subscriptions?status= | 구독 목록 |
| GET | /admin/payments/failed | 결제 실패 목록(재시도 예정) |

## 내부·시스템
| GET | /health | 상태 확인 { status:"ok", db:"ok" } |
| POST | /internal/billing/run 🛡 | 결제 배치 수동 실행(운영 점검용, 스케줄러와 동일 로직) |

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
