/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: 'standalone',
  images: { unoptimized: true },
  generateEtags: false,
  trailingSlash: false,
  swcMinify: false,
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.jeeey.com';
    return [
      // Static uploads passthrough
      {
        source: '/uploads/:path*',
        destination: `${apiBase}/uploads/:path*`,
      },
      // Admin REST + extra (carts, analytics, finance, etc.)
      {
        source: '/api/admin/:path*',
        destination: `${apiBase}/api/admin/:path*`,
      },
      // Direct cart routes (diagnostics / internal tooling)
      {
        source: '/api/cart/:path*',
        destination: `${apiBase}/api/cart/:path*`,
      },
      // Allow accidental /api/shop/* calls by mapping to /api/*
      {
        source: '/api/shop/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;