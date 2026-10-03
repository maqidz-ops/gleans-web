import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
