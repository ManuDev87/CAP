import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static output (out/) — hostable anywhere, ideal for a PWA
  output: "export",
  // next/image without the optimization server (static export)
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
