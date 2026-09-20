import { describe, expect, it } from "vitest";
import { mockPaymentsAllowed, tossBillingKeyProblem, tossKeyKind } from "@routinebox/shared";

describe("토스 키 종류 판별", () => {
  it("API 개별 연동 키(ck/sk)는 api", () => {
    expect(tossKeyKind("test_ck_abc123", "client")).toBe("api");
    expect(tossKeyKind("live_ck_abc123", "client")).toBe("api");
    expect(tossKeyKind("test_sk_abc123", "secret")).toBe("api");
    expect(tossKeyKind("live_sk_abc123", "secret")).toBe("api");
  });
  it("결제위젯 키(gck/gsk)는 widget", () => {
    expect(tossKeyKind("test_gck_abc123", "client")).toBe("widget");
    expect(tossKeyKind("live_gsk_abc123", "secret")).toBe("widget");
  });
  it("역할이 다른 키·빈 값·형식 불명은 각각 unknown·missing", () => {
    expect(tossKeyKind("test_sk_abc123", "client")).toBe("unknown"); // 시크릿 키를 클라이언트 자리에
    expect(tossKeyKind("test_ck_abc123", "secret")).toBe("unknown");
    expect(tossKeyKind("", "client")).toBe("missing");
    expect(tossKeyKind(undefined, "secret")).toBe("missing");
    expect(tossKeyKind("  ", "secret")).toBe("missing");
    expect(tossKeyKind("hello", "client")).toBe("unknown");
  });
});

describe("카드 등록용 키 검사 안내", () => {
  it("API 개별 연동 키면 문제 없음", () => {
    expect(tossBillingKeyProblem("test_ck_abc", "client", "NEXT_PUBLIC_TOSS_CLIENT_KEY")).toBeNull();
    expect(tossBillingKeyProblem("test_sk_abc", "secret", "TOSS_SECRET_KEY")).toBeNull();
  });
  it("결제위젯 키면 API 개별 연동 키로 바꾸라고 안내", () => {
    const msg = tossBillingKeyProblem("test_gsk_abc", "secret", "TOSS_SECRET_KEY");
    expect(msg).toContain("TOSS_SECRET_KEY");
    expect(msg).toContain("결제위젯용");
    expect(msg).toContain("test_sk_");
  });
  it("비어 있으면 설정하라고 안내", () => {
    expect(tossBillingKeyProblem("", "client", "NEXT_PUBLIC_TOSS_CLIENT_KEY")).toContain("비어 있어요");
  });
});

describe("모의 결제수단(테스트 카드) 허용", () => {
  it("PAYMENTS_MOCK 이 꺼져 있으면 어디서도 불가", () => {
    expect(mockPaymentsAllowed({ mockFlag: false, production: false, secretKey: "test_sk_abc" })).toBe(false);
    expect(mockPaymentsAllowed({ mockFlag: false, production: true, secretKey: "test_sk_abc" })).toBe(false);
  });
  it("개발 환경에서는 키와 무관하게 허용", () => {
    expect(mockPaymentsAllowed({ mockFlag: true, production: false, secretKey: "" })).toBe(true);
  });
  it("운영에서는 테스트 시크릿 키(test_sk_)일 때만 허용", () => {
    expect(mockPaymentsAllowed({ mockFlag: true, production: true, secretKey: "test_sk_abc" })).toBe(true);
    expect(mockPaymentsAllowed({ mockFlag: true, production: true, secretKey: "live_sk_abc" })).toBe(false);
    expect(mockPaymentsAllowed({ mockFlag: true, production: true, secretKey: "" })).toBe(false);
    expect(mockPaymentsAllowed({ mockFlag: true, production: true, secretKey: "test_gsk_abc" })).toBe(false);
  });
});
