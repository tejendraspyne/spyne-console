import { existsSync, readFileSync, writeFileSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import type { PlopTypes } from "@turbo/gen";

const repoRoot = process.cwd();
const manifestPath = join(repoRoot, "repo.manifest.json");

/** Insert a workspace entry into repo.manifest.json, just before the `root` entry. */
function addToManifest(entry: Record<string, unknown>): string {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.workspaces.some((w: { id: string }) => w.id === entry.id)) {
    return `manifest: ${entry.id} already present — left unchanged`;
  }
  const rootIdx = manifest.workspaces.findIndex((w: { kind: string }) => w.kind === "root");
  const at = rootIdx === -1 ? manifest.workspaces.length : rootIdx;
  manifest.workspaces.splice(at, 0, entry);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  return `manifest: registered ${entry.id}`;
}

/** Create a CLAUDE.md -> AGENTS.md symlink in a workspace dir. */
function linkClaudeMd(wsPath: string): string {
  const dir = join(repoRoot, wsPath);
  const link = join(dir, "CLAUDE.md");
  if (existsSync(link)) return "CLAUDE.md already exists";
  symlinkSync("AGENTS.md", link);
  return "linked CLAUDE.md -> AGENTS.md";
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // ---- new shared package ----------------------------------------------------
  plop.setGenerator("new-package", {
    description: "Scaffold a boundary-compliant shared package (@repo/<name>)",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Package name (without @repo/, e.g. analytics):",
        validate: (v: string) => (/^[a-z0-9-]+$/.test(v) ? true : "lowercase, digits and dashes only"),
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: "packages/{{kebabCase name}}",
        base: "templates/package",
        templateFiles: "templates/package/**/*",
        globOptions: { dot: true },
      },
      (answers) => {
        const name = (answers as { name: string }).name;
        return addToManifest({
          id: `pkg:${name}`,
          name: `@repo/${name}`,
          kind: "package",
          path: `packages/${name}`,
          owns: [`packages/${name}/**`],
          mayImport: [],
          mayNotImport: ["apps/*"],
          affectsAllApps: true,
          publicEntry: ["./index"],
          description: `TODO: describe @repo/${name}.`,
        });
      },
      (answers) => linkClaudeMd(`packages/${(answers as { name: string }).name}`),
      () => "\nNext: run `pnpm install` then `pnpm run boundaries:check`.",
    ],
  });

  // ---- new app ---------------------------------------------------------------
  plop.setGenerator("new-app", {
    description: "Scaffold a Next.js app pre-wired to the shared packages + boundaries",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "App name (e.g. admin):",
        validate: (v: string) => (/^[a-z0-9-]+$/.test(v) ? true : "lowercase, digits and dashes only"),
      },
      {
        type: "input",
        name: "port",
        message: "Dev port (e.g. 3002):",
        validate: (v: string) => (/^\d{2,5}$/.test(v) ? true : "a port number"),
      },
    ],
    actions: [
      {
        type: "addMany",
        destination: "apps/{{kebabCase name}}",
        base: "templates/app",
        templateFiles: "templates/app/**/*",
        globOptions: { dot: true },
      },
      (answers) => {
        const { name, port } = answers as { name: string; port: string };
        return addToManifest({
          id: `app:${name}`,
          name,
          kind: "app",
          path: `apps/${name}`,
          port: Number(port),
          owns: [`apps/${name}/**`],
          mayImport: ["@repo/ui", "@repo/assets", "@repo/session"],
          mayNotImport: ["apps/*"],
          standalone: true,
          run: `pnpm run dev:${name}`,
          description: `TODO: describe the ${name} app.`,
        });
      },
      (answers) => linkClaudeMd(`apps/${(answers as { name: string }).name}`),
      () => "\nNext: run `pnpm install`, then `pnpm --filter <name> dev` and `pnpm run boundaries:check`.",
    ],
  });
}
