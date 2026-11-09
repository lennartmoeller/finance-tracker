import { createHash } from "node:crypto";
import type { IngRawTransactionV1 } from "@finance-tracker/banks/ing";

export function identifyIngTransactions(
  rawTransactions: IngRawTransactionV1[],
) {
  const occurrences = new Map<string, number>();
  return rawTransactions.map((data) => {
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
