import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://127.0.0.1:5000",
    "http://localhost:5000",
    "https://*.replit.dev",
    "https://*.picard.replit.dev",
    "https://*.repl.co",
    "https://0ebcdb7e-dc5d-4c79-97bc-61716173a5f5-00-2gbudx0ckw11t.picard.replit.dev",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/:path*",
      },
    ];
  },
};

export default nextConfig;
