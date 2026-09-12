# 루틴박스 디자인 시스템

이 프로젝트 안에서만 쓰는 토큰·컴포넌트 규칙이다(별도 패키지로 분리하지 않는다). 살아 있는 예시는 개발 환경의 `/dev/design` 에서 본다.

## 원칙
- **숫자가 주인공**: 가격, 다음 결제일, D-n, 주기처럼 사용자가 결정에 쓰는 숫자를 가장 크게 둔다. 장식은 줄인다.
- **모바일 우선**: 360~430px 에서 먼저 설계하고 `up(md)`·`up(lg)` 로 넓힌다. 터치 대상은 최소 44px.
- **색 단독 의존 금지**: 상태는 항상 아이콘 + 텍스트와 함께(`Badge`). 오류는 메시지로 설명한다.
- **떠 있는 것만 그림자**: 카드는 테두리로 구분하고, 그림자는 Dialog·Toast 처럼 화면 위에 뜨는 요소에만 쓴다.
- **모션은 응답에만**: 열림·닫힘·확정 같은 사용자 행동에 대한 반응으로만 움직인다. `prefers-reduced-motion` 을 항상 존중한다.
- **의미 토큰만 사용**: 컴포넌트·화면 스타일은 `var(--color-*)` 별칭(`v.$color-*`)만 참조한다. 원시 hex 는 `_tokens.scss` 밖에서 쓰지 않는다(다크 모드 자동 대응의 전제). 예외: 카카오·구글 브랜드 버튼.

## 파일 구조
```
src/styles/_tokens.scss     원시 토큰(색 스케일·크기) + light/dark 믹스인(의미 토큰 → CSS 변수)
src/styles/_variables.scss  Sass 별칭 (v.$color-primary = var(--color-primary), 간격·반경·브레이크포인트)
src/styles/_mixins.scss     up(), container, card, button-base, field-base, focus-visible, elevation, truncate 등
src/styles/globals.scss     :root / [data-theme] 에 토큰 적용, 리셋
src/design/theme/           ThemeProvider(라이트·다크·시스템), 플래시 방지 스크립트
src/design/fonts.ts         Pretendard Variable (next/font/local)
src/components/ui/<Name>/   컴포넌트 (Name.tsx, Name.module.scss, index.ts)
src/design/gallery/         /dev/design 페이지 본문
```

## 토큰
| 종류 | 값 |
|---|---|
| 색(의미) | bg, surface, surface-raised, surface-sunken, text, text-secondary, text-muted, text-on-primary, border, border-strong, primary(+hover/active/soft/text), accent(+soft/text), success·warning·danger(+soft/text), overlay |
| 글꼴 | Pretendard Variable 단일 가족. 크기 xs 12 / sm 13 / base 15 / md 16 / lg 18 / xl 20 / 2xl 24 / 3xl 28 / 4xl 34, 줄간격 tight 1.25 / snug 1.4 / normal 1.55, 제목 700·자간 -0.01em, 숫자는 `tabular-nums` |
| 간격 | 4px 배수: 1=4, 2=8, 3=12, 4=16, 5=24, 6=32, 7=40, 8=48, 9=64, 10=80 |
| 반경 | sm 8(버튼·입력) / md 12(카드) / lg 20(시트·배너) / full 999(칩·배지) |
| 그림자 | raised(토스트), float(다이얼로그) |
| 레이어 | header 20 / dropdown 30 / dialog 50 / toast 60 |
| 모션 | fast 120ms, base 200ms, easing cubic-bezier(0.2, 0, 0, 1) |
| 브레이크포인트 | sm 480 / md 768 / lg 1024 / xl 1240, 컨테이너 최대 1240 |

라이트 값은 계획서 목업 기준(주색 파랑 #2a78d6, 강조 주황 #eb6834, 잉크 #16213a, 바탕 #fbfaf7). 다크는 파랑 기운의 바탕(#101418)과 밝힌 주색(#5598e7)을 쓰며 `[data-theme="dark"]` 또는 시스템 설정으로 켜진다.

## 컴포넌트 규칙
| 컴포넌트 | 언제 | 규칙 |
|---|---|---|
| Button | 행동 | primary 는 화면당 하나가 원칙. 파괴적 행동은 danger + 확인 Dialog. 링크는 `href` 로 같은 모양. 로딩 중에는 `loading` 으로 잠근다. 버튼 문구는 결과 동사("구독 시작하기", "저장") — 화살표·"제출" 금지 |
| IconButton | 아이콘만 있는 행동 | `aria-label` 필수 |
| Input · Select | 입력 | 라벨은 항상 위에. 오류는 필드 아래 문장으로. react-hook-form `register()` 를 그대로 펼친다 |
| Chip | 필터·선택 | 필터는 `href`(SSR 페이지, `aria-current`), 즉시 선택은 버튼(`aria-pressed`) |
| Badge | 상태 | 구독 상태 등 상태 표시 전용. 아이콘을 끄지 않는다 |
| Card | 묶음 | 목록 항목·요약 블록. 그림자 없음. 클릭 카드는 `interactive` |
| Stepper | 수량 | 키보드 화살표·Home·End 지원, min/max 를 항상 준다 |
| Dialog | 확인·설정 | 제목 필수, 본문은 짧게, 주 행동은 footer 오른쪽. 모바일은 바텀시트 |
| Toast | 결과 알림 | 행동과 같은 어휘로("건너뛰기가 적용됐어요"). 오류는 원인+다음 행동 |
| Skeleton | 로딩 | 실제 레이아웃 크기에 맞춘다 |
| EmptyState | 빈 화면 | 제목 + 다음 행동 버튼. 분위기 문구 금지 |

## 글쓰기
- 사용자 관점의 쉬운 말, 능동태, 문장형 대소문자. 행동 이름은 흐름 내내 같게(버튼 "해지" → 토스트 "해지했어요").
- 오류는 무엇이 잘못됐고 무엇을 하면 되는지 한 문장으로. 사과·모호한 표현 금지.

## 금지 사례
- 원시 hex 를 컴포넌트 스타일에 직접 쓰기 → 다크 모드에서 깨진다.
- 상태를 색으로만 표시하기, 대문자 라벨, 모든 카드에 그림자, 섹션마다 등장 애니메이션.
- 44px 미만의 터치 대상, 포커스 링 제거.
