/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Force Node runtime for any pages/* we keep
  experimental: { ...({}), runtime: 'nodejs' },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  generateEtags: false,
  trailingSlash: false,
};

module.exports = nextConfig;
