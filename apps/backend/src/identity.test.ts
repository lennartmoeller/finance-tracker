import { expect, test } from "vitest";
import type { IngRawTransactionV1 } from "@finance-tracker/banks/ing";
import { identifyIngTransactions } from "./identity.ts";

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
  identifyIngTransactions(rawTransactions).map(({ identity }) => identity);

test("identical same-day bookings stay distinct and keep their identities when their order changes", () => {
  const first = identities([coffee("996,50"), coffee("993,00"), rent]);
  const reordered = identities([rent, coffee("993,00"), coffee("996,50")]);

  expect(new Set(first).size).toBe(3);
  expect(new Set(reordered)).toEqual(new Set(first));
});
