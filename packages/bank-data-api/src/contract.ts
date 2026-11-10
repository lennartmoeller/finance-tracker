import { oc } from "@orpc/contract";
import { z } from "zod";
import { accountNumberFormats, accountNumberIssue } from "./account-number.ts";
import { bank } from "./bank.ts";
import { currency } from "./currency.ts";
import { decimal } from "./decimal.ts";

const account = z.object({
  id: z.int(),
  name: z
    .string()
    .trim()
    .min(1, "Name the account.")
    .max(40, "Use at most 40 characters."),
  bank,
  type: z.enum(["cash", "depot"]),
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
    .input(
      z.object({
        accountId: z.int(),
        shapeVersion: z.literal(1),
        rawTransactions: z.array(z.json()),
      }),
    )
    .output(z.object({ imported: z.int(), skipped: z.int() })),
  transaction: {
    list: oc.output(z.array(transaction)),
  },
};
