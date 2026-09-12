// 테스트는 항상 별도의 테스트 DB를 사용한다 (dev DB 오염 방지).
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  (process.env.CI ? process.env.DATABASE_URL : undefined) ??
  "postgresql://routinebox:routinebox@localhost:5433/routinebox_test?schema=public";
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-0123456789abcdef";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-0123456789abcdef";
