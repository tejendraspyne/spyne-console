/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/login",
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/assets", "@repo/session"],
};

export default nextConfig;
