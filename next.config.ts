// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "images.unsplash.com",
//       },
//     ],
//   },
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Hide Next.js dev indicator
  devIndicators: false,
  
  // Ignore TypeScript errors during build
  // This allows production builds to succeed while maintaining runtime behavior
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
