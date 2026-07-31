import type { NextConfig } from "next";

const routePrefix = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "/admin";
const basePath =
  routePrefix && routePrefix !== "/"
    ? `/${routePrefix.replace(/^\/+|\/+$/g, "")}`
    : undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  ...(basePath ? { basePath } : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    }
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mahfdcsivwfpmydiyddg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
