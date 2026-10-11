import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  transpilePackages: ["@gleans/ui", "@gleans/citation", "@gleans/file-tools", "@gleans/schemas", "@gleans/insforge"],
  outputFileTracingRoot: process.cwd() + "/../..",
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
