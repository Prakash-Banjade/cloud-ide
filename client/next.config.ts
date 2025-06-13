import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      // 1) Proxy any path under /preview/<replid>/… to the subdomain
      {
        source: '/preview/:replid/:path*',
        destination: 'http://:replid.qubide.cloud/:path*',
      },
      // 2) Proxy the “root” preview URL without extra path
      {
        source: '/preview/:replid',
        destination: 'http://:replid.qubide.cloud/',
      },
    ]
  }
};

export default nextConfig;
