"use client";
import { useSession, useSignOut } from "@repo/session/client";

export function SessionBadge() {
  const { status, session } = useSession();
  const signOut = useSignOut();

  if (status !== "authenticated") return <span>Not signed in</span>;

  return (
    <span>
      Signed in as <strong>{session.user.name}</strong> ({session.user.role}) ·{" "}
      <button type="button" onClick={signOut}>
        Sign out
      </button>
    </span>
  );
}
