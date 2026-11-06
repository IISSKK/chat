import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "sharp"],
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
