"use client";
// Client-side session access. The server component (e.g. app/layout.tsx) reads
// the session with getServerSession() and passes it as `initialSession`, so the
// client never needs a round-trip and standalone dev works with no API route.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Session, SessionState } from "./types";

interface SessionContextValue {
  state: SessionState;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  initialSession,
  children,
}: {
  initialSession: Session | null;
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(initialSession);

  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo<SessionContextValue>(() => {
    const state: SessionState = session
      ? { status: "authenticated", session }
      : { status: "unauthenticated", session: null };
    return { state, signOut };
  }, [session, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** Read the current session state. Must be used under a <SessionProvider>. */
export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a <SessionProvider> (from @repo/session/client).");
  }
  return ctx.state;
}

/** Returns the logged-in user or null. */
export function useUser() {
  return useSession().session?.user ?? null;
}

export function useSignOut(): () => void {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSignOut must be used within a <SessionProvider> (from @repo/session/client).");
  }
  return ctx.signOut;
}
