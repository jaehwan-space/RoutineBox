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

개발 중에는 `PAYMENTS_MOCK=true`(API)와 `NEXT_PUBLIC_PAYMENTS_MOCK=true`(web)로 모의 카드를 등록해 결제 연동 없이 구독 흐름을 확인할 수 있다. 상품 시드는 `pnpm db:seed`.

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
