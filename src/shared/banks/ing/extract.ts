import type { BankExtraction } from "../../bank.ts";
import { germanBooking } from "../../german.ts";
import { extraction } from "../../raw-transactions.ts";
import bank from "./bank.ts";
import { cashV1, cashV2 } from "./shapes.ts";

export default {
  ...bank,
  extractions: {
    // Each identity leaves out Saldo and its currency, because same-day bookings, and with them their running balances, may change order between exports.
    cash: {
      1: extraction(cashV1, (data) => ({
        identity: { hashOf: data.toSpliced(6, 2) },
        cash: germanBooking({
          date: data[0],
          amount: data[8],
          currency: data[9],
          counterparty: data[2],
          description: data[4],
        }),
      })),
      2: extraction(cashV2, (data) => ({
        identity: { hashOf: data.toSpliced(5, 2) },
        cash: germanBooking({
          date: data[0],
          amount: data[7],
          currency: data[8],
          counterparty: data[2],
          description: data[4],
        }),
      })),
    },
  },
} satisfies BankExtraction;
