import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://127.0.0.1:5000",
    "http://localhost:5000",
    "https://*.replit.dev",
    "https://*.picard.replit.dev",
    "https://*.repl.co",
    ".replit.dev",
    ".picard.replit.dev",
  ],
  async rewrites() {
    const apiHost = process.env.API_INTERNAL_URL || "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiHost}/:path*`,
      },
    ];
  },
};

export default nextConfig;
