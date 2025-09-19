/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: 'standalone',
  // Leave default output for Pages router compatibility during build
  images: { unoptimized: true },
  generateEtags: false,
  trailingSlash: false,
};

module.exports = nextConfig;