import { globSync } from "node:fs";
import { join } from "node:path";

const banks = join(import.meta.dirname, "banks");

// WXT's config loader hands out half-evaluated modules to parallel imports, so the banks load one after another.
export async function discover<T>(file: "adapter.ts" | "extract.ts") {
  const found: T[] = [];
  for (const path of globSync(`*/${file}`, { cwd: banks }).sort())
    found.push(((await import(join(banks, path))) as { default: T }).default);
  return found;
}
