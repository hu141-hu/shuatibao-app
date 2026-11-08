import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // 静态导出必须开启：不加这个，out/ 里会同时出现 profile.html 和 profile/ 目录（且目录里没有 index.html）。
  // Capacitor 的本地资源解析遇到这种同名冲突会退回到 index.html，表现就是「点我的/刷题都跳回首页」。
  // 开启后每个路由生成 profile/index.html，任何静态服务器和 App 壳都能正确解析。
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_VERSION_CHECK_URL: process.env.NEXT_PUBLIC_VERSION_CHECK_URL,
    NEXT_PUBLIC_OCR_LOCAL: process.env.NEXT_PUBLIC_OCR_LOCAL,
    NEXT_PUBLIC_AI_API_URL: process.env.NEXT_PUBLIC_AI_API_URL,
  },
};

export default nextConfig;
