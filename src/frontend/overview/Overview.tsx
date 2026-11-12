import type { ReactNode } from "react";
import type { Account } from "@finance-tracker/shared/contract";
import { decimalSum } from "@finance-tracker/shared/decimal";
import { AccountName } from "../AccountName.tsx";
import type { Data, Loading, Scope } from "../App.tsx";
import { balance, depotFigures, priced, withoutPrices } from "../figures.ts";
import { formatMoney } from "../format.ts";
import { Gain } from "../Gain.tsx";
import { Loaded } from "../Loaded.tsx";
import { none } from "../none.tsx";
import "./overview.css";

type OnOpen = (scope: Scope) => void;

export function Overview({
  loading,
  onOpen,
}: {
  loading: Loading;
  onOpen: OnOpen;
}) {
  return (
    <>
      <header className="page-head plain">
        <h1>Overview</h1>
      </header>
      <Loaded loading={loading} skeleton={<Skeleton />}>
        {(data) => <Figures data={data} onOpen={onOpen} />}
      </Loaded>
    </>
  );
}

function Figures({ data, onOpen }: { data: Data; onOpen: OnOpen }) {
  const accountsOf = (type: Account["type"]) =>
    data.accounts.filter((account) => account.type === type);
  const transactionsOf = ({ id }: Account) =>
    data.transactions.filter(({ accountId }) => accountId === id);
  const cash = accountsOf("cash").map((account) => ({
    account,
    balance: balance(account.startBalance, transactionsOf(account)),
  }));
  const depots = accountsOf("depot").map((account) => {
    const figures = depotFigures(
      transactionsOf(account).flatMap(({ depot }) => depot ?? []),
      data.prices,
    );
    return {
      account,
      figures,
      priced: priced(figures),
      unpriced: figures && "unpriced" in figures ? figures.unpriced : [],
    };
  });
  const pricedDepots = depots.flatMap(({ priced }) => priced ?? []);
  const unpricedDepots = depots.flatMap(({ account, unpriced }) =>
    unpriced.length ? [account.name] : [],
  );
  const balances = decimalSum(cash.flatMap(({ balance }) => balance ?? []));
  const marketValue = decimalSum(
    pricedDepots.map(({ marketValue }) => marketValue),
  );
  const card = (account: Account, content: ReactNode) => (
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
    <div className="scroll overview">
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
              {pricedDepots.length ? (
                <Gain
                  amount={decimalSum(pricedDepots.map(({ gain }) => gain))}
                  purchases={decimalSum(
                    pricedDepots.map(({ purchases }) => purchases),
                  )}
                />
              ) : (
                none
              )}
            </strong>
          </div>
        </div>
        {unpricedDepots.length > 0 && (
          <span className="note">{withoutPrices(unpricedDepots)}</span>
        )}
      </section>
      <Cards title="Cash accounts">
        {cash.map(({ account, balance }) =>
          card(
            account,
            <span className="card-amount">
              {balance ? formatMoney(balance) : none}
            </span>,
          ),
        )}
      </Cards>
      <Cards title="Depots">
        {depots.map(({ account, figures, priced, unpriced }) =>
          card(
            account,
            <>
              <span className="card-amount">
                {priced ? formatMoney(priced.marketValue) : none}
              </span>
              {unpriced.length > 0 && (
                <span className="note">No price for {unpriced.join(", ")}</span>
              )}
              <dl className="card-rows">
                <div>
                  <dt>Invested money</dt>
                  <dd>{figures ? formatMoney(figures.invested) : none}</dd>
                </div>
                <div>
                  <dt>Gain</dt>
                  <dd>
                    {priced ? (
                      <Gain amount={priced.gain} purchases={priced.purchases} />
                    ) : (
                      none
                    )}
                  </dd>
                </div>
              </dl>
            </>,
          ),
        )}
      </Cards>
    </div>
  );
}

const Cards = ({ title, children }: { title: string; children: ReactNode[] }) =>
  children.length > 0 && (
    <>
      <h2>{title}</h2>
      <div className="cards">{children}</div>
    </>
  );

function Skeleton() {
  const cards = (count: number) =>
    Array.from({ length: count }, (_, index) => (
      <div className="card" key={index}>
        <span className="skeleton" />
        <span className="skeleton big" />
      </div>
    ));
  return (
    <div className="scroll overview">
      {cards(1)}
      <Cards title="Cash accounts">{cards(4)}</Cards>
      <Cards title="Depots">{cards(3)}</Cards>
    </div>
  );
}
