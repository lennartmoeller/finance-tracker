CREATE TABLE "accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"bank" text NOT NULL,
	"type" text NOT NULL,
	"number" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "accounts_bank_number_unique" UNIQUE("bank","number"),
	CONSTRAINT "accounts_bank_name_unique" UNIQUE("bank","name"),
	CONSTRAINT "accounts_name_filled" CHECK ("accounts"."name" <> ''),
	CONSTRAINT "accounts_bank_known" CHECK ("accounts"."bank" in ('Deutsche Bank', 'finvesto', 'ING', 'Trade Republic')),
	CONSTRAINT "accounts_type_known" CHECK ("accounts"."type" in ('cash', 'depot')),
	CONSTRAINT "accounts_number_filled" CHECK ("accounts"."number" <> '')
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "brands_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"pattern" text NOT NULL,
	"domain" text NOT NULL,
	CONSTRAINT "brands_name_unique" UNIQUE("name"),
	CONSTRAINT "brands_domain_unique" UNIQUE("domain"),
	CONSTRAINT "brands_name_filled" CHECK ("brands"."name" <> ''),
	CONSTRAINT "brands_pattern_valid" CHECK (not ('' ~* "brands"."pattern")),
	CONSTRAINT "brands_domain_format" CHECK ("brands"."domain" ~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$')
);
--> statement-breakpoint
CREATE TABLE "cash_transactions" (
	"transaction_id" integer PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"amount" numeric NOT NULL,
	"currency" text NOT NULL,
	"counterparty" text,
	"description" text,
	CONSTRAINT "cash_transactions_amount_in_cents" CHECK (scale("cash_transactions"."amount") = 2),
	CONSTRAINT "cash_transactions_currency_format" CHECK ("cash_transactions"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "cash_transactions_counterparty_filled" CHECK ("cash_transactions"."counterparty" <> ''),
	CONSTRAINT "cash_transactions_description_filled" CHECK ("cash_transactions"."description" <> '')
);
--> statement-breakpoint
CREATE TABLE "depot_transactions" (
	"transaction_id" integer PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"isin" text NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric,
	"amount" numeric,
	"currency" text,
	"description" text,
	CONSTRAINT "depot_transactions_fields_of_type" CHECK ((("depot_transactions"."type" = 'trade' and "depot_transactions"."quantity" <> 0 and sign("depot_transactions"."amount") = sign("depot_transactions"."quantity")) or ("depot_transactions"."type" = 'reinvestment' and "depot_transactions"."quantity" > 0 and "depot_transactions"."amount" is null) or ("depot_transactions"."type" = 'fee' and "depot_transactions"."quantity" < 0 and "depot_transactions"."amount" is null) or ("depot_transactions"."type" = 'tax' and "depot_transactions"."quantity" < 0 and "depot_transactions"."amount" is null) or ("depot_transactions"."type" = 'distribution' and "depot_transactions"."quantity" is null and "depot_transactions"."amount" > 0)) is true),
	CONSTRAINT "depot_transactions_amount_in_cents" CHECK (scale("depot_transactions"."amount") = 2),
	CONSTRAINT "depot_transactions_currency_with_amount" CHECK (("depot_transactions"."amount" is null) = ("depot_transactions"."currency" is null)),
	CONSTRAINT "depot_transactions_currency_format" CHECK ("depot_transactions"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "depot_transactions_description_filled" CHECK ("depot_transactions"."description" <> '')
);
--> statement-breakpoint
CREATE TABLE "logos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "logos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"domain" text,
	"isin" text,
	"image" "bytea",
	"etag" text,
	CONSTRAINT "logos_domain_unique" UNIQUE("domain"),
	CONSTRAINT "logos_isin_unique" UNIQUE("isin"),
	CONSTRAINT "logos_one_identifier" CHECK (("logos"."domain" is null) <> ("logos"."isin" is null)),
	CONSTRAINT "logos_domain_format" CHECK ("logos"."domain" ~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$'),
	CONSTRAINT "logos_etag_with_image" CHECK (("logos"."image" is null) = ("logos"."etag" is null)),
	CONSTRAINT "logos_etag_filled" CHECK ("logos"."etag" <> '')
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"isin" text NOT NULL,
	"date" date NOT NULL,
	"price" numeric NOT NULL,
	CONSTRAINT "prices_isin_date_pk" PRIMARY KEY("isin","date"),
	CONSTRAINT "prices_price_positive" CHECK ("prices"."price" > 0),
	CONSTRAINT "prices_date_weekday" CHECK (extract(isodow from "prices"."date") < 6)
);
--> statement-breakpoint
CREATE TABLE "securities" (
	"isin" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"named_by" text NOT NULL,
	CONSTRAINT "securities_isin_format" CHECK ("securities"."isin" ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
	CONSTRAINT "securities_name_filled" CHECK ("securities"."name" <> ''),
	CONSTRAINT "securities_named_by_known" CHECK ("securities"."named_by" in ('Deutsche Bank', 'finvesto', 'ING', 'Trade Republic'))
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"account_id" integer NOT NULL,
	"shape_version" integer NOT NULL,
	"identity" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "transactions_accountId_identity_unique" UNIQUE("account_id","identity"),
	CONSTRAINT "transactions_identity_filled" CHECK ("transactions"."identity" <> '')
);
--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "depot_transactions" ADD CONSTRAINT "depot_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "depot_transactions" ADD CONSTRAINT "depot_transactions_isin_securities_isin_fk" FOREIGN KEY ("isin") REFERENCES "public"."securities"("isin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logos" ADD CONSTRAINT "logos_isin_securities_isin_fk" FOREIGN KEY ("isin") REFERENCES "public"."securities"("isin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_isin_securities_isin_fk" FOREIGN KEY ("isin") REFERENCES "public"."securities"("isin") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE FUNCTION "require_account_type"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	IF NOT EXISTS (
		SELECT FROM "transactions"
		JOIN "accounts" ON "accounts"."id" = "transactions"."account_id"
		WHERE "transactions"."id" = NEW."transaction_id" AND "accounts"."type" = TG_ARGV[0]
	) THEN
		RAISE EXCEPTION '% takes only the transactions of % accounts.', TG_TABLE_NAME, TG_ARGV[0] USING ERRCODE = 'check_violation';
	END IF;
	RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER "cash_transactions_account_type" BEFORE INSERT OR UPDATE OF "transaction_id" ON "cash_transactions" FOR EACH ROW EXECUTE FUNCTION "require_account_type"('cash');--> statement-breakpoint
CREATE TRIGGER "depot_transactions_account_type" BEFORE INSERT OR UPDATE OF "transaction_id" ON "depot_transactions" FOR EACH ROW EXECUTE FUNCTION "require_account_type"('depot');--> statement-breakpoint
CREATE FUNCTION "reject_change"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	RAISE EXCEPTION '%', TG_ARGV[0] USING ERRCODE = 'check_violation';
END $$;
--> statement-breakpoint
CREATE TRIGGER "transactions_unchanged" BEFORE UPDATE ON "transactions" FOR EACH ROW EXECUTE FUNCTION "reject_change"('A raw transaction never changes.');--> statement-breakpoint
CREATE TRIGGER "accounts_bank_and_type_unchanged" BEFORE UPDATE OF "bank", "type" ON "accounts" FOR EACH ROW WHEN (OLD."bank" <> NEW."bank" OR OLD."type" <> NEW."type") EXECUTE FUNCTION "reject_change"('An account keeps its bank and type.');
