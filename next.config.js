/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVED: The env{} property is deprecated in Next.js 14+
  // Environment variables with NEXT_PUBLIC_ prefix are automatically inlined
  // See: src/lib/env-runtime.ts for proper environment variable access

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
    // Keep console.error and console.warn in production for debugging
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'info']
    } : false,
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
  // CORS and Security Headers
  async headers() {
    // Get allowed origins from environment variable (comma-separated)
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
      'https://lenkersdorfer-crm.vercel.app',
      'https://www.lenkersdorfer-crm.vercel.app',
    ]

    // Add localhost for development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:3001')
    }

    return [
      {
        // Apply to all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: allowedOrigins[0] }, // Primary origin
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
          },
          { key: 'Access-Control-Max-Age', value: '86400' }, // 24 hours
        ],
      },
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()'
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig