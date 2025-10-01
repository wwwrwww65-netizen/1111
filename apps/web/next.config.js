/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: 'standalone',
  // Remove invalid key for Next 15 runner
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  generateEtags: false,
  trailingSlash: false,
  headers: async () => ([
    { source: '/:path*', headers: [{ key: 'Service-Worker-Allowed', value: '/' }] }
  ])
};

module.exports = nextConfig;
