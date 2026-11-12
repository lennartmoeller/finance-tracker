import type { BankExtraction } from "@finance-tracker/shared/bank";
import { germanBooking } from "../german.ts";
import { extraction } from "../raw-transactions.ts";
import bank from "./bank.ts";
import { cashV1 } from "./shapes.ts";

export default {
  ...bank,
  extractions: {
    cash: {
      1: extraction(cashV1, (data) => ({
        // Saldo and its currency are left out, because same-day bookings, and with them their running balances, may change order between exports.
        identity: { hashOf: data.toSpliced(6, 2) },
        cash: germanBooking({
          date: data[0],
          amount: data[8],
          currency: data[9],
          counterparty: data[2],
          description: data[4],
        }),
      })),
    },
  },
} satisfies BankExtraction;
