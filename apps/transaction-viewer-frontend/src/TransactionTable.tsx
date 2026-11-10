import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import type {
  Account,
  Transaction,
} from "@finance-tracker/bank-data-api/contract";
import { RawTransaction } from "./RawTransaction.tsx";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const amountFormat = new Intl.NumberFormat("en", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});
const quantityFormat = new Intl.NumberFormat("en", {
  maximumFractionDigits: 10,
  signDisplay: "exceptZero",
});

export const formatDate = (date: string) =>
  dateFormat.format(new Date(`${date}T00:00`));

const none = <span className="empty-field">—</span>;

export function TransactionTable({
  account,
  transactions,
}: {
  account: Account;
  transactions: Transaction[];
}) {
  const depot = account.type === "depot";
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const toggle = (id: number) => {
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th />
            <th>Date</th>
            <th>{depot ? "Security" : "Counterparty"}</th>
            <th>Description</th>
            {depot && <th className="num">Quantity</th>}
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <Fragment key={transaction.id}>
              <tr
                className={open.has(transaction.id) ? "tx open" : "tx"}
                aria-expanded={open.has(transaction.id)}
                onClick={() => {
                  toggle(transaction.id);
                }}
              >
                <td>
                  <ChevronRight className="chevron" />
                </td>
                <td className="date">{formatDate(transaction.date)}</td>
                <td>
                  {depot ? (
                    transaction.securityName ? (
                      <>
                        {transaction.securityName}
                        <span className="isin">{transaction.isin}</span>
                      </>
                    ) : (
                      none
                    )
                  ) : (
                    (transaction.counterparty ?? none)
                  )}
                </td>
                <td className="description">
                  {transaction.description ?? none}
                </td>
                {depot && (
                  <td className="num">
                    {transaction.quantity === null
                      ? none
                      : quantityFormat.format(Number(transaction.quantity))}
                  </td>
                )}
                <td className="num">
                  {transaction.amount === null ? (
                    none
                  ) : (
                    <>
                      {amountFormat.format(Number(transaction.amount))}
                      <span className="currency">{transaction.currency}</span>
                    </>
                  )}
                </td>
              </tr>
              {open.has(transaction.id) && (
                <tr className="raw">
                  <td colSpan={depot ? 6 : 5}>
                    <RawTransaction
                      account={account}
                      transaction={transaction}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
