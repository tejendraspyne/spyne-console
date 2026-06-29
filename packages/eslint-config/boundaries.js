import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import importPlugin from "eslint-plugin-import";

// Read the manifest (single source of truth) so the zones below cover every app
// automatically — a new app generated into the manifest is fenced off without
// touching this file.
const require = createRequire(import.meta.url);
const manifest = require("../../repo.manifest.json");
const apps = manifest.workspaces.filter((w) => w.kind === "app");

// Repo root, so zones resolve correctly even though turbo runs eslint inside
// each workspace's own directory (where the default cwd-relative paths break).
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Cross-app / cross-layer zones for import/no-restricted-paths. This rule
 * RESOLVES each import to a real path (via the typescript resolver) and checks
 * the owning directory — so it catches relative escapes like `../../docs/...`
 * that string patterns miss.
 *
 *  - each app may not import from any OTHER app (apps are leaves);
 *  - nothing under packages/ may import an app.
 */
const zones = [
  ...apps.map((a) => ({
    target: `./${a.path}`,
    from: "./apps",
    // `except` is resolved relative to `from`, so it's the app's folder name
    // under apps/ — this lets an app import its own files, just not siblings.
    except: [a.path.replace(/^apps\//, "")],
    message: `Apps are leaves: ${a.name} may not import another app (see repo.manifest.json).`,
  })),
  {
    target: "./packages",
    from: "./apps",
    message: "Shared packages may not import application code (see repo.manifest.json).",
  },
];

/**
 * Boundary enforcement — Wall 1 of the boundary system (see repo.manifest.json).
 *
 * NOTE: the base config loads `eslint-plugin-only-warn`, which downgrades every
 * rule to a warning. These rules are still authored as "error" (intent), and
 * the per-app lint script runs `--max-warnings 0`, so a violation fails the lint
 * gate regardless. `scripts/validate-manifest.mjs` asserts both that this config
 * is spread last AND that apps keep `--max-warnings 0`, so the wall can't be
 * quietly disarmed.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const boundariesConfig = [
  {
    plugins: { import: importPlugin },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json"],
        },
        node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      },
    },
    rules: {
      "import/no-restricted-paths": ["error", { basePath: repoRoot, zones }],
      // Deep-import guard: only a package's declared exports are importable.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@repo/*/src/*", "@repo/*/src"],
              message:
                "Deep-importing package internals is forbidden. Import only the paths in that package's package.json `exports` (see repo.manifest.json publicEntry).",
            },
            {
              group: ["**/apps/*/**", "*/apps/*"],
              message:
                "Apps may not import other apps. Apps are leaves in the dependency graph (see repo.manifest.json).",
            },
          ],
        },
      ],
    },
  },
];

export default boundariesConfig;
