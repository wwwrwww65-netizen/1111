/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: 'standalone',
  experimental: { appDir: true },
  images: { unoptimized: true },
  generateEtags: false,
  trailingSlash: false,
  // Avoid export-time SSR for dynamic pages during build exports
  // We rely on runtime fetches with credentials
};

module.exports = nextConfig;