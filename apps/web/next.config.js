const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hamster/shared'],
  // 모노레포에서 build trace의 루트를 명시하지 않으면 Vercel 빌드가
  // 마지막 trace 수집 단계에서 메모리 초과로 silent kill 됨
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

module.exports = nextConfig;
