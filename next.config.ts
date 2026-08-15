import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
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
