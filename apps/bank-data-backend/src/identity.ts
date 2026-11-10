import { createHash } from "node:crypto";
import type { FinvestoRawTransactionV1 } from "@finance-tracker/bank-data-api/finvesto";
import type { IngRawTransactionV1 } from "@finance-tracker/bank-data-api/ing";
import type { TradeRepublicRawTransactionV1 } from "@finance-tracker/bank-data-api/trade-republic";

export const tradeRepublicIdentities = (
  rawTransactions: TradeRepublicRawTransactionV1[],
) => rawTransactions.map((data) => ({ identity: data.transaction_id, data }));

export const finvestoIdentities = (
  rawTransactions: FinvestoRawTransactionV1[],
) => rawTransactions.map((data) => ({ identity: data[2], data }));

// Saldo and its currency are left out, because same-day bookings, and with them their running balances, may change order between exports.
export const ingIdentities = (rawTransactions: IngRawTransactionV1[]) =>
  hashed(rawTransactions, (data) => data.toSpliced(6, 2));

export const deutscheBankIdentities = <T>(rawTransactions: T[]) =>
  hashed(rawTransactions, (data) => data);

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
