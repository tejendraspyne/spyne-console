# Agent guide — console monorepo

This repo is built to be driven by AI agents in a no-code style. **Read this
file and [`repo.manifest.json`](./repo.manifest.json) FIRST**, before editing
anything. The manifest is the single source of truth; the boundary tooling and
these docs all read it, so they cannot drift.

## The one rule: one change = one scope

Every change request maps to **exactly one workspace** (one app, or one shared
package, or `root`). You may not edit two apps in one change, and a shared-package
or root edit is its own scope — never a silent ride-along on an app change,
because shared code affects **every** app.

### How to scope a prompt

1. **Identify the workspace** from the prompt using the table below.
2. **Edit only within that workspace's `owns` globs** (see the manifest).
3. **Run `pnpm run boundaries:check`** before you're done. It derives the touched
   scope from your actual diff and fails if you crossed a boundary.
4. If the prompt is ambiguous or genuinely spans workspaces, **stop and ask** /
   split it into separate changes.

| The prompt mentions… | Scope | Edit under |
| --- | --- | --- |
| "main", the primary app | `app:main` | `apps/main/**` |
| "console", the console app | `app:console` | `apps/console/**` |
| "login" (the app) | `app:login` | `apps/login/**` |
| "inventory" | `app:inventory` | `apps/inventory/**` |
| "admin-tools", admin | `app:admin-tools` | `apps/admin-tools/**` |
| "vini" | `app:vini` | `apps/vini/**` |
| "studio" | `app:studio` | `apps/studio/**` |
| "docs", the docs app | `app:docs` | `apps/docs/**` |
| a shared component / "button", "card" | `pkg:ui` | `packages/ui/**` |
| an icon / logo / font / color **token** | `pkg:assets` | `packages/assets/**` |
| login / session / user / auth | `pkg:session` | `packages/session/**` |
| lint / eslint / boundaries rules | `pkg:eslint-config` | `packages/eslint-config/**` |
| tsconfig / compiler options | `pkg:typescript-config` | `packages/typescript-config/**` |
| deps / turbo / scripts / the manifest itself | `root` | root infra (see manifest) |

> Disambiguation example: "change the button color in **main**" → `app:main`
> (style it in main's own CSS). Editing `@repo/ui`'s Button would change every app,
> so that would be a separate `pkg:ui` change only if the component itself must
> change.

## Boundaries are enforced, not just documented

- **Wall 1 — ESLint** (`@repo/eslint-config/boundaries`): an app importing
  another app, a package importing an app, or any deep-import of a package's
  internals is a lint **error** (`pnpm run lint`).
- **Wall 2 — package `exports`**: packages expose only their declared entry
  points; apps are private and unimportable.
- **Wall 3 — scope guard** (`scripts/check-scope.mjs`): derived from your git
  diff, fails cross-app changes and shared/root ride-alongs, and prints the
  blast radius of shared edits.
- **Drift guard** (`scripts/validate-manifest.mjs`): every workspace must be in
  the manifest, apps must stay leaves, packages must keep tight exports, and each
  app must keep spreading the boundary lint config.

Run all of it with **`pnpm run check`** (lint + types + boundaries).

## Shared data + running a single app

- Login/session is shared via [`@repo/session`](./packages/session/AGENTS.md). A
  server component reads `getServerSession()` and passes it to `<SessionProvider>`.
- The default `SESSION_MODE=fixture` returns a mock user with no backend, so you
  can run **one app on its own**: `pnpm run dev:main` (or `dev:console`, etc.). See
  [`.env.example`](./.env.example) for `remote` mode.

## Adding things (so growth can't bypass the boundaries)

- New package: `pnpm run gen:package` — scaffolds a boundary-compliant package.
- New app: `pnpm run gen:app` — scaffolds a Next app pre-wired to the packages.
- New asset: drop the file in `packages/assets/raw/<icons|fonts>/` and run
  `pnpm run gen:asset`.

After generating, run `pnpm run boundaries:check` — it will fail until the new
workspace is registered in the manifest, which keeps the system honest.

## Known limitations (be honest about these)

- Shared packages are consumed as **source** (transpiled), so editing one
  changes every consuming app. That's by design for DX; the scope guard makes
  the blast radius visible but cannot prevent a deliberately-scoped `pkg:*` edit.
- `git`-less checkouts can't run the scope guard. CI should run
  `pnpm run check` and `check-scope --base=<main>` as a required gate; husky/
  CODEOWNERS/team review are recommended follow-ups (see README).
