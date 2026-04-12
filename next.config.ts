import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  output: "standalone",
};

export default nextConfig;