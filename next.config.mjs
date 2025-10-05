/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for Node.js hosting (API routes supported)
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
