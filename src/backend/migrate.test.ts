import { expect, test } from "vitest";
import { refusedLines } from "./migrate.ts";

test("a plan that drops a column, retypes one or drops a trigger is refused line by line", () => {
  expect(
    refusedLines(`ALTER TABLE accounts DROP COLUMN number;

ALTER TABLE accounts ADD COLUMN account_number text NOT NULL;

ALTER TABLE accounts ALTER COLUMN name TYPE varchar(40) USING name::varchar(40);

DROP TRIGGER IF EXISTS transactions_unchanged ON transactions;
`),
  ).toEqual([
    "ALTER TABLE accounts DROP COLUMN number;",
    "ALTER TABLE accounts ALTER COLUMN name TYPE varchar(40) USING name::varchar(40);",
    "DROP TRIGGER IF EXISTS transactions_unchanged ON transactions;",
  ]);
});

test("a changed check and a new trigger pass", () => {
  expect(
    refusedLines(`ALTER TABLE accounts DROP CONSTRAINT accounts_bank_known;

ALTER TABLE accounts
ADD CONSTRAINT accounts_bank_known CHECK (bank IN ('Deutsche Bank'::text, 'finvesto'::text, 'ING'::text, 'Trade Republic'::text, 'Comdirect'::text)) NOT VALID;

ALTER TABLE accounts VALIDATE CONSTRAINT accounts_bank_known;

CREATE OR REPLACE TRIGGER securities_isin_unchanged
    BEFORE UPDATE OF isin ON securities
    FOR EACH ROW
    WHEN (((OLD.isin <> NEW.isin)))
    EXECUTE FUNCTION reject_change('A security keeps its ISIN.');
`),
  ).toEqual([]);
});
