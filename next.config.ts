import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output configuration for Vercel
  output: 'standalone',

  // Image optimization
  images: {
    unoptimized: true, // For client-side image handling
  },

  // Enable experimental features
  experimental: {
    // Turbopack is enabled by default in Next.js 15+
  },

  // Headers for COOP/COEP (required for SharedArrayBuffer if needed)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
