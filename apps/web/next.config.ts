import type { NextConfig } from "next";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@routinebox/shared"],
  async rewrites() {
    // 브라우저는 항상 같은 출처의 /api 로 호출한다. 운영에서는 Nginx가 /api 를 API 컨테이너로 보낸다.
    return [{ source: "/api/:path*", destination: `${API_INTERNAL_URL}/:path*` }];
  },
};

export default nextConfig;
