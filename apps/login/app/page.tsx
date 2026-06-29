import { TurborepoIcon } from "@repo/assets/icons";
import { SessionBadge } from "./session-badge";

export default function Home() {
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", gap: 16, padding: 24 }}>
      <TurborepoIcon width={160} height={34} role="img" aria-label="Turborepo logo" />
      <h1>login</h1>
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        <SessionBadge />
      </p>
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Edit <code>apps/login/app/page.tsx</code> to get started.
      </p>
    </main>
  );
}
