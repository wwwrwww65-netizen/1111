/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: 'standalone',
  // Remove invalid key for Next 15 runner
  images: {
    unoptimized: true,
    // Avoid sharp requirement in standalone by not using the built-in optimizer path
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  generateEtags: false,
  trailingSlash: false,
  headers: async () => ([
    { source: '/:path*', headers: [{ key: 'Service-Worker-Allowed', value: '/' }] }
  ]),
  rewrites: async () => ([
    {
      source: '/robots.txt',
      destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/robots.txt`,
    },
    {
      source: '/sitemap.xml',
      destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/sitemap.xml`,
    },
    {
      source: '/uploads/:path*',
      destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/uploads/:path*`,
    },
  ])
};

module.exports = nextConfig;
