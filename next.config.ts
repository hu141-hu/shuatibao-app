import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_VERSION_CHECK_URL: process.env.NEXT_PUBLIC_VERSION_CHECK_URL,
  },
};

export default nextConfig;
