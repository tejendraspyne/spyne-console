/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/admin-tools",
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/assets", "@repo/session"],
};

export default nextConfig;
