import { expect, test } from "vitest";
import type { Pairable } from "./transfers.ts";
import { transfers } from "./transfers.ts";

const [ingCash, ingSavings, payPal, sparkasse, trCash, trDepot] = [
  1, 2, 3, 4, 5, 6,
];
const ingCashIban = "DE89370400440532013000";

const accounts = [
  { id: ingCash, bank: "ING", number: ingCashIban },
  { id: ingSavings, bank: "ING", number: "DE02500105170137075030" },
  { id: payPal, bank: "PayPal", number: "max@example.com" },
  { id: sparkasse, bank: "Sparkasse", number: "DE02120300000000202051" },
  { id: trCash, bank: "Trade Republic", number: "DE02100500000054540402" },
  { id: trDepot, bank: "Trade Republic", number: "1234567890" },
];

const cash = (
  id: number,
  accountId: number,
  date: string,
  amount: string,
  counterparty: string | null = null,
  extra: Partial<Pairable> & { iban?: string } = {},
): Pairable => ({
  id,
  accountId,
  cash: {
    date,
    amount,
    currency: "EUR",
    counterparty,
    counterpartyIban: extra.iban ?? null,
    description: null,
  },
  depot: null,
  noTransfer: false,
  identity: `row ${String(id)}`,
  pinnedPartnerId: null,
  ...extra,
});

const trade = (id: number, date: string, amount: string): Pairable => ({
  id,
  accountId: trDepot,
  cash: null,
  depot: {
    date,
    isin: "IE00B3RBWM25",
    securityName: "FTSE All-World",
    securityLogo: null,
    type: "trade",
    quantity: "7.767",
    amount,
    currency: "EUR",
    description: null,
  },
  noTransfer: false,
  identity: "trade row",
  pinnedPartnerId: null,
});

const partners = (paired: ReturnType<typeof transfers>["paired"]) =>
  Object.fromEntries(
    [...paired].map(([id, { partnerId, proof }]) => [
      id,
      `${String(partnerId)} ${proof.kind} ${String(proof.by)}`,
    ]),
  );

test("pairs only what a proof backs: one raw row, an IBAN, or a bank name whose other side names no one else", () => {
  const { paired, probable } = transfers(
    [
      cash(1, trCash, "2026-10-28", "-1000.00", null, {
        identity: "trade row",
      }),
      trade(2, "2026-10-28", "1000.00"),
      cash(3, sparkasse, "2026-10-24", "-300.00", "Max Mustermann", {
        iban: ingCashIban,
      }),
      cash(4, ingCash, "2026-10-25", "300.00", "Max Mustermann"),
      cash(5, ingCash, "2026-01-27", "-46.77", "PayPal Europe S.a.r.l."),
      cash(6, payPal, "2026-01-23", "46.77"),
      cash(7, payPal, "2026-01-28", "46.77", "Shop GmbH"),
      cash(8, ingCash, "2026-10-14", "-500.00", "Max Mustermann"),
      cash(9, ingSavings, "2026-10-15", "500.00", "Max Mustermann"),
      cash(10, sparkasse, "2023-11-13", "-3.20", "PayPal Europe S.a.r.l."),
    ],
    accounts,
  );
  expect(partners(paired)).toEqual({
    1: "2 row null",
    2: "1 row null",
    3: "4 iban 3",
    4: "3 iban 3",
    5: "6 bank 5",
    6: "5 bank 5",
  });
  expect(Object.fromEntries(probable)).toEqual({
    8: { partnerId: 9, bank: null },
    9: { partnerId: 8, bank: null },
    10: { partnerId: null, bank: "PayPal" },
  });
});

test("a pin wins over a closer proven partner, and a transaction marked as no transfer neither pairs nor counts as anyone's candidate", () => {
  const { paired, probable } = transfers(
    [
      cash(1, ingCash, "2026-01-27", "-46.77", "PayPal Europe S.a.r.l.", {
        pinnedPartnerId: 3,
      }),
      cash(2, payPal, "2026-01-27", "46.77"),
      cash(3, payPal, "2026-01-12", "46.77", null, { pinnedPartnerId: 1 }),
      cash(4, payPal, "2026-03-21", "10.00", "Alex Example", {
        noTransfer: true,
      }),
      cash(5, ingCash, "2026-03-19", "-10.00", "VISA BAECKEREI"),
    ],
    accounts,
  );
  expect(partners(paired)).toEqual({ 1: "3 pinned null", 3: "1 pinned null" });
  expect(Object.fromEntries(probable)).toEqual({});
});

test("a booking that names the other bank pairs only with a booking on its own date or before, as a bank collects after PayPal books", () => {
  const { paired } = transfers(
    [
      cash(1, payPal, "2026-03-21", "15.00"),
      cash(2, payPal, "2026-03-25", "15.00"),
      cash(3, ingCash, "2026-03-24", "-15.00", "PayPal Europe S.a.r.l."),
      cash(4, ingCash, "2026-03-27", "-15.00", "PayPal Europe S.a.r.l."),
    ],
    accounts,
  );
  expect(partners(paired)).toEqual({
    1: "3 bank 3",
    3: "1 bank 3",
    2: "4 bank 4",
    4: "2 bank 4",
  });
});
