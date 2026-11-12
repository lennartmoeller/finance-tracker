import type { BankExtraction } from "../../bank.ts";
import { cents, decimalSum, negated } from "../../decimal.ts";
import { depotFields } from "../../depot.ts";
import { extraction } from "../../raw-transactions.ts";
import bank from "./bank.ts";
import { rawTransactionV1, type RawTransactionV1 } from "./shapes.ts";

function booking(data: RawTransactionV1) {
  return {
    // The CSV's date column holds the UTC date, a day early for a transaction just after midnight in Berlin.
    date: Temporal.Instant.from(data.datetime)
      .toZonedDateTimeISO("Europe/Berlin")
      .toPlainDate()
      .toString(),
    amount: decimalSum([data.amount, data.fee, data.tax]),
    description: data.description || null,
  };
}

export default {
  ...bank,
  securityNameRank: 30,
  extractions: {
    cash: {
      1: extraction(rawTransactionV1, (data) => {
        const { date, amount, description } = booking(data);
        return {
          identity: data.transaction_id,
          cash: {
            date,
            amount: cents(amount),
            currency: data.currency,
            counterparty: data.counterparty_name || null,
            description,
          },
        };
      }),
    },
    depot: {
      1: extraction(rawTransactionV1, (data) => {
        const { date, amount, description } = booking(data);
        const trade = data.type === "BUY" || data.type === "SELL";
        return {
          identity: data.transaction_id,
          depot: {
            date,
            isin: data.symbol,
            securityName: data.name,
            ...depotFields(trade ? "trade" : "distribution", data.shares, {
              amount: trade ? negated(amount) : amount,
              currency: data.currency,
            }),
            description,
          },
        };
      }),
    },
  },
} satisfies BankExtraction;
