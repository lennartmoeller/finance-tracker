import { oc } from "@orpc/contract";
import { z } from "zod";
import { bank } from "./bank.ts";
import { deutscheBankRawTransactionV1 } from "./deutsche-bank.ts";
import { deutscheBankDepotRawTransactionV1 } from "./deutsche-bank-depot.ts";
import { finvestoRawTransactionV1 } from "./finvesto.ts";
import { ingRawTransactionV1 } from "./ing.ts";
import { tradeRepublicRawTransactionV1 } from "./trade-republic.ts";

const account = z.object({
  id: z.int(),
  bank,
  type: z.enum(["giro", "savings", "cash", "depot"]),
  number: z.string().regex(/^[A-Z0-9]+$/, "Invalid account number"),
  lastSyncedAt: z.date().nullable(),
});

export type Account = z.infer<typeof account>;

export const newAccount = account.pick({
  bank: true,
  type: true,
  number: true,
});

const sourceSync = <S extends string, T extends z.ZodType>(
  source: S,
  rawTransaction: T,
) =>
  z.object({
    accountId: z.int(),
    source: z.literal(source),
    shapeVersion: z.literal(1),
    rawTransactions: z.array(rawTransaction),
  });

const syncInput = z.discriminatedUnion("source", [
  sourceSync("ING", ingRawTransactionV1),
  sourceSync("Trade Republic", tradeRepublicRawTransactionV1),
  sourceSync("Deutsche Bank", deutscheBankRawTransactionV1),
  sourceSync("Deutsche Bank depot", deutscheBankDepotRawTransactionV1),
  sourceSync("finvesto", finvestoRawTransactionV1),
]);

export type SyncInput = z.infer<typeof syncInput>;

export const sourceBanks: Record<SyncInput["source"], Account["bank"]> = {
  ING: "ING",
  "Trade Republic": "Trade Republic",
  "Deutsche Bank": "Deutsche Bank",
  "Deutsche Bank depot": "Deutsche Bank",
  finvesto: "finvesto",
};

export const contract = {
  account: {
    create: oc.input(newAccount).output(account),
    list: oc.output(z.array(account)),
  },
  sync: oc
    .input(syncInput)
    .output(z.object({ imported: z.int(), skipped: z.int() })),
};
