# console — agent guide

**Scope id:** `app:console` · **Owns:** `apps/console/**` · **Port:** 3001

A Next.js app. Apps are **leaves**: may import shared packages, never another
app; nothing may import this app.

## Allowed imports

`@repo/ui` · `@repo/assets` · `@repo/session` (public entry points only).

## Run standalone

```sh
pnpm --filter console dev    # port 3001, fixture session, no peers needed
```

## Rules

- Keep changes inside `apps/console/**`. App-specific styles go in this
  app's CSS, not in `@repo/assets` tokens (global).
- Run `pnpm run boundaries:check` before finishing.
