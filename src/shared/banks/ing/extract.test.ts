import { expect, test } from "vitest";
import ing from "./extract.ts";

const extract = (rawTransactions: unknown[]) =>
  ing.extractions.cash[1](rawTransactions);

test("an ING booking keeps its German amount as a decimal and an empty counterparty as none", () => {
  const closing = [
    "30.09.2026",
    "30.09.2026",
    "",
    "Abschluss",
    "Abschluss per 30.09.2026",
    "",
    "12.410,81",
    "EUR",
    "-1.234,50",
    "EUR",
  ];
  expect(extract([closing])).toEqual([
    {
      data: closing,
      identity: {
        hashOf: [
          "30.09.2026",
          "30.09.2026",
          "",
          "Abschluss",
          "Abschluss per 30.09.2026",
          "",
          "-1.234,50",
          "EUR",
        ],
      },
      cash: {
        date: "2026-09-30",
        amount: "-1234.50",
        currency: "EUR",
        counterparty: null,
        description: "Abschluss per 30.09.2026",
      },
    },
  ]);
});

test("same-day bookings that differ only in their running balance hash the same fields", () => {
  const coffee = (saldo: string) => [
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
  const hashOf = [
    "03.11.2026",
    "03.11.2026",
    "Café",
    "Lastschrift",
    "Kaffee",
    "",
    "-3,50",
    "EUR",
  ];
  expect(
    extract([coffee("996,50"), coffee("993,00")])?.map(
      ({ identity }) => identity,
    ),
  ).toEqual([{ hashOf }, { hashOf }]);
});
