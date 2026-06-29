// Server-side session access (RSC / route handlers / server actions).
// Import only from server components — it touches next/headers + next/navigation.
//
// In `fixture` mode it returns a mock user with zero network, which is what
// lets a single app run standalone. In `remote` mode it reads the shared auth
// cookie and asks the central session service who the user is.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSessionEnv } from "./env";
import { fixtureSession } from "./fixtures";
import type { Role, Session } from "./types";

export async function getServerSession(): Promise<Session | null> {
  const env = readSessionEnv();

  if (env.mode === "fixture") {
    return fixtureSession(env.fixturePersona);
  }

  const store = await cookies();
  const token = store.get(env.cookieName)?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${env.authApiUrl}/api/session`, {
      headers: { cookie: `${env.cookieName}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Session;
  } catch {
    return null;
  }
}

/** Returns the session or redirects to the login URL if unauthenticated. */
export async function requireSession(): Promise<Session> {
  const session = await getServerSession();
  if (!session) redirect(readSessionEnv().loginUrl);
  return session;
}

/** Returns the session or redirects unless the user holds one of `roles`. */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) redirect(readSessionEnv().loginUrl);
  return session;
}
