import type { z } from "zod";
import type {
  Account,
  CashTransaction,
  DepotTransaction,
} from "@finance-tracker/shared/contract";
import {
  cents,
  centsQuotient,
  decimalSum,
} from "@finance-tracker/shared/decimal";
import {
  deutscheBankDepotRawTransactionV1,
  type DeutscheBankDepotRawTransactionV1,
} from "@finance-tracker/shared/deutsche-bank-depot";
import { deutscheBankCashRawTransactionV1 } from "@finance-tracker/shared/deutsche-bank-cash";
import {
  finvestoRawTransactionV1,
  type FinvestoRawTransactionV1,
} from "@finance-tracker/shared/finvesto";
import { ingRawTransactionV1 } from "@finance-tracker/shared/ing";
import {
  tradeRepublicRawTransactionV1,
  type TradeRepublicRawTransactionV1,
} from "@finance-tracker/shared/trade-republic";
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
            deutscheBankCashRawTransactionV1,
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
        (row) => fromTradeRepublic(row, type),
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

interface Extracted {
  cash?: CashTransaction;
  depot?: DepotTransaction;
}

function read<T>(
  shape: z.ZodType<T>,
  rawTransactions: unknown[],
  identify: (rawTransactions: T[]) => { identity: string; data: T }[],
  extract: (data: T) => Extracted,
) {
  const parsed = shape.array().safeParse(rawTransactions);
  return parsed.success
    ? identify(parsed.data).map((row) => ({ ...row, ...extract(row.data) }))
    : undefined;
}

const germanDecimal = (text: string) =>
  text.replaceAll(".", "").replace(",", ".");

const germanDate = (text: string) =>
  text
    .split(".")
    .reverse()
    .map((part) => part.padStart(2, "0"))
    .join("-");

const negated = (value: string) =>
  value.startsWith("-") ? value.slice(1) : `-${value}`;

function ofType(
  type: DepotTransaction["type"],
  shares: string,
  money: { amount: string; currency: string } | undefined,
): Pick<DepotTransaction, "type" | "quantity" | "amount" | "currency"> {
  const paid = type === "trade" || type === "distribution" ? money : undefined;
  return {
    type,
    quantity: type === "distribution" ? null : shares,
    amount: paid ? cents(paid.amount) : null,
    currency: paid?.currency ?? null,
  };
}

function fromGermanBooking(booking: {
  date: string;
  amount: string;
  currency: string;
  counterparty: string;
  description: string;
}): Extracted {
  return {
    cash: {
      date: germanDate(booking.date),
      amount: cents(germanDecimal(booking.amount)),
      currency: booking.currency,
      counterparty: booking.counterparty || null,
      description: booking.description || null,
    },
  };
}

const deutscheBankDepotTypes: Record<
  DeutscheBankDepotRawTransactionV1["subType"],
  DepotTransaction["type"]
> = {
  DIVIDEND_DISBURSEMENT: "distribution",
  RECEIPT: "trade",
};

function fromDeutscheBankDepot(
  data: DeutscheBankDepotRawTransactionV1,
): Extracted {
  const type = deutscheBankDepotTypes[data.subType];
  const total = data.calculatedAmounts.totalAmountEuroCurrency;
  return {
    depot: {
      date: data.bookDate,
      isin: data.security.isin,
      securityName: data.security.name,
      ...ofType(
        type,
        data.quantity,
        total && type === "trade"
          ? { ...total, amount: negated(total.amount) }
          : total,
      ),
      description: data.subType,
    },
  };
}

function fromTradeRepublic(
  data: TradeRepublicRawTransactionV1,
  type: Account["type"],
): Extracted {
  const amount = decimalSum([data.amount, data.fee, data.tax]);
  // Trade Republic's date column holds the UTC date, a day early for a transaction just after midnight in Berlin.
  const date = Temporal.Instant.from(data.datetime)
    .toZonedDateTimeISO("Europe/Berlin")
    .toPlainDate()
    .toString();
  const description = data.description || null;
  if (type === "cash")
    return {
      cash: {
        date,
        amount: cents(amount),
        currency: data.currency,
        counterparty: data.counterparty_name || null,
        description,
      },
    };
  const trade = data.type === "BUY" || data.type === "SELL";
  return {
    depot: {
      date,
      isin: data.symbol,
      securityName: data.name,
      ...ofType(trade ? "trade" : "distribution", data.shares, {
        amount: trade ? negated(amount) : amount,
        currency: data.currency,
      }),
      description,
    },
  };
}

const notice = undefined;

const finvestoTypes: Record<
  FinvestoRawTransactionV1[4],
  DepotTransaction["type"] | typeof notice
> = {
  Kauf: "trade",
  "Wiederanlage Fondsertrag": "reinvestment",
  "Fondsertrag (Ausschüttung)": "distribution",
  "Verkauf wegen Vorabpauschale": "tax",
  Vorabpauschale: notice,
  "Entgeltbelastung Verkauf": "fee",
  Entgeltermittlung: notice,
};

function fromFinvesto(row: FinvestoRawTransactionV1): Extracted {
  const [kind, part, payment, currency] = [
    row[4],
    row[5],
    germanDecimal(row[8]),
    row[9],
  ];
  const type = finvestoTypes[kind];
  // finvesto pays a distribution in its fund's currency and quotes column 30 as that currency per euro.
  const paidInEuro =
    currency === "EUR"
      ? { amount: payment, currency }
      : {
          amount: centsQuotient(payment, germanDecimal(row[30])),
          currency: "EUR",
        };
  return type
    ? {
        depot: {
          date: `20${germanDate(row[3])}`,
          isin: row[7],
          securityName: row[6],
          ...ofType(type, germanDecimal(row[10]), paidInEuro),
          description: part ? `${kind} · ${part}` : kind,
        },
      }
    : {};
}
