import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
    const dest = base.replace(/\/$/, "");
    return [
      { source: "/auth/:path*", destination: `${dest}/auth/:path*` },
      { source: "/users/:path*", destination: `${dest}/users/:path*` },
      { source: "/users", destination: `${dest}/users` },
      { source: "/roles/:path*", destination: `${dest}/roles/:path*` },
      { source: "/roles", destination: `${dest}/roles` },
      { source: "/tiendas/:path*", destination: `${dest}/tiendas/:path*` },
      { source: "/tiendas", destination: `${dest}/tiendas` },
      { source: "/clientes/:path*", destination: `${dest}/clientes/:path*` },
      { source: "/clientes", destination: `${dest}/clientes` },
      { source: "/zonas/:path*", destination: `${dest}/zonas/:path*` },
      { source: "/zonas", destination: `${dest}/zonas` },
      { source: "/productos/upload", destination: `${dest}/productos/upload` },
      { source: "/productos/:path*", destination: `${dest}/productos/:path*` },
      { source: "/productos", destination: `${dest}/productos` },
      { source: "/api/:path*", destination: `${dest}/api/:path*` },
    ];
  },
};

export default nextConfig;
