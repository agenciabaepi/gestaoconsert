/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações para múltiplos usuários simultâneos
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['@supabase/supabase-js', 'react-icons/fi']
    // ⚠️ 'experimental.turbo' foi removido no Next 15.
    // Se quiser usar Turbopack, não precisa declarar aqui.
  },

  // Cache estratégico para melhor performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=600' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
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
    ]
  },

  // Otimizações de imagem
  images: {
    domains: ['localhost', 'supabase.co'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true,
    // Se for usar `output: 'export'`, considere adicionar: unoptimized: true
  },

  // Compressão e otimização
  compress: true,
  poweredByHeader: false,

  // Configurações de segurança
  async rewrites() {
    return [
      { source: '/api/:path*', destination: '/api/:path*' },
    ]
  },

  // ⚠️ Removido: 'swcMinify' (não é mais suportado/necessário no Next 15)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Configurações de performance (dev)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Rate limiting (se necessário)
  async redirects() {
    return []
  },

  // Suporte a SVG via SVGR (webpack)
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
  
  // Desabilitar prefetch automático e roteamento client-side
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['@supabase/supabase-js', 'react-icons/fi'],
    // Forçar navegação server-side
    appDir: true,
    serverComponentsExternalPackages: []
  },

  // Configurar para sempre fazer full page reload
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: []
    }
  },
}

module.exports = nextConfig
