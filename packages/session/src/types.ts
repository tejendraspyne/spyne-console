// The shared cross-app contract. Every app imports these types so "what a
// logged-in user looks like" is defined in exactly one place.

export type Role = "admin" | "editor" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

export interface Session {
  user: User;
  /** Unix epoch seconds. */
  expiresAt: number;
}

/** How the session is sourced. `fixture` = in-process mock (standalone dev). */
export type AuthMode = "fixture" | "remote";

export type SessionState =
  | { status: "authenticated"; session: Session }
  | { status: "unauthenticated"; session: null }
  | { status: "loading"; session: null };
