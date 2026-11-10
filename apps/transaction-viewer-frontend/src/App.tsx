import { useEffect, useState } from "react";
import { CircleExclamationPoint, Inbox, Wallet } from "lucide-react";
import {
  accountNumberFormats,
  groupAccountNumber,
} from "@finance-tracker/bank-data-api/account-number";
import { accountTypeNames } from "@finance-tracker/bank-data-api/account-type-names";
import { bank as banks } from "@finance-tracker/bank-data-api/bank";
import { bankLogos } from "@finance-tracker/bank-data-api/bank-logos";
import {
  createApiClient,
  errorMessage,
} from "@finance-tracker/bank-data-api/client";
import type {
  Account,
  Transaction,
} from "@finance-tracker/bank-data-api/contract";
import {
  freshness,
  lastSyncText,
} from "@finance-tracker/bank-data-api/last-sync";
import { formatDate, TransactionTable } from "./TransactionTable.tsx";

const api = createApiClient(`${location.origin}/rpc`);
const count = new Intl.NumberFormat("en");

export function App() {
  const [accounts, setAccounts] = useState<Account[]>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number>();

  useEffect(() => {
    Promise.all([api.account.list(), api.transaction.list()])
      .then(([accountList, transactionList]) => {
        setAccounts(accountList);
        setTransactions(transactionList);
      })
      .catch((failure: unknown) => {
        setError(errorMessage(failure));
      });
  }, []);

  const groups = banks.options.map((bank) => ({
    bank,
    accounts: (accounts ?? [])
      .filter((account) => account.bank === bank)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
  const selected =
    accounts?.find((account) => account.id === selectedId) ??
    groups.flatMap((group) => group.accounts)[0];
  const ofAccount = (account: Account) =>
    transactions.filter((transaction) => transaction.accountId === account.id);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <h1>Transaction viewer</h1>
          <p>Normalized and raw transactions of the bank data service</p>
        </div>
        <nav className="account-groups">
          {!accounts && !error
            ? Array.from({ length: 6 }, (_, index) => (
                <div className="skeleton-account" key={index}>
                  <span className="skeleton" />
                </div>
              ))
            : groups.map(
                ({ bank, accounts: group }) =>
                  group.length > 0 && (
                    <section className="group" key={bank}>
                      <h2 className="group-head">
                        <img
                          className="logo small"
                          src={bankLogos[bank]}
                          alt=""
                        />
                        {bank}
                      </h2>
                      <ul className="accounts">
                        {group.map((account) => (
                          <li key={account.id}>
                            <button
                              className="account"
                              aria-current={account === selected}
                              onClick={() => {
                                setSelectedId(account.id);
                              }}
                            >
                              <span>
                                <span className="account-name">
                                  {account.name}
                                </span>
                                <span className="account-type">
                                  {accountTypeNames[account.type]}
                                </span>
                              </span>
                              <span className="count">
                                {count.format(ofAccount(account).length)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ),
              )}
        </nav>
      </aside>
      <main className="main">
        {error ? (
          <div className="banner" role="alert">
            <CircleExclamationPoint />
            <span>{error}</span>
          </div>
        ) : !accounts ? (
          <>
            <div className="account-head">
              <span className="skeleton heading" />
            </div>
            {Array.from({ length: 8 }, (_, index) => (
              <div className="skeleton-row" key={index}>
                <span className="skeleton" />
                <span className="skeleton" />
                <span className="skeleton" />
                <span className="skeleton" />
              </div>
            ))}
          </>
        ) : !selected ? (
          <Intro
            icon={<Wallet />}
            title="No accounts yet"
            text="Add an account in the extension's popup and sync it."
          />
        ) : (
          <AccountView account={selected} transactions={ofAccount(selected)} />
        )}
      </main>
    </div>
  );
}

function AccountView({
  account,
  transactions,
}: {
  account: Account;
  transactions: Transaction[];
}) {
  const format = accountNumberFormats[account.bank][account.type];
  const dates = transactions.map((transaction) => transaction.date).sort();
  const [first, last] = [dates[0], dates.at(-1)];
  return (
    <>
      <div className="account-head">
        <img className="logo medium" src={bankLogos[account.bank]} alt="" />
        <div>
          <h2>{account.name}</h2>
          <div className="meta">
            {accountTypeNames[account.type]} ·{" "}
            <span className="mono">
              {format
                ? groupAccountNumber(account.number, format.groups)
                : account.number}
            </span>{" "}
            · {count.format(transactions.length)} transactions ·{" "}
            {first && last && (
              <>
                {formatDate(first)} – {formatDate(last)} ·{" "}
              </>
            )}
            <span className={`dot ${freshness(account.lastSyncedAt)}`} />
            {lastSyncText(account.lastSyncedAt)}
          </div>
        </div>
      </div>
      {transactions.length ? (
        <TransactionTable
          key={account.id}
          account={account}
          transactions={transactions}
        />
      ) : (
        <Intro
          icon={<Inbox />}
          title="No transactions yet"
          text="Sync this account in the extension's popup."
        />
      )}
    </>
  );
}

function Intro({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="intro">
      <div className="intro-icon">{icon}</div>
      <p className="intro-title">{title}</p>
      <p className="intro-text">{text}</p>
    </div>
  );
}
