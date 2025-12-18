import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
    const dest = base.replace(/\/$/, "");
    return [
      { source: "/auth/:path*", destination: `${dest}/auth/:path*` },
      { source: "/roles", destination: `${dest}/roles` },
      { source: "/api/:path*", destination: `${dest}/api/:path*` },
    ];
  },
};

export default nextConfig;
