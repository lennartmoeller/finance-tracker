import { globSync } from "node:fs";
import { join } from "node:path";

// WXT's config loader hands out half-evaluated modules to parallel imports, so the banks load one after another.
export async function discover<T>(file: "adapter.ts" | "extract.ts") {
  const found: T[] = [];
  for (const path of globSync(`*/${file}`, { cwd: import.meta.dirname }).sort())
    found.push(
      ((await import(join(import.meta.dirname, path))) as { default: T })
        .default,
    );
  return found;
}
