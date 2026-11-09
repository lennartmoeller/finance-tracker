import { oc } from "@orpc/contract";
import { z } from "zod";
import { bank } from "@finance-tracker/banks/bank";
import { ingRawTransactionV1 } from "@finance-tracker/banks/ing";

const account = z.object({
  id: z.int(),
  bank,
  type: z.enum(["giro", "savings"]),
  iban: z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, "Invalid IBAN"),
  lastSyncedAt: z.date().nullable(),
});

export type Account = z.infer<typeof account>;

export const newAccount = account.pick({ bank: true, type: true, iban: true });

export const contract = {
  account: {
    create: oc.input(newAccount).output(account),
    list: oc.output(z.array(account)),
  },
  sync: oc
    .input(
      z.object({
        accountId: z.int(),
        shapeVersion: z.literal(1),
        rawTransactions: z.array(ingRawTransactionV1),
      }),
    )
    .output(z.object({ imported: z.int(), skipped: z.int() })),
};
