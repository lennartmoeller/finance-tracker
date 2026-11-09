import { createHash } from "node:crypto";
import type { SyncInput } from "@finance-tracker/bank-data-api/contract";

export function identifyRawTransactions(
  input: SyncInput,
): { identity: string; data: SyncInput["rawTransactions"][number] }[] {
  switch (input.source) {
    case "Trade Republic":
      return input.rawTransactions.map((data) => ({
        identity: data.transaction_id,
        data,
      }));
    case "ING":
      // Saldo and its currency are left out, because same-day bookings, and with them their running balances, may change order between exports.
      return hashed(input.rawTransactions, (data) => data.toSpliced(6, 2));
    case "Deutsche Bank":
      return hashed(input.rawTransactions, (data) => data);
  }
}

function hashed<T>(rawTransactions: T[], stableFields: (data: T) => unknown) {
  const occurrences = new Map<string, number>();
  return rawTransactions.map((data) => {
    const fields = JSON.stringify(stableFields(data));
    const occurrence = occurrences.get(fields) ?? 0;
    occurrences.set(fields, occurrence + 1);
    return {
      identity: createHash("sha256")
        .update(`${fields}#${occurrence.toString()}`)
        .digest("hex"),
      data,
    };
  });
}
