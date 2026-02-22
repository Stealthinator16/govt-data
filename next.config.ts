import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Exclude data pipeline scripts from client bundle
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
