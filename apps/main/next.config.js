import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Convert `import.meta.url` to file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const CONSOLE_MICROFRONTEND_SERVER_URL =
  process.env.CONSOLE_MICROFRONTEND_SERVER_URL;
const LOGIN_MICROFRONTEND_SERVER_URL =
  process.env.LOGIN_MICROFRONTEND_SERVER_URL;
const INVENTORY_MICROFRONTEND_SERVER_URL =
  process.env.INVENTORY_MICROFRONTEND_SERVER_URL;
const ADMIN_TOOLS_MICROFRONTEND_SERVER_URL =
  process.env.ADMIN_TOOLS_MICROFRONTEND_SERVER_URL;
const VINI_MICROFRONTEND_SERVER_URL = process.env.VINI_MICROFRONTEND_SERVER_URL;
const STUDIO_MICROFRONTEND_SERVER_URL =
  process.env.STUDIO_MICROFRONTEND_SERVER_URL;
const DOCS_MICROFRONTEND_SERVER_URL = process.env.DOCS_MICROFRONTEND_SERVER_URL;

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
    // Satellites are deployed independently in production; only proxy in dev.
    if (process.env.NODE_ENV === "production") return [];

    return [
      /**
       * CONSOLE
       */
      {
        source: "/console",
        destination: `${CONSOLE_MICROFRONTEND_SERVER_URL}/console`,
        basePath: false,
      },
      {
        source: "/console/:path*",
        destination: `${CONSOLE_MICROFRONTEND_SERVER_URL}/console/:path*`,
        basePath: false,
      },
      /**
       * LOGIN
       */
      {
        source: "/login",
        destination: `${LOGIN_MICROFRONTEND_SERVER_URL}/login`,
        basePath: false,
      },
      {
        source: "/login/:path*",
        destination: `${LOGIN_MICROFRONTEND_SERVER_URL}/login/:path*`,
        basePath: false,
      },
      /**
       * INVENTORY
       */
      {
        source: "/inventory",
        destination: `${INVENTORY_MICROFRONTEND_SERVER_URL}/inventory`,
        basePath: false,
      },
      {
        source: "/inventory/:path*",
        destination: `${INVENTORY_MICROFRONTEND_SERVER_URL}/inventory/:path*`,
        basePath: false,
      },
      /**
       * ADMIN TOOLS
       */
      {
        source: "/admin-tools",
        destination: `${ADMIN_TOOLS_MICROFRONTEND_SERVER_URL}/admin-tools`,
        basePath: false,
      },
      {
        source: "/admin-tools/:path*",
        destination: `${ADMIN_TOOLS_MICROFRONTEND_SERVER_URL}/admin-tools/:path*`,
        basePath: false,
      },
      /**
       * VINI
       */
      {
        source: "/vini",
        destination: `${VINI_MICROFRONTEND_SERVER_URL}/vini`,
        basePath: false,
      },
      {
        source: "/vini/:path*",
        destination: `${VINI_MICROFRONTEND_SERVER_URL}/vini/:path*`,
        basePath: false,
      },
      /**
       * STUDIO
       */
      {
        source: "/studio",
        destination: `${STUDIO_MICROFRONTEND_SERVER_URL}/studio`,
        basePath: false,
      },
      {
        source: "/studio/:path*",
        destination: `${STUDIO_MICROFRONTEND_SERVER_URL}/studio/:path*`,
        basePath: false,
      },
      /**
       * DOCS
       */
      {
        source: "/docs",
        destination: `${DOCS_MICROFRONTEND_SERVER_URL}/docs`,
        basePath: false,
      },
      {
        source: "/docs/:path*",
        destination: `${DOCS_MICROFRONTEND_SERVER_URL}/docs/:path*`,
        basePath: false,
      },
    ];
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
