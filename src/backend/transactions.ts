import type { Pool } from "pg";
import type { Transaction } from "@finance-tracker/shared/contract";
import { logoRoute } from "./logos.ts";

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
        case when brand.name is not null then json_build_object(
          'name', brand.name,
          'logo', $1::text || brand.logo_id
        ) end as brand
      from transactions
      left join cash_transactions cash on cash.transaction_id = transactions.id
      left join depot_transactions depot on depot.transaction_id = transactions.id
      left join securities on securities.isin = depot.isin
      left join logos security_logo on security_logo.isin = depot.isin and security_logo.image is not null
      left join lateral (
        select brands.name, logos.id as logo_id
        from brands
        left join logos on logos.domain = brands.domain and logos.image is not null
        where cash.counterparty ~* brands.pattern
        order by brands.id
        limit 1
      ) brand on true
      where cash.transaction_id is not null or depot.transaction_id is not null
      order by coalesce(cash.date, depot.date) desc, transactions.id desc`,
      [logoRoute],
    )
  ).rows;
