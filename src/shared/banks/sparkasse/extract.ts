import type { BankExtraction } from "../../bank.ts";
import { germanBooking } from "../../german.ts";
import { extraction } from "../../raw-transactions.ts";
import bank from "./bank.ts";
import { cashV1 } from "./shapes.ts";

export default {
  ...bank,
  extractions: {
    cash: {
      1: extraction(cashV1, (row) => ({
        identity: { hashOf: row },
        cash: germanBooking({
          date: row[1].replace(/\d{2}$/, "20$&"),
          amount: row[14],
          currency: row[15],
          // The export pads the name with spaces to 70 characters and may append an address or country after them.
          counterparty: row[11].replace(/ {2}.*/, "").trim(),
          description: row[4].trim(),
        }),
      })),
    },
  },
} satisfies BankExtraction;
