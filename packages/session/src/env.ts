// Env-driven configuration. The session mode is a SHARED CONTRACT, not a
// per-app setting — it lives here so every app reads it the same way.
//
// SESSION_MODE          fixture | remote   (default: fixture)
// SESSION_FIXTURE_USER  admin | editor | viewer | anon   (default: admin)
// AUTH_API_URL          base URL of the central session service (remote mode)
// AUTH_COOKIE_NAME      shared cookie name (default: console_session)
// AUTH_LOGIN_URL        where requireSession() redirects when logged out
import type { AuthMode } from "./types";
import type { FixturePersona } from "./fixtures";

export interface SessionEnv {
  mode: AuthMode;
  fixturePersona: FixturePersona;
  authApiUrl?: string;
  cookieName: string;
  loginUrl: string;
}

export function readSessionEnv(): SessionEnv {
  const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>;
  const mode: AuthMode = env.SESSION_MODE === "remote" ? "remote" : "fixture";
  const cookieName = env.AUTH_COOKIE_NAME || "console_session";
  const loginUrl = env.AUTH_LOGIN_URL || "/login";
  const fixturePersona = (env.SESSION_FIXTURE_USER as FixturePersona) || "admin";

  if (mode === "remote" && !env.AUTH_API_URL) {
    throw new Error(
      "[@repo/session] SESSION_MODE=remote requires AUTH_API_URL to be set. See .env.example.",
    );
  }

  // Mock auth in production is almost always a mistake — warn loudly, but do
  // NOT throw (a hard throw would break `next build`, which sets NODE_ENV=production).
  if (env.NODE_ENV === "production" && mode === "fixture") {
    console.warn(
      "[@repo/session] WARNING: running in production with SESSION_MODE=fixture (mock login). " +
        "Set SESSION_MODE=remote + AUTH_API_URL for a real deployment.",
    );
  }

  return { mode, fixturePersona, authApiUrl: env.AUTH_API_URL, cookieName, loginUrl };
}
