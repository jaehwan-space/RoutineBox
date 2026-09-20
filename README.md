# 루틴박스 (RoutineBox)

생활필수품을 사용자가 정한 주기에 맞춰 자동으로 주문·결제·배송하는 반응형 웹 구독 커머스입니다.
2026-2학기 컴퓨터공학과 예비캡스톤디자인 졸업작품(1인 개발).

## 구조

```
apps/web        Next.js (App Router, SSR) + TypeScript + CSS Modules/Sass + TanStack Query + zustand
apps/api        Node.js + Express + TypeScript + Prisma + PostgreSQL, node-cron 스케줄러
packages/shared zod 스키마·공용 타입 (web·api 공유)
docs/           요구사항, API 목록, 구독 상태 머신, 환경 설정 가이드
nginx/          리버스 프록시 설정 (로컬·운영)
```

## 빠른 시작

```bash
pnpm install
cp .env.example .env            # 환경 변수는 루트 .env 하나뿐 (API·Prisma·Next·Compose 공용)
pnpm db:up                      # PostgreSQL 컨테이너 (호스트 포트 5433)
pnpm db:migrate                 # Prisma 마이그레이션
pnpm dev                        # web :3000, api :4000
```

개발 중에는 `PAYMENTS_MOCK=true`(API)와 `NEXT_PUBLIC_PAYMENTS_MOCK=true`(web)로 모의 카드를 등록해 결제 연동 없이 구독 흐름을 확인할 수 있다. 상품 시드는 `pnpm db:seed`, 관리자 계정은 `SEED_ADMIN_PASSWORD=<비밀번호> pnpm db:seed` (admin@routinebox.local).

## 주요 기능

- **인증**: 이메일·비밀번호, 카카오·구글 로그인. 액세스(15분)·리프레시(14일) 토큰을 httpOnly 쿠키로 발급하고 리프레시는 회전한다.
- **상품·장바구니**: 카테고리·검색·상세(SSR), 게스트 장바구니는 로그인 시 계정에 병합.
- **구독**: 수량·주기·첫 배송일로 생성, 건너뛰기·일시정지·재개·주기 변경·해지. 전이는 `docs/state-machine.md` 의 순수 함수 하나로만.
- **결제**: 토스페이먼츠 카드 등록창으로 빌링키 발급(AES-256-GCM 암호화 보관). 매일 09:00 스케줄러가 결제 예정 구독을 자동 승인해 주문을 만들고, 실패 시 다음 날 재시도, 3회 연속 실패 시 자동 해지. `orderKey` 로 같은 회차 중복 결제를 막는다.
- **알림**: D-1 결제 예정, 결제 완료·실패, 배송 출발, 자동 해지 알림 이력 + 이메일(SMTP 설정 시).
- **관리자**: 대시보드(활성 구독·오늘 결제·월 매출·14일 추이), 상품 등록·수정·품절, 주문 배송 상태 변경, 구독 현황, 결제 실패 목록, 결제 배치 수동 실행(기준일 지정).

## 테스트

```bash
pnpm db:up && pnpm --filter @routinebox/api test:migrate   # 테스트 DB 준비 (routinebox_test)
pnpm test                                                  # API 단위·통합 테스트 (vitest, 72개)
pnpm --filter @routinebox/web e2e                          # E2E 5개 시나리오 (Playwright, dev 서버 자동 기동)
```

E2E 시나리오: ① 가입·로그인 ② 상품 탐색·검색·장바구니 ③ 테스트 카드 등록 → 구독 생성·관리 ④ 관리자 결제 배치 → 주문·알림·배송 처리 ⑤ 접근 제어(보호 라우트·관리자 권한). 최초 1회 `pnpm --filter @routinebox/web exec playwright install chromium`.

실제 토스 카드 등록은 **API 개별 연동 키**(`test_ck_…` / `test_sk_…`)로만 동작한다. 결제위젯 연동 키(`test_gck_…` / `test_gsk_…`)는 카드 등록창이 열리지 않는다. `.env` 를 바꾼 뒤에는 `pnpm dev` 를 다시 시작해야 한다(`NEXT_PUBLIC_*` 값은 웹 서버 시작 시 번들에 들어가고, API 도 시작할 때만 `.env` 를 읽는다).

전체 스택을 컨테이너로 실행하려면 `docker compose up --build` 후 http://localhost 로 접속합니다.

## 브랜치

- `develop` : 통합 브랜치. 작업 단위로 세부 커밋.
- `main` : 릴리즈(버전 태그) 시에만 develop을 머지.

## 문서

- [요구사항 정의](docs/requirements.md)
- [API 목록](docs/api.md)
- [구독 상태 머신](docs/state-machine.md)
- [환경 설정 가이드 (OCI VM·도메인·OAuth·토스)](docs/setup-guide.md)
- [디자인 시스템](docs/design-system.md)
