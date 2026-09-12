process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-0123456789abcdef";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-0123456789abcdef";
process.env.DATABASE_URL ??= "postgresql://routinebox:routinebox@localhost:5433/routinebox_test?schema=public";
