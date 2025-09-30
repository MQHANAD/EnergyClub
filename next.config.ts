import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Turbopack to use the project directory as workspace root
  turbopack: {
    root: new URL(".", import.meta.url).pathname,
  },
  // Ensure file tracing also anchors to the project directory
  outputFileTracingRoot: new URL(".", import.meta.url).pathname,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
