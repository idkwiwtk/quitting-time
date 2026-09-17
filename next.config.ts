import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 배포용: node_modules 없이 실행 가능한 .next/standalone 을 만든다
  output: "standalone",
};

export default nextConfig;
