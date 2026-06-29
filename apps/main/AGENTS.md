# main — agent guide

**Scope id:** `app:main` · **Owns:** `apps/main/**` · **Port:** 3000

A Next.js app. Apps are **leaves**: may import shared packages, never another
app; nothing may import this app.

## Allowed imports

`@repo/ui` · `@repo/assets` · `@repo/session` (public entry points only).

## Run standalone

```sh
pnpm --filter main dev    # port 3000, fixture session, no peers needed
```

## Rules

- Keep changes inside `apps/main/**`. App-specific styles go in this
  app's CSS, not in `@repo/assets` tokens (global).
- Run `pnpm run boundaries:check` before finishing.
