const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hamster/shared'],
  // Next.js 14에서는 outputFileTracingRoot가 experimental 아래에 있음 (15부터 top-level).
  // 모노레포에서 trace 수집 시 범위를 명확히 해서 메모리 폭주를 방지.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

module.exports = nextConfig;
