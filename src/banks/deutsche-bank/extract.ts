import type { BankExtraction } from "@finance-tracker/shared/bank";
import { negated } from "@finance-tracker/shared/decimal";
import { depotFields } from "@finance-tracker/shared/depot";
import { germanBooking } from "@finance-tracker/shared/german";
import { extraction } from "@finance-tracker/shared/raw-transactions";
import bank from "./bank.ts";
import { cashV1, depotV1 } from "./shapes.ts";

export default {
  ...bank,
  securityNameRank: 20,
  extractions: {
    cash: {
      1: extraction(cashV1, (row) => ({
        identity: { hashOf: row },
        cash: germanBooking({
          date: row[0],
          amount: row[11],
          currency: row[17],
          counterparty: row[3],
          description: row[4],
        }),
      })),
    },
    depot: {
      1: extraction(depotV1, (data) => {
        const trade = data.subType === "RECEIPT";
        const total = data.calculatedAmounts.totalAmountEuroCurrency;
        return {
          identity: { hashOf: data },
          depot: {
            date: data.bookDate,
            isin: data.security.isin,
            securityName: data.security.name,
            ...depotFields(
              trade ? "trade" : "distribution",
              data.quantity,
              total && trade
                ? { ...total, amount: negated(total.amount) }
                : total,
            ),
            description: data.subType,
          },
        };
      }),
    },
  },
} satisfies BankExtraction;
