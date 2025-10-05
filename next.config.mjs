/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for uploading to public_html (no server-side APIs)
  output: 'export',
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
