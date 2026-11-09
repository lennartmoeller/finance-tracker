CREATE TABLE "accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"bank" text NOT NULL,
	"type" text NOT NULL,
	"iban" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "accounts_iban_unique" UNIQUE("iban")
);
--> statement-breakpoint
CREATE TABLE "raw_transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "raw_transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"account_id" integer NOT NULL,
	"source" text NOT NULL,
	"shape_version" integer NOT NULL,
	"identity" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "raw_transactions_accountId_identity_unique" UNIQUE("account_id","identity")
);
--> statement-breakpoint
ALTER TABLE "raw_transactions" ADD CONSTRAINT "raw_transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;