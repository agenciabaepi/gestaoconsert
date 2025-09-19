import type { NextConfig } from "next";

const nextConfig: NextConfig = {
<<<<<<< HEAD
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Configuração para evitar problemas de hidratação
  reactStrictMode: true,
  swcMinify: true,
=======
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nxamrvfusyrtkcshehfm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
>>>>>>> ae80de9f9e96904a86bf9fd02b9f22ffd98f1f2a
};

export default nextConfig;
