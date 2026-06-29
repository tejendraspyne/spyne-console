# vini — agent guide

**Scope id:** `app:vini` · **Owns:** `apps/vini/**` · **Port:** 3005

A Next.js app. Apps are **leaves**: may import shared packages, never another
app; nothing may import this app.

## Allowed imports

`@repo/ui` · `@repo/assets` · `@repo/session` (public entry points only).

## Run standalone

```sh
pnpm --filter vini dev    # port 3005, fixture session, no peers needed
```

## Rules

- Keep changes inside `apps/vini/**`. App-specific styles go in this
  app's CSS, not in `@repo/assets` tokens (global).
- Run `pnpm run boundaries:check` before finishing.
