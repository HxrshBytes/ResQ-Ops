import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.NODE_ENV === 'development' ? '/tmp/resq-ops-build' : '.next',
  serverExternalPackages: ['pg'],
};

export default nextConfig;
