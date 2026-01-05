import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' } // Adicione o padrão do seu bucket público
    ],
  },
  // Aumenta o limite de upload das Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  output: 'standalone',
};

export default nextConfig;