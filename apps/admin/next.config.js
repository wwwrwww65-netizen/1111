/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: 'standalone',
  outputFileTracing: false,
  images: { unoptimized: true },
  generateEtags: false,
  trailingSlash: false,
};

module.exports = nextConfig;