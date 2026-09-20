/**
 * 토스페이먼츠 키 종류 판별.
 *
 * - 결제위젯 연동 키: `test_gck_`/`live_gck_`(클라이언트), `test_gsk_`/`live_gsk_`(시크릿) → 결제위젯 SDK 전용
 * - API 개별 연동 키: `test_ck_`/`live_ck_`(클라이언트), `test_sk_`/`live_sk_`(시크릿) → 결제창·자동결제(빌링) 전용
 *
 * 카드 등록창(`payment().requestBillingAuth`)과 빌링키 발급 API(`/v1/billing/authorizations/issue`)는
 * API 개별 연동 키만 받는다. 결제위젯 키를 넣으면 SDK 가 `NotSupportedWidgetKeyError` 를 던지고 API 는 401 을 돌려준다.
 */
export type TossKeyRole = "client" | "secret";
export type TossKeyKind = "missing" | "widget" | "api" | "unknown";

const PREFIX: Record<TossKeyRole, { widget: RegExp; api: RegExp }> = {
  client: { widget: /^(test|live)_gck_/, api: /^(test|live)_ck_/ },
  secret: { widget: /^(test|live)_gsk_/, api: /^(test|live)_sk_/ },
};

export function tossKeyKind(key: string | null | undefined, role: TossKeyRole): TossKeyKind {
  const k = (key ?? "").trim();
  if (!k) return "missing";
  if (PREFIX[role].widget.test(k)) return "widget";
  if (PREFIX[role].api.test(k)) return "api";
  return "unknown";
}

/**
 * 모의 결제수단("테스트 카드 등록") 허용 여부.
 * 개발 환경은 PAYMENTS_MOCK 만 보고, 운영에서는 시크릿 키가 테스트 키(`test_sk_`)일 때만 허용한다 (라이브 키로는 절대 허용하지 않음).
 */
export function mockPaymentsAllowed(opts: { mockFlag: boolean; production: boolean; secretKey: string | null | undefined }): boolean {
  if (!opts.mockFlag) return false;
  if (!opts.production) return true;
  return /^test_sk_/.test((opts.secretKey ?? "").trim());
}

/** 카드 등록(빌링)에 쓸 수 없는 키면 안내 문구를, 쓸 수 있으면 null 을 돌려준다. `envName` 은 안내에 표시할 환경 변수 이름. */
export function tossBillingKeyProblem(key: string | null | undefined, role: TossKeyRole, envName: string): string | null {
  const expected = role === "client" ? "test_ck_…" : "test_sk_…";
  switch (tossKeyKind(key, role)) {
    case "api":
      return null;
    case "missing":
      return `${envName} 가 비어 있어요. 루트 .env 에 토스페이먼츠 API 개별 연동 키(${expected})를 넣고 서버를 다시 시작하세요.`;
    case "widget":
      return `${envName} 가 결제위젯용 키예요. 카드 등록(자동결제)에는 API 개별 연동 키(${expected})가 필요해요. 토스 개발자센터 → API 키 → 'API 개별 연동 키'에서 발급해 바꾼 뒤 서버를 다시 시작하세요.`;
    default:
      return `${envName} 형식이 올바르지 않아요. 토스페이먼츠 API 개별 연동 키(${expected})인지 확인하세요.`;
  }
}
