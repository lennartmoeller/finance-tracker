ALTER TABLE "accounts" RENAME COLUMN "iban" TO "number";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_iban_unique";--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_bank_number_unique" UNIQUE("bank","number");