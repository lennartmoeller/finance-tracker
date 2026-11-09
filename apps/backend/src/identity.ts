import { createHash } from "node:crypto";
import type { SyncInput } from "@finance-tracker/api/contract";

export function identifyRawTransactions(
  input: SyncInput,
): { identity: string; data: SyncInput["rawTransactions"][number] }[] {
  if (input.source === "Trade Republic") {
    return input.rawTransactions.map((data) => ({
      identity: data.transaction_id,
      data,
    }));
  }
  const occurrences = new Map<string, number>();
  return input.rawTransactions.map((data) => {
    // Saldo and its currency are left out, because same-day bookings, and with them their running balances, may change order between exports.
    const [
      booking,
      valueDate,
      counterparty,
      bookingText,
      purpose,
      reference,
      ,
      ,
      amount,
      currency,
    ] = data;
    const fields = JSON.stringify([
      booking,
      valueDate,
      counterparty,
      bookingText,
      purpose,
      reference,
      amount,
      currency,
    ]);
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
