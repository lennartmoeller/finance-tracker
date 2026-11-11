import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Account, Transaction } from "@finance-tracker/shared/contract";
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
  const ofDepot = account.type === "depot";
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
            {!ofDepot && <th>Brand</th>}
            <th>{ofDepot ? "Security" : "Counterparty"}</th>
            {ofDepot && <th>Type</th>}
            <th>Description</th>
            {ofDepot && <th className="num">Quantity</th>}
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const { cash, depot } = transaction;
            const normalized = cash ?? depot;
            return (
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
                  <td className="date">
                    {normalized ? formatDate(normalized.date) : none}
                  </td>
                  {!ofDepot && <td>{transaction.brand?.name ?? none}</td>}
                  <td>
                    {depot ? (
                      <>
                        {depot.securityName}
                        <span className="isin">{depot.isin}</span>
                      </>
                    ) : (
                      (cash?.counterparty ?? none)
                    )}
                  </td>
                  {ofDepot && (
                    <td>
                      {depot ? (
                        <span className="chip">{depot.type}</span>
                      ) : (
                        none
                      )}
                    </td>
                  )}
                  <td className="description">
                    {normalized ? (
                      (normalized.description ?? none)
                    ) : (
                      <span className="empty-field">Not extracted</span>
                    )}
                  </td>
                  {ofDepot && (
                    <td className="num">
                      {depot?.quantity
                        ? quantityFormat.format(Number(depot.quantity))
                        : none}
                    </td>
                  )}
                  <td className="num">
                    {normalized?.amount ? (
                      <>
                        {amountFormat.format(Number(normalized.amount))}
                        <span className="currency">{normalized.currency}</span>
                      </>
                    ) : (
                      none
                    )}
                  </td>
                </tr>
                {open.has(transaction.id) && (
                  <tr className="raw">
                    <td colSpan={ofDepot ? 7 : 6}>
                      <RawTransaction
                        account={account}
                        transaction={transaction}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
