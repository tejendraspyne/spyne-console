import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Convert `import.meta.url` to file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// main is the gateway: it proxies each satellite path to that app's server.
// The server URL comes from a per-app env var so the SAME config works in:
//   - local dev      -> http://localhost:<port> (from root .env, or the fallback below)
//   - Docker gateway  -> http://<service>:<port> (baked in at build time via build args)
//   - independent prod -> unset, so that app is simply not proxied
//
// NOTE: Next bakes rewrites() at BUILD time, so in Docker these URLs must be
// present during `next build` (passed as build args — see docker-compose.gateway.yml).
const SATELLITES = [
  { name: "console", url: process.env.CONSOLE_MICROFRONTEND_SERVER_URL, devPort: 3001 },
  { name: "login", url: process.env.LOGIN_MICROFRONTEND_SERVER_URL, devPort: 3002 },
  { name: "inventory", url: process.env.INVENTORY_MICROFRONTEND_SERVER_URL, devPort: 3003 },
  { name: "admin-tools", url: process.env.ADMIN_TOOLS_MICROFRONTEND_SERVER_URL, devPort: 3004 },
  { name: "vini", url: process.env.VINI_MICROFRONTEND_SERVER_URL, devPort: 3005 },
  { name: "studio", url: process.env.STUDIO_MICROFRONTEND_SERVER_URL, devPort: 3006 },
  { name: "docs", url: process.env.DOCS_MICROFRONTEND_SERVER_URL, devPort: 3007 },
];

const isDev = process.env.NODE_ENV !== "production";

// Resolve a satellite's origin: explicit env wins; in dev fall back to
// localhost so `pnpm run dev:main` proxies with no setup; in prod, an unset
// URL means "don't proxy this app" (independent-container mode).
function satelliteOrigin({ url, devPort }) {
  if (url) return url;
  if (isDev) return `http://localhost:${devPort}`;
  return null;
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
    // One pair of rules per configured satellite: the bare path and everything
    // under it (pages + that app's /<name>/_next assets, thanks to its basePath).
    return SATELLITES.flatMap((app) => {
      const origin = satelliteOrigin(app);
      if (!origin) return [];
      return [
        {
          source: `/${app.name}`,
          destination: `${origin}/${app.name}`,
          basePath: false,
        },
        {
          source: `/${app.name}/:path*`,
          destination: `${origin}/${app.name}/:path*`,
          basePath: false,
        },
      ];
    });
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Specific timeout for rewrites (proxying satellites)
  experimental: {
    proxyTimeout: 30000, // 30 seconds
  },
  // CORS headers for cross-app requests
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
