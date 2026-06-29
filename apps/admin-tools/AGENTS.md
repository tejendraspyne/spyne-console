# admin-tools — agent guide

**Scope id:** `app:admin-tools` · **Owns:** `apps/admin-tools/**` · **Port:** 3004

A Next.js app. Apps are **leaves**: may import shared packages, never another
app; nothing may import this app.

## Allowed imports

`@repo/ui` · `@repo/assets` · `@repo/session` (public entry points only).

## Run standalone

```sh
pnpm --filter admin-tools dev    # port 3004, fixture session, no peers needed
```

## Rules

- Keep changes inside `apps/admin-tools/**`. App-specific styles go in this
  app's CSS, not in `@repo/assets` tokens (global).
- Run `pnpm run boundaries:check` before finishing.
