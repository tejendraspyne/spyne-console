import { nextJsConfig } from "@repo/eslint-config/next-js";
import { boundariesConfig } from "@repo/eslint-config/boundaries";

// boundariesConfig MUST come last (see repo.manifest.json). Do not drop it.
/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // next.config.js runs in Node (reads process.env to wire up the
    // microfrontend rewrites), so allow Node globals there.
    files: ["*.config.{js,mjs}"],
    languageOptions: {
      globals: {
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
  },
  ...boundariesConfig,
];
