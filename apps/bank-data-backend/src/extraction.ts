import type { z } from "zod";
import type {
  Account,
  NormalizedTransaction,
} from "@finance-tracker/bank-data-api/contract";
import {
  deutscheBankDepotRawTransactionV1,
  type DeutscheBankDepotRawTransactionV1,
} from "@finance-tracker/bank-data-api/deutsche-bank-depot";
import { deutscheBankGiroRawTransactionV1 } from "@finance-tracker/bank-data-api/deutsche-bank-giro";
import {
  finvestoRawTransactionV1,
  type FinvestoRawTransactionV1,
} from "@finance-tracker/bank-data-api/finvesto";
import { ingRawTransactionV1 } from "@finance-tracker/bank-data-api/ing";
import {
  tradeRepublicRawTransactionV1,
  type TradeRepublicRawTransactionV1,
} from "@finance-tracker/bank-data-api/trade-republic";
import {
  deutscheBankIdentities,
  finvestoIdentities,
  ingIdentities,
  tradeRepublicIdentities,
} from "./identity.ts";

export function extractTransactions(
  { bank, type }: Pick<Account, "bank" | "type">,
  rawTransactions: unknown[],
) {
  switch (bank) {
    case "ING":
      return read(ingRawTransactionV1, rawTransactions, ingIdentities, (row) =>
        fromGermanBooking({
          date: row[0],
          amount: row[8],
          currency: row[9],
          counterparty: row[2],
          description: row[4],
        }),
      );
    case "Deutsche Bank":
      return type === "depot"
        ? read(
            deutscheBankDepotRawTransactionV1,
            rawTransactions,
            deutscheBankIdentities,
            fromDeutscheBankDepot,
          )
        : read(
            deutscheBankGiroRawTransactionV1,
            rawTransactions,
            deutscheBankIdentities,
            (row) =>
              fromGermanBooking({
                date: row[0],
                amount: row[11],
                currency: row[17],
                counterparty: row[3],
                description: row[4],
              }),
          );
    case "Trade Republic":
      return read(
        tradeRepublicRawTransactionV1,
        rawTransactions,
        tradeRepublicIdentities,
        fromTradeRepublic,
      );
    case "finvesto":
      return read(
        finvestoRawTransactionV1,
        rawTransactions,
        finvestoIdentities,
        fromFinvesto,
      );
  }
}

function read<T>(
  shape: z.ZodType<T>,
  rawTransactions: unknown[],
  identify: (rawTransactions: T[]) => { identity: string; data: T }[],
  extract: (data: T) => NormalizedTransaction,
) {
  const parsed = shape.array().safeParse(rawTransactions);
  return parsed.success
    ? identify(parsed.data).map((row) => ({ ...row, ...extract(row.data) }))
    : undefined;
}

type Direction = -1 | 0 | 1;

const noSecurity = { isin: null, securityName: null, quantity: null };

const germanDecimal = (text: string) =>
  text.replaceAll(".", "").replace(",", ".");

const germanDate = (text: string) =>
  text
    .split(".")
    .reverse()
    .map((part) => part.padStart(2, "0"))
    .join("-");

function moved(value: string, direction: Direction): string | null {
  if (direction === 0 || Number(value) === 0) return null;
  if (direction === 1) return value;
  return value.startsWith("-") ? value.slice(1) : `-${value}`;
}

function cashLeg(
  money: { amount: string; currency: string } | undefined,
  direction: Direction,
): Pick<NormalizedTransaction, "amount" | "currency"> {
  const amount = money && moved(money.amount, direction);
  return money && amount
    ? { amount, currency: money.currency }
    : { amount: null, currency: null };
}

function fromGermanBooking(booking: {
  date: string;
  amount: string;
  currency: string;
  counterparty: string;
  description: string;
}): NormalizedTransaction {
  return {
    date: germanDate(booking.date),
    amount: germanDecimal(booking.amount),
    currency: booking.currency,
    counterparty: booking.counterparty || null,
    description: booking.description || null,
    ...noSecurity,
  };
}

const deutscheBankDepotShares: Record<
  DeutscheBankDepotRawTransactionV1["subType"],
  Direction
> = {
  DIVIDEND_DISBURSEMENT: 0,
  RECEIPT: 1,
};

function fromDeutscheBankDepot(
  data: DeutscheBankDepotRawTransactionV1,
): NormalizedTransaction {
  return {
    date: data.bookDate,
    ...cashLeg(data.calculatedAmounts.totalAmountEuroCurrency, 1),
    counterparty: null,
    description: data.subType,
    isin: data.security.isin,
    securityName: data.security.name,
    quantity: moved(data.quantity, deutscheBankDepotShares[data.subType]),
  };
}

function fromTradeRepublic(
  data: TradeRepublicRawTransactionV1,
): NormalizedTransaction {
  return {
    date: data.date,
    amount: data.amount,
    currency: data.currency,
    counterparty: data.counterparty_name || null,
    description: data.description || null,
    isin: data.symbol || null,
    securityName: data.name || null,
    quantity: moved(data.shares, data.type === "DIVIDEND" ? 0 : 1),
  };
}

// finvesto's Zahlungsbetrag is unsigned, so the Umsatzart tells whether the money left or reached the user.
const finvestoCash: Record<FinvestoRawTransactionV1[4], Direction> = {
  Kauf: -1,
  "Wiederanlage Fondsertrag": -1,
  "Fondsertrag (Ausschüttung)": 1,
  "Verkauf wegen Vorabpauschale": 1,
  Vorabpauschale: -1,
  "Entgeltbelastung Verkauf": 1,
  Entgeltermittlung: -1,
};

function fromFinvesto(row: FinvestoRawTransactionV1): NormalizedTransaction {
  const [kind, part] = [row[4], row[5]];
  return {
    date: `20${germanDate(row[3])}`,
    ...cashLeg(
      { amount: germanDecimal(row[8]), currency: row[9] },
      finvestoCash[kind],
    ),
    counterparty: null,
    description: part ? `${kind} · ${part}` : kind,
    isin: row[7],
    securityName: row[6],
    quantity: moved(germanDecimal(row[10]), 1),
  };
}
