CREATE TABLE "accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"bank" text NOT NULL,
	"type" text NOT NULL,
	"number" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "accounts_bank_number_unique" UNIQUE("bank","number"),
	CONSTRAINT "accounts_bank_name_unique" UNIQUE("bank","name")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"account_id" integer NOT NULL,
	"source" text NOT NULL,
	"shape_version" integer NOT NULL,
	"identity" text NOT NULL,
	"data" jsonb NOT NULL,
	"date" date NOT NULL,
	"amount" numeric,
	"currency" text,
	"counterparty" text,
	"description" text,
	"isin" text,
	"security_name" text,
	"quantity" numeric,
	CONSTRAINT "transactions_accountId_identity_unique" UNIQUE("account_id","identity")
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;