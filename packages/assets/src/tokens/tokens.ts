// Design tokens — the single source of truth is tokens.values.json.
// The CSS variables in tokens.css are GENERATED from the same JSON
// (run `pnpm run gen:tokens`). Import this module for typed JS access.
import values from "./tokens.values.json";

export const tokens = values;
export type Tokens = typeof values;
