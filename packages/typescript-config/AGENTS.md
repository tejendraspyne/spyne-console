# @repo/typescript-config — agent guide

**Scope id:** `pkg:typescript-config` · **Owns:** `packages/typescript-config/**` · **Affects ALL apps.**

Shared TypeScript base configs (`base.json`, `nextjs.json`, `react-library.json`).
Apps and packages extend these, so changes affect type-checking everywhere.

## Rules

- Keep `nextjs.json` on `moduleResolution: Bundler` (apps) and the base on
  `NodeNext` (packages) — they intentionally differ.
- Verify with `pnpm run check-types` across the repo after any change.
