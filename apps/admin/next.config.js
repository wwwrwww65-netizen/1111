/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: 'standalone',
  // Leave default output for Pages router compatibility during build
  images: { unoptimized: true },
  generateEtags: false,
  trailingSlash: false,
  swcMinify: false,
  rewrites: async () => ([
    {
      source: '/uploads/:path*',
      destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/uploads/:path*`,
    },
  ]),
};

module.exports = nextConfig;