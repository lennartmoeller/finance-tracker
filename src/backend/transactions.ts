import type { Pool } from "pg";
import type { Transaction } from "@finance-tracker/shared/contract";
import { logoRoute } from "./logos.ts";
import { matchingRule } from "./rules.ts";

export const listTransactions = async (db: Pool) =>
  (
    await db.query<Transaction>(
      `select
        transactions.id,
        transactions.account_id as "accountId",
        case when cash.transaction_id is not null then json_build_object(
          'date', cash.date,
          'amount', cash.amount::text,
          'currency', cash.currency,
          'counterparty', cash.counterparty,
          'description', cash.description
        ) end as cash,
        case when depot.transaction_id is not null then json_build_object(
          'date', depot.date,
          'isin', depot.isin,
          'securityName', securities.name,
          'securityLogo', $1::text || security_logo.id,
          'type', depot.type,
          'quantity', depot.quantity::text,
          'amount', depot.amount::text,
          'currency', depot.currency,
          'description', depot.description
        ) end as depot,
        brand.id as "brandId",
        category.id as "categoryId"
      from transactions
      left join cash_transactions cash on cash.transaction_id = transactions.id
      left join depot_transactions depot on depot.transaction_id = transactions.id
      left join securities on securities.isin = depot.isin
      left join logos security_logo on security_logo.isin = depot.isin and security_logo.image is not null
      left join lateral (${matchingRule("brand_id", "null")}) brand on true
      left join lateral (${matchingRule("category_id", "brand.id")}) category on true
      where cash.transaction_id is not null or depot.transaction_id is not null
      order by coalesce(cash.date, depot.date) desc, transactions.id desc`,
      [logoRoute],
    )
  ).rows;
