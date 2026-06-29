# @repo/assets — agent guide

**Scope id:** `pkg:assets` · **Owns:** `packages/assets/**` · **Affects ALL apps.**

Single authority for every shared asset: SVG icons, fonts, and design tokens.
Editing anything here changes **every app** that imports it. That makes this a
`pkg:assets` change, never a ride-along on an app task. If a prompt is "make
*web's* background darker", that is an **app** change (web's own CSS), not a
token edit here — token edits recolor docs too.

## Public surface (the only legal imports)

| Import | What |
| --- | --- |
| `@repo/assets/icons` | All icon components + `iconNames`, `IconName`, `icons` registry |
| `@repo/assets/icons/GlobeIcon` | A single icon component |
| `@repo/assets/fonts` | `geistSans`, `geistMono`, `fontVariables` |
| `@repo/assets/tokens` | Typed `tokens` object |
| `@repo/assets/tokens.css` | CSS custom properties (`@import` in globals.css) |
| `@repo/assets/manifest` | Generated machine-readable asset index |

## How to add / change an asset (the no-code path)

1. **Icon:** drop `my-icon.svg` into `raw/icons/`, then run `pnpm run gen:icons`
   (from this package) or `pnpm run gen:asset` (repo root). It produces
   `src/icons/MyIconIcon.tsx`, updates the barrel, and the manifest. Solid
   fills become `currentColor` so the icon follows CSS `color`.
2. **Token:** edit `src/tokens/tokens.values.json` (the single source of truth),
   then run `pnpm run gen:tokens`. This regenerates `src/tokens/tokens.css`.
3. **Font:** add the file to `raw/fonts/` and a `localFont(...)` export in
   `src/fonts/index.ts`.

## Rules

- **Generated files are committed but never hand-edited:** everything under
  `src/icons/**` and `src/tokens/tokens.css`. Change the source (`raw/` or
  `tokens.values.json`) and regenerate, or the next generator run reverts you.
- `protectedPaths` (`src/tokens/**`) are global — confirm the cross-app impact
  before changing them.
- This package may not import apps, `@repo/ui`, or `@repo/session`.
