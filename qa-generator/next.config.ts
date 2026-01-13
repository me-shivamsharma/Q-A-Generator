import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  serverExternalPackages: ['pdf-parse'],

  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },

  // Skip ESLint during build for Docker
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Skip TypeScript checking during build for Docker
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize for production deployment
  experimental: {
    // Enable server components optimization (moved to serverExternalPackages in Next.js 15)
  }
};

export default nextConfig;
