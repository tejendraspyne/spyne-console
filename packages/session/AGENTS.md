# @repo/session — agent guide

**Scope id:** `pkg:session` · **Owns:** `packages/session/**` · **Affects ALL apps.**

The single shared login/session surface. It defines the cross-app contract
(`User`, `Session`) and the mechanism that lets one app run standalone.

## Public surface (the only legal imports)

| Import | Use from | What |
| --- | --- | --- |
| `@repo/session/types` | anywhere | `User`, `Session`, `Role`, `SessionState`, `AuthMode` |
| `@repo/session/server` | server components / route handlers | `getServerSession()`, `requireSession()`, `requireRole()` |
| `@repo/session/client` | client components | `SessionProvider`, `useSession()`, `useUser()`, `useSignOut()` |

## How apps wire it

1. In the app's `app/layout.tsx` (a server component): `const session = await getServerSession()`.
2. Pass it down: `<SessionProvider initialSession={session}>{children}</SessionProvider>`.
3. In client components: `const { status, session } = useSession()`.

No `/api` round-trip is needed, so a single app boots logged-in standalone.

## Two modes (one contract)

- **`SESSION_MODE=fixture` (default):** returns a mock user from `fixtures.ts`
  with zero network — this is what makes `pnpm run dev:main` work alone. Pick the
  persona with `SESSION_FIXTURE_USER=admin|editor|viewer|anon`.
- **`SESSION_MODE=remote`:** reads the shared `AUTH_COOKIE_NAME` cookie and calls
  `AUTH_API_URL` so apps on a shared parent domain see the same login.

> Two localhost ports do **not** share a cookie without a `*.console.local`
> hosts-alias or proxy, so `remote` is for staging/prod, not solo localhost dev.
> See `.env.example`.

## Rules

- Never deep-import internals (`adapters`, `env`, `fixtures`) — use the three
  public entry points above.
- `fixtures.ts` is protected: it changes local dev for every app.
- The auth cookie name/domain and `SESSION_MODE` are shared contracts owned
  here — apps must not re-implement cookie writes.
- This package may not import apps, `@repo/ui`, or `@repo/assets`.
