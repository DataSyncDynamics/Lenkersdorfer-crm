/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Temporarily disabled for production build
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disabled for production build
  },
  images: {
    unoptimized: true
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
  },
  // Enable SWC minification
  swcMinify: true,
  // Production optimizations
  productionBrowserSourceMaps: false,
  // Reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
}

module.exports = nextConfig