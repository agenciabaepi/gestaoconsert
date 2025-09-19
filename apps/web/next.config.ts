import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignorar erros para build de emergência
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Otimizações para múltiplos usuários simultâneos
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['@supabase/supabase-js', 'react-icons/fi']
  },

  // Cache estratégico para melhor performance
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=600' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Access-Control-Allow-Origin', value: isProduction ? 'https://gestaoconsert.com.br' : '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, apikey' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Configuração específica para VPS e Supabase
          ...(isProduction ? [
            {
              key: 'Access-Control-Allow-Origin',
              value: 'https://gestaoconsert.com.br',
            },
            {
              key: 'Access-Control-Allow-Credentials',
              value: 'true',
            },
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ] : [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, POST, PUT, DELETE, OPTIONS',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type, Authorization, apikey',
            },
          ]),
        ],
      },
    ];
  },

  // Configuração de imagens
  images: {
    domains: ['localhost', 'supabase.co'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nxamrvfusyrtkcshehfm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Compressão e otimização
  compress: true,
  poweredByHeader: false,
  reactStrictMode: false,
  trailingSlash: false,

  async rewrites() {
    return [
      { source: '/api/:path*', destination: '/api/:path*' },
    ];
  },

  // Configurações de performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Configurações de performance (dev)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  async redirects() {
    return [];
  },

  // Suporte a SVG via SVGR (webpack)
  webpack(config: any, { isServer }: any) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    
    if (!isServer) {
      // Configurações específicas para cliente
      config.optimization = {
        ...config.optimization,
        minimize: process.env.NODE_ENV === 'production',
      };
    }
    
    return config;
  },
  
  // Configurações externas para servidor
  serverExternalPackages: ['nodemailer'],
};

export default nextConfig;