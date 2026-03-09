import type { NextConfig } from "next";

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;
const replitDomains = process.env.REPLIT_DOMAINS
  ? process.env.REPLIT_DOMAINS.split(",").map((d) => d.trim()).filter(Boolean)
  : [];

const allowedDevOrigins = [
  "http://127.0.0.1:5000",
  "http://localhost:5000",
  ...(replitDevDomain ? [replitDevDomain] : []),
  ...replitDomains,
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
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
