/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/inventory",
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/assets", "@repo/session"],
};

export default nextConfig;
