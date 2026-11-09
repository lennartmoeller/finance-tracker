import { oc } from "@orpc/contract";
import { z } from "zod";
import { bank } from "./bank.ts";
import { ingRawTransactionV1 } from "./ing.ts";
import { tradeRepublicRawTransactionV1 } from "./trade-republic.ts";

const account = z.object({
  id: z.int(),
  bank,
  type: z.enum(["giro", "savings", "cash"]),
  iban: z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, "Invalid IBAN"),
  lastSyncedAt: z.date().nullable(),
});

export type Account = z.infer<typeof account>;

export const newAccount = account.pick({ bank: true, type: true, iban: true });

const syncInput = z.discriminatedUnion("source", [
  z.object({
    accountId: z.int(),
    source: z.literal("ING"),
    shapeVersion: z.literal(1),
    rawTransactions: z.array(ingRawTransactionV1),
  }),
  z.object({
    accountId: z.int(),
    source: z.literal("Trade Republic"),
    shapeVersion: z.literal(1),
    rawTransactions: z.array(tradeRepublicRawTransactionV1),
  }),
]);

export type SyncInput = z.infer<typeof syncInput>;

export const contract = {
  account: {
    create: oc.input(newAccount).output(account),
    list: oc.output(z.array(account)),
  },
  sync: oc
    .input(syncInput)
    .output(z.object({ imported: z.int(), skipped: z.int() })),
};
