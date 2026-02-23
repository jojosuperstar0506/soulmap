import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use Webpack for production build (Turbopack has font resolution issues with next/font on Vercel)
  turbopack: { root: "." },
};

export default nextConfig;
