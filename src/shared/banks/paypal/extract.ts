import type { BankExtraction } from "../../bank.ts";
import { germanBooking } from "../../german.ts";
import { extraction } from "../../raw-transactions.ts";
import bank from "./bank.ts";
import { cashV1 } from "./shapes.ts";

export default {
  ...bank,
  extractions: {
    cash: {
      1: extraction(cashV1, (data) => ({
        identity: data.Transaktionscode,
        cash: germanBooking({
          date: data.Datum,
          amount: data.Netto,
          currency: data["Währung"],
          counterparty: data.Name,
          description: [
            ...new Set(
              [data.Artikelbezeichnung, data.Betreff, data.Hinweis].filter(
                Boolean,
              ),
            ),
          ].join(" · "),
        }),
      })),
    },
  },
} satisfies BankExtraction;
