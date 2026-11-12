import { expect, test } from "vitest";
import finvesto from "./extract.ts";
import type { DepotV1 } from "./shapes.ts";

const row = (
  reference: string,
  kind: DepotV1[4],
  payment: string,
  shares: string,
) =>
  Object.assign(Array<string>(33).fill("") as DepotV1, {
    2: reference,
    3: "28.10.26",
    4: kind,
    6: "Global Fund",
    7: "LU0000000001",
    8: payment,
    9: "EUR",
    10: shares,
  });

test("a purchase is a trade, a distribution carries what it paid in euros, a sale for a tax only its shares, and a notice yields no normalized transaction", () => {
  const security = {
    date: "2026-10-28",
    isin: "LU0000000001",
    securityName: "Global Fund",
  };
  const rows = [
    row("1/1", "Kauf", "40", "0,334823"),
    Object.assign(row("2/2", "Fondsertrag (Ausschüttung)", "3,6", "0"), {
      5: "Ausschüttung",
      9: "USD",
      30: "1,167463",
    }),
    row("3/3", "Verkauf wegen Vorabpauschale", "1,2", "-0,098047"),
    row("4/4", "Vorabpauschale", "0", "0"),
  ];
  expect(finvesto.extractions.depot[1](rows)).toEqual([
    {
      data: rows[0],
      identity: "1/1",
      depot: {
        ...security,
        type: "trade",
        quantity: "0.334823",
        amount: "40.00",
        currency: "EUR",
        description: "Kauf",
      },
    },
    {
      data: rows[1],
      identity: "2/2",
      depot: {
        ...security,
        type: "distribution",
        quantity: null,
        amount: "3.08",
        currency: "EUR",
        description: "Fondsertrag (Ausschüttung) · Ausschüttung",
      },
    },
    {
      data: rows[2],
      identity: "3/3",
      depot: {
        ...security,
        type: "tax",
        quantity: "-0.098047",
        amount: null,
        currency: null,
        description: "Verkauf wegen Vorabpauschale",
      },
    },
    { data: rows[3], identity: "4/4" },
  ]);
});
