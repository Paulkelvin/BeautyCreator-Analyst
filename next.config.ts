import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@tobyg74/tiktok-api-dl"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co"
      }
    ]
  }
};

export default nextConfig;
