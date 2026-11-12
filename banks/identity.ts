import { createHash } from "node:crypto";
import type { Extracted } from "@finance-tracker/shared/bank";

export function identify<T extends Pick<Extracted, "identity">>(
  extracted: T[],
) {
  const occurrences = new Map<string, number>();
  return extracted.map((row) => {
    if (typeof row.identity === "string")
      return { ...row, identity: row.identity };
    const fields = JSON.stringify(row.identity.hashOf);
    const occurrence = occurrences.get(fields) ?? 0;
    occurrences.set(fields, occurrence + 1);
    return {
      ...row,
      identity: createHash("sha256")
        .update(`${fields}#${occurrence.toString()}`)
        .digest("hex"),
    };
  });
}
