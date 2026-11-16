import type { Pool } from "pg";
import type { Transaction } from "@finance-tracker/shared/contract";
import { transfers, type Pairable } from "@finance-tracker/shared/transfers";
import { listAccounts } from "./accounts.ts";
import { logoRoute } from "./logos.ts";
import { matchingRule } from "./rules.ts";

type Listed = Pairable &
  Omit<Transaction, "transferPartnerId" | "transferProof" | "probableTransfer">;

export async function listTransactions(db: Pool): Promise<Transaction[]> {
  const { rows } = await db.query<Listed>(
    `select
      transactions.id,
      transactions.account_id as "accountId",
      transactions.identity,
      correction.partner_id as "pinnedPartnerId",
      coalesce(correction.transaction_id is not null and correction.partner_id is null, false) as "noTransfer",
      case when cash.transaction_id is not null then json_build_object(
        'date', cash.date,
        'amount', cash.amount::text,
        'currency', cash.currency,
        'counterparty', cash.counterparty,
        'counterpartyIban', cash.counterparty_iban,
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
    left join transfer_corrections correction on correction.transaction_id = transactions.id
    left join securities on securities.isin = depot.isin
    left join logos security_logo on security_logo.isin = depot.isin and security_logo.image is not null
    left join lateral (${matchingRule("brand_id", "null")}) brand on true
    left join lateral (${matchingRule("category_id", "brand.id")}) category on true
    where cash.transaction_id is not null or depot.transaction_id is not null
    order by coalesce(cash.date, depot.date) desc, transactions.id desc`,
    [logoRoute],
  );
  const { paired, probable } = transfers(rows, await listAccounts(db));
  return rows.map((row) => {
    const pair = paired.get(row.id);
    return {
      id: row.id,
      accountId: row.accountId,
      cash: row.cash,
      depot: row.depot,
      transferPartnerId: pair?.partnerId ?? null,
      transferProof: pair?.proof ?? null,
      noTransfer: row.noTransfer,
      probableTransfer: probable.get(row.id) ?? null,
      brandId: pair ? null : row.brandId,
      categoryId: pair ? null : row.categoryId,
    };
  });
}
