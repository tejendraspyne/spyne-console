import { TurborepoIcon } from "@repo/assets/icons";
import { SessionBadge } from "./session-badge";

// Satellite apps proxied by main's rewrites (see next.config.js + root .env).
// Plain <a> (not next/link) so hrefs stay at the origin root and are NOT
// prefixed with main's basePath ("/main") — that is what the proxy matches.
const SATELLITES = [
  { name: "console", path: "/console", port: 3001 },
  { name: "login", path: "/login", port: 3002 },
  { name: "inventory", path: "/inventory", port: 3003 },
  { name: "admin-tools", path: "/admin-tools", port: 3004 },
  { name: "vini", path: "/vini", port: 3005 },
  { name: "studio", path: "/studio", port: 3006 },
  { name: "docs", path: "/docs", port: 3007 },
] as const;

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: "48px 24px",
        maxWidth: 880,
        margin: "0 auto",
      }}
    >
      <TurborepoIcon
        width={160}
        height={34}
        role="img"
        aria-label="Turborepo logo"
      />
      <div style={{ textAlign: "center", display: "grid", gap: 6 }}>
        <h1 style={{ fontSize: 28 }}>main · app launcher</h1>
        <p style={{ fontSize: 13, opacity: 0.8 }}>
          main proxies each path below to its satellite app in dev. Start one
          with <code>pnpm run dev:&lt;app&gt;</code>, then click through.
        </p>
        <p style={{ fontSize: 13, opacity: 0.8 }}>
          <SessionBadge />
        </p>
      </div>

      <section
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {SATELLITES.map((app) => (
          <a
            key={app.name}
            href={app.path}
            style={{
              display: "grid",
              gap: 6,
              padding: 18,
              borderRadius: 12,
              border: "1px solid var(--foreground)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <strong style={{ fontSize: 16 }}>
              {app.name} <span aria-hidden>→</span>
            </strong>
            <code style={{ fontSize: 13, opacity: 0.85 }}>{app.path}</code>
            <span style={{ fontSize: 12, opacity: 0.6 }}>
              localhost:{app.port}
            </span>
          </a>
        ))}
      </section>
    </main>
  );
}
