/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build for server runtime on a VPS
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
