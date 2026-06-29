/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/studio",
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/assets", "@repo/session"],
};

export default nextConfig;
