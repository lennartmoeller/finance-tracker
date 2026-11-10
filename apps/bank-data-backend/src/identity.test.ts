import { expect, test } from "vitest";
import type { IngRawTransactionV1 } from "@finance-tracker/bank-data-api/ing";
import type { TradeRepublicRawTransactionV1 } from "@finance-tracker/bank-data-api/trade-republic";
import { ingIdentities, tradeRepublicIdentities } from "./identity.ts";

const coffee = (saldo: string): IngRawTransactionV1 => [
  "03.11.2026",
  "03.11.2026",
  "Café",
  "Lastschrift",
  "Kaffee",
  "",
  saldo,
  "EUR",
  "-3,50",
  "EUR",
];
const rent: IngRawTransactionV1 = [
  "01.11.2026",
  "01.11.2026",
  "Vermieter",
  "Dauerauftrag",
  "Miete",
  "",
  "100,00",
  "EUR",
  "-900,00",
  "EUR",
];

const identities = (rawTransactions: IngRawTransactionV1[]) =>
  ingIdentities(rawTransactions).map(({ identity }) => identity);

test("identical same-day ING bookings stay distinct and keep their identities when their order changes", () => {
  const first = identities([coffee("996,50"), coffee("993,00"), rent]);
  const reordered = identities([rent, coffee("993,00"), coffee("996,50")]);

  expect(new Set(first).size).toBe(3);
  expect(new Set(reordered)).toEqual(new Set(first));
});

test("a Trade Republic raw transaction's identity is its transaction ID", () => {
  const interest = {
    transaction_id: "1c7a4d3f-9e2b-4d6f-8a3c-4b5e6f7a8b9c",
  } as TradeRepublicRawTransactionV1;

  expect(tradeRepublicIdentities([interest])).toEqual([
    { identity: interest.transaction_id, data: interest },
  ]);
});
