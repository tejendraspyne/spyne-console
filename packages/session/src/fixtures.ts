// Mock users for standalone / no-backend development.
//
// In `fixture` mode (the default), getServerSession() returns one of these so
// a SINGLE app boots fully "logged in" with zero peer services and no auth
// server. Pick the persona with SESSION_FIXTURE_USER=admin|editor|viewer|anon.
//
// PROTECTED: this file is consumed by every app in fixture mode. Changing a
// persona changes local dev for all of them — treat it as a pkg:session change.
import type { Session, User } from "./types";

const FAR_FUTURE = 4102444800; // 2100-01-01, so the fixture never "expires" in dev.

export const fixtureUsers = {
  admin: {
    id: "u_admin",
    name: "Ada Admin",
    email: "admin@example.com",
    role: "admin",
  },
  editor: {
    id: "u_editor",
    name: "Eli Editor",
    email: "editor@example.com",
    role: "editor",
  },
  viewer: {
    id: "u_viewer",
    name: "Vic Viewer",
    email: "viewer@example.com",
    role: "viewer",
  },
} satisfies Record<string, User>;

export type FixturePersona = keyof typeof fixtureUsers | "anon";

export function fixtureSession(persona: FixturePersona = "admin"): Session | null {
  if (persona === "anon") return null;
  return { user: fixtureUsers[persona], expiresAt: FAR_FUTURE };
}
