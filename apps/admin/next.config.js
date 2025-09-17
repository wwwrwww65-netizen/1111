/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: 'standalone',
  images: { unoptimized: true },
  generateEtags: false,
  trailingSlash: false,
};

module.exports = nextConfig;