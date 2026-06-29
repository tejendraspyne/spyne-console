import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function loadSatelliteApps() {
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, "repo.manifest.json"), "utf8"),
  );
  return manifest.workspaces.filter(
    (workspace) => workspace.kind === "app" && workspace.name !== "main",
  );
}

const basePath = "/main";

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/assets", "@repo/session"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/main",
        permanent: false,
        basePath: false,
      },
    ];
  },
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];

    return loadSatelliteApps().flatMap(({ name, port }) => [
      {
        source: `/${name}`,
        destination: `http://localhost:${port}/${name}`,
        basePath: false,
      },
      {
        source: `/${name}/:path*`,
        destination: `http://localhost:${port}/${name}/:path*`,
        basePath: false,
      },
    ]);
  },
};

export default nextConfig;
