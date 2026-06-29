# @repo/eslint-config — agent guide

**Scope id:** `pkg:eslint-config` · **Owns:** `packages/eslint-config/**` · **Affects ALL apps.**

Shared ESLint configs. **`boundaries.js` is Wall 1 of the boundary system** — its
rules are force-set to `error` and must be spread *after* the base config (which
loads `eslint-plugin-only-warn`). Weakening these rules disarms cross-app
enforcement for every app, so treat changes here as high-impact `root`-adjacent.

## Entry points

`./base` · `./next-js` · `./react-internal` · `./boundaries`

## Rules

- Do not downgrade the `boundaries/*` or `no-restricted-imports` rules to `warn`.
- Changes affect lint for the whole repo; verify with `pnpm run lint`.
