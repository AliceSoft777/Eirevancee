import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Disable React Strict Mode
  reactStrictMode: false,

  // Hide Next.js dev indicator
  devIndicators: false,

  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack configuration
  turbopack: {
    // Fix workspace root warning
    root: process.cwd(),
  },

  // Experimental optimizations
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },

  // Allow cross-origin requests in development
  allowedDevOrigins: [
    'http://192.168.0.6',
    'http://localhost'
  ],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "gtzkxrsbygandkycckhe.supabase.co",
      },
    ],
  },

  // Prevent browser from caching admin pages
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ]
  },
};

export default nextConfig;

