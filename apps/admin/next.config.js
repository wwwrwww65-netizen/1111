/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Use default output/tracing to avoid pages-manifest issues
  images: { unoptimized: true },
  generateEtags: false,
  trailingSlash: false,
};

module.exports = nextConfig;