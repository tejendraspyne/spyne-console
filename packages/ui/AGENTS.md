# @repo/ui — agent guide

**Scope id:** `pkg:ui` · **Owns:** `packages/ui/**` · **Affects ALL apps.**

Shared React component library. Editing a component here changes **every** app
that imports it, so this is a `pkg:ui` change — never a ride-along on an app task.

## Public surface (the only legal imports)

`@repo/ui/button` · `@repo/ui/card` · `@repo/ui/code`

When you add a component, add it to `package.json` `exports` (no `./*` wildcard)
and the manifest stays consistent via `pnpm run boundaries:check`.

## Rules

- This package may import `@repo/assets`, but never an app or `@repo/session`.
- No deep imports of other packages' internals.
