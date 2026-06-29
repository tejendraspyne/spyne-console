# console

A Turborepo monorepo built to be driven by AI agents in a **no-code** style.
Eight Next.js apps share component, asset, and session packages, with **enforced
boundaries** so a prompt to change one app can't bleed into another.

> **Agents:** start at [`AGENTS.md`](./AGENTS.md) and
> [`repo.manifest.json`](./repo.manifest.json).

## What's inside

| Workspace | What |
| --- | --- |
| `apps/main` | Primary Next.js app (port 3000) |
| `apps/console` | Console Next.js app (port 3001) |
| `apps/login` | Login Next.js app (port 3002) |
| `apps/inventory` | Inventory Next.js app (port 3003) |
| `apps/admin-tools` | Admin tools Next.js app (port 3004) |
| `apps/vini` | Vini Next.js app (port 3005) |
| `apps/studio` | Studio Next.js app (port 3006) |
| `apps/docs` | Docs Next.js app (port 3007) |
| `@repo/ui` | Shared React components (`button`, `card`, `code`) |
| `@repo/assets` | **All assets in one place** — icon components, fonts, design tokens |
| `@repo/session` | **Shared login/session** + fixture mode for standalone dev |
| `@repo/eslint-config` | ESLint config incl. the boundary rules |
| `@repo/typescript-config` | Shared tsconfigs |

## Run a single app (no need to start the whole repo)

```sh
pnpm install
pnpm run dev:main          # only main, on :3000   (or: pnpm --filter main dev)
pnpm run dev:console       # only console, on :3001
pnpm run dev:login         # only login, on :3002
pnpm run dev:inventory     # only inventory, on :3003
pnpm run dev:admin-tools   # only admin-tools, on :3004
pnpm run dev:vini          # only vini, on :3005
pnpm run dev:studio        # only studio, on :3006
pnpm run dev:docs          # only docs, on :3007
```

Each app boots fully "logged in" via a **fixture session** — no auth backend and
no peer app required. Pick the mock persona with `SESSION_FIXTURE_USER`.

Per-app filtered scripts also exist: `build:main`, `lint:docs`, `types:console`, etc.

## Environment

Copy [`.env.example`](./.env.example) to `.env` or `.env.local` at the repo root.
Session keys are documented in [`packages/session`](./packages/session/AGENTS.md).
Each app runs on its own port — no proxy between them.

## Docker deployment

Each app has its own `docker-compose.yml` under `apps/<name>/`. A root
`docker-compose.yml` runs all eight services together.

```sh
# All apps (ports 3000–3007)
pnpm run docker:up

# One app only
docker compose -f apps/main/docker-compose.yml up --build -d
docker compose -f apps/console/docker-compose.yml up --build -d
# … same pattern for login, inventory, admin-tools, vini, studio, docs

pnpm run docker:down    # stop all (root compose)
pnpm run docker:logs    # follow logs (root compose)
```

Copy `.env.example` to `.env` before deploying if you need custom session settings.
For production auth, set `SESSION_MODE=remote` and the `AUTH_*` variables.

## Shared data between services (session)

`@repo/session` defines the cross-app `User`/`Session` contract once.

| `SESSION_MODE` | Behavior |
| --- | --- |
| `fixture` (default) | In-process mock user, zero network — powers standalone dev |
| `remote` | Reads a shared cookie + calls `AUTH_API_URL` so apps on a shared parent domain see the same login |

See [`.env.example`](./.env.example). Wiring: a server component calls
`getServerSession()` and passes it to `<SessionProvider initialSession=…>`;
client components read `useSession()`.

## App boundaries (the no-code guardrail)

Every workspace declares what it `owns` and may import in
[`repo.manifest.json`](./repo.manifest.json). **A change is scoped to one
workspace**; cross-app edits and shared/root ride-alongs are rejected. Three
walls back the docs:

1. **ESLint** — cross-app imports and deep package imports are lint errors.
2. **package `exports`** — only declared entry points are importable; apps are private.
3. **Scope guard** — `scripts/check-scope.mjs` derives the touched scope from the
   git diff and prints the blast radius of shared edits.

```sh
pnpm run check              # lint + types + boundaries (run before finishing a change)
pnpm run boundaries:check   # just the manifest + scope guards
```

## Assets

`@repo/assets` is the single source for icons (SVG → `currentColor` React
components), fonts, and design tokens. To add one: drop the file in
`packages/assets/raw/<icons|fonts>/` (or edit `src/tokens/tokens.values.json`)
and run `pnpm run gen:asset`. Generated files under `src/` are committed but never
hand-edited.

## Scaffolding (growth can't bypass the boundaries)

```sh
pnpm run gen:package   # new @repo/* package, pre-wired with tight exports + AGENTS.md
pnpm run gen:app       # new Next app, pre-wired to packages + boundary lint
```

Generators register the new workspace in the manifest automatically; run
`pnpm run boundaries:check` afterward.

## Recommended follow-ups (not wired in a fresh checkout)

- `git init` to enable the scope guard locally.
- In CI, run `pnpm run check` and `node scripts/check-scope.mjs --base=<main>` as a
  **required** status check (immune to local `--no-verify`).
- Fill in [`CODEOWNERS`](./CODEOWNERS) team handles and require code-owner review,
  so shared-package/root edits need platform sign-off.
