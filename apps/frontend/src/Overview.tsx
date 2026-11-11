import type { Account } from "@finance-tracker/shared/contract";
import { decimalSum } from "@finance-tracker/shared/decimal";
import { balance, depotFigures, gain } from "./account-figures.ts";
import { AccountName } from "./AccountName.tsx";
import type { Data } from "./App.tsx";
import { formatAmount, formatMoney, formatPercent } from "./format.ts";
import { Loaded } from "./Loaded.tsx";
import { none } from "./none.tsx";
import type { Scope } from "./Transactions.tsx";

const total = (amounts: string[]) => decimalSum(["0", ...amounts]);

function Gain({
  marketValue,
  invested,
}: {
  marketValue: string;
  invested: string;
}) {
  const difference = gain(marketValue, invested);
  return Number(invested)
    ? `${formatAmount(difference, "EUR")} · ${formatPercent(Number(difference) / Number(invested))}`
    : formatAmount(difference, "EUR");
}

export function Overview({
  data,
  error,
  onOpen,
}: {
  data: Data | undefined;
  error: string;
  onOpen: (scope: Scope) => void;
}) {
  return (
    <>
      <header className="page-head plain">
        <h1>Overview</h1>
      </header>
      <Loaded data={data} error={error} skeleton={<Skeleton />}>
        {(loaded) => <Figures data={loaded} onOpen={onOpen} />}
      </Loaded>
    </>
  );
}

function Figures({
  data,
  onOpen,
}: {
  data: Data;
  onOpen: (scope: Scope) => void;
}) {
  const ofAccount = ({ id }: Account) =>
    data.transactions.filter(({ accountId }) => accountId === id);
  const cash = data.accounts
    .filter(({ type }) => type === "cash")
    .map((account) => ({ account, balance: balance(ofAccount(account)) }));
  const depots = data.accounts
    .filter(({ type }) => type === "depot")
    .map((account) => ({
      account,
      figures: depotFigures(ofAccount(account), data.prices),
    }));
  const priced = depots.flatMap(({ figures }) =>
    figures && "marketValue" in figures ? [figures] : [],
  );
  const unpriced = depots.flatMap(({ account, figures }) =>
    figures && "unpriced" in figures ? [account.name] : [],
  );
  const balances = total(cash.flatMap(({ balance }) => balance ?? []));
  const marketValue = total(priced.map(({ marketValue }) => marketValue));
  const invested = total(priced.map(({ invested }) => invested));
  const card = (account: Account, content: React.ReactNode) => (
    <button
      key={account.id}
      className="card"
      onClick={() => {
        onOpen({ type: account.type, accountId: account.id });
      }}
    >
      <AccountName account={account} />
      {content}
    </button>
  );

  return (
    <div className="overview">
      <section className="card hero">
        <span className="hero-label">Total</span>
        <span className="hero-amount">
          {formatMoney(decimalSum([balances, marketValue]))}
        </span>
        <div className="hero-parts">
          <div>
            <span>Cash accounts</span>
            <strong>{formatMoney(balances)}</strong>
          </div>
          <div>
            <span>Depots</span>
            <strong>{formatMoney(marketValue)}</strong>
          </div>
          <div>
            <span>Gain</span>
            <strong>
              {priced.length ? (
                <Gain marketValue={marketValue} invested={invested} />
              ) : (
                none
              )}
            </strong>
          </div>
        </div>
        {unpriced.length > 0 && (
          <span className="card-note">
            Without {unpriced.join(", ")}, whose prices are missing.
          </span>
        )}
      </section>
      {cash.length > 0 && (
        <>
          <h2>Cash accounts</h2>
          <div className="cards">
            {cash.map(({ account, balance }) =>
              card(
                account,
                <span className="card-amount">
                  {balance ? formatMoney(balance) : none}
                </span>,
              ),
            )}
          </div>
        </>
      )}
      {depots.length > 0 && (
        <>
          <h2>Depots</h2>
          <div className="cards">
            {depots.map(({ account, figures }) =>
              card(
                account,
                <>
                  <span className="card-amount">
                    {figures && "marketValue" in figures
                      ? formatMoney(figures.marketValue)
                      : none}
                  </span>
                  {figures && "unpriced" in figures && (
                    <span className="card-note">
                      No price for {figures.unpriced.join(", ")}
                    </span>
                  )}
                  <dl className="card-rows">
                    <div>
                      <dt>Invested money</dt>
                      <dd>{figures ? formatMoney(figures.invested) : none}</dd>
                    </div>
                    <div>
                      <dt>Gain</dt>
                      <dd>
                        {figures && "marketValue" in figures ? (
                          <Gain
                            marketValue={figures.marketValue}
                            invested={figures.invested}
                          />
                        ) : (
                          none
                        )}
                      </dd>
                    </div>
                  </dl>
                </>,
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Skeleton() {
  const card = (index: number) => (
    <div className="card" key={index}>
      <span className="skeleton" />
      <span className="skeleton big" />
    </div>
  );
  return (
    <div className="overview">
      {card(0)}
      <h2>Cash accounts</h2>
      <div className="cards">{[1, 2, 3, 4].map(card)}</div>
      <h2>Depots</h2>
      <div className="cards">{[5, 6, 7].map(card)}</div>
    </div>
  );
}
