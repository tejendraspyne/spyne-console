// @ts-nocheck
// Shared helpers for the boundary tooling. Reads repo.manifest.json (the single
// source of truth) and provides glob matching + git change detection.
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadManifest() {
  const path = join(repoRoot, "repo.manifest.json");
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Convert a manifest `owns` glob to an anchored RegExp. Supports ** and *. */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i++;
        if (glob[i + 1] === "/") i++;
      } else {
        re += "[^/]*";
      }
    } else if ("\\^$+?.()|[]{}".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  return new RegExp("^" + re + "$");
}

export function fileMatchesGlobs(file, globs = []) {
  return globs.some((g) => globToRegExp(g).test(file));
}

/** Find every workspace whose `owns` globs match a given file path. */
export function ownersOf(file, manifest) {
  return manifest.workspaces.filter((w) => fileMatchesGlobs(file, w.owns));
}

export function isGitRepo() {
  try {
    execSync("git rev-parse --is-inside-work-tree", { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Files changed in the working tree (staged + unstaged + untracked), or — when
 * a base ref is given (CI) — changed vs that ref. Returns repo-relative paths.
 */
export function changedFiles({ base } = {}) {
  if (!isGitRepo()) return null;
  const out = base
    ? execSync(`git diff --name-only ${base}...HEAD`, { cwd: repoRoot, encoding: "utf8" })
    : execSync("git status --porcelain=v1 --untracked-files=all", { cwd: repoRoot, encoding: "utf8" });
  return out
    .split("\n")
    .map((l) => (base ? l.trim() : l.slice(3).trim()))
    .filter(Boolean)
    // `git status` may show "old -> new" for renames; keep the new path.
    .map((l) => (l.includes(" -> ") ? l.split(" -> ")[1] : l));
}

export const C = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};
