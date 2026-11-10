ALTER TABLE "accounts" ADD COLUMN "name" text;--> statement-breakpoint
UPDATE "accounts" SET "name" = CASE "type" WHEN 'giro' THEN 'Giro account' WHEN 'savings' THEN 'Savings account' WHEN 'cash' THEN 'Cash account' ELSE 'Depot' END;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_bank_name_unique" UNIQUE("bank","name");