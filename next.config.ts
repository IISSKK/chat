import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
