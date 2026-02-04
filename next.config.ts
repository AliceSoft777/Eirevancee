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
};

export default nextConfig;
