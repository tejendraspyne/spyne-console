/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/docs",
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/assets", "@repo/session"],
};

export default nextConfig;
