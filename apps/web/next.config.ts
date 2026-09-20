import path from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// 환경 변수는 저장소 루트의 .env 하나만 사용한다 (파일이 없으면 무시: 컨테이너·CI 는 주입된 값 사용).
loadEnv({ path: path.join(process.cwd(), "../../.env"), quiet: true });

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  transpilePackages: ["@routinebox/shared"],
  async rewrites() {
    // 브라우저는 항상 같은 출처의 /api 로 호출한다. 운영에서는 Nginx가 /api 를 API 컨테이너로 보낸다.
    return [{ source: "/api/:path*", destination: `${API_INTERNAL_URL}/:path*` }];
  },
};

export default nextConfig;
