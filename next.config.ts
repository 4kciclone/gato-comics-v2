import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' }
    ],
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  async headers() {
    return [
      {
        // Aplica a todas as rotas da API
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          // CORREÇÃO AQUI: Trocamos '*' pelo endereço exato do Expo Web
          { key: "Access-Control-Allow-Origin", value: "http://localhost:8081" }, 
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  }
};

export default nextConfig;