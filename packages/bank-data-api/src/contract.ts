import { oc } from "@orpc/contract";
import { z } from "zod";
import { accountNumberFormats, accountNumberIssue } from "./account-number.ts";
import { bank } from "./bank.ts";
import { currency } from "./currency.ts";
import { decimal } from "./decimal.ts";
import { deutscheBankRawTransactionV1 } from "./deutsche-bank.ts";
import { deutscheBankDepotRawTransactionV1 } from "./deutsche-bank-depot.ts";
import { finvestoRawTransactionV1 } from "./finvesto.ts";
import { ingRawTransactionV1 } from "./ing.ts";
import { tradeRepublicRawTransactionV1 } from "./trade-republic.ts";

const account = z.object({
  id: z.int(),
  name: z
    .string()
    .trim()
    .min(1, "Name the account.")
    .max(40, "Use at most 40 characters."),
  bank,
  type: z.enum(["giro", "savings", "cash", "depot"]),
  number: z.string(),
  lastSyncedAt: z.date().nullable(),
});

export type Account = z.infer<typeof account>;

export const newAccount = account
  .pick({ name: true, bank: true, type: true, number: true })
  .superRefine(({ bank, type, number }, context) => {
    const format = accountNumberFormats[bank][type];
    const issue = format
      ? accountNumberIssue(bank, format, number)
      : `The extension syncs no ${type} account at ${bank}.`;
    if (issue)
      context.addIssue({
        code: "custom",
        path: [format ? "number" : "type"],
        message: issue,
      });
  });

const source = z.enum([
  "ING",
  "Trade Republic",
  "Deutsche Bank",
  "Deutsche Bank depot",
  "finvesto",
]);

const sourceSync = <S extends z.infer<typeof source>, T extends z.ZodType>(
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

export const sourceBanks: Record<z.infer<typeof source>, Account["bank"]> = {
  ING: "ING",
  "Trade Republic": "Trade Republic",
  "Deutsche Bank": "Deutsche Bank",
  "Deutsche Bank depot": "Deutsche Bank",
  finvesto: "finvesto",
};

const normalizedTransaction = z.object({
  date: z.iso.date(),
  amount: decimal.nullable(),
  currency: currency.nullable(),
  counterparty: z.string().nullable(),
  description: z.string().nullable(),
  isin: z.string().nullable(),
  securityName: z.string().nullable(),
  quantity: decimal.nullable(),
});

export type NormalizedTransaction = z.infer<typeof normalizedTransaction>;

const transaction = normalizedTransaction.extend({
  id: z.int(),
  accountId: z.int(),
  source,
  shapeVersion: z.int(),
  data: z.json(),
});

export type Transaction = z.infer<typeof transaction>;

export const contract = {
  account: {
    create: oc.input(newAccount).output(account),
    list: oc.output(z.array(account)),
    rename: oc.input(account.pick({ id: true, name: true })),
    remove: oc.input(account.pick({ id: true })),
  },
  sync: oc
    .input(syncInput)
    .output(z.object({ imported: z.int(), skipped: z.int() })),
  transaction: {
    list: oc.output(z.array(transaction)),
  },
};
