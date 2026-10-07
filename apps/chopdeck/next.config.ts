import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared packages ship TypeScript source, not a build, so Next compiles them.
  transpilePackages: ["@cookbook/acute", "@cookbook/store", "@cookbook/ui"],
};

export default nextConfig;
