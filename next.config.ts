import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
    return [
      {
        source: "/auth/:path*",
        destination: `${base.replace(/\/$/, "")}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
