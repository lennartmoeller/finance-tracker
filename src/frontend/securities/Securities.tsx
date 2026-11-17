import { useDeferredValue, useMemo, useState } from "react";
import { ChartLine, ChevronRight } from "lucide-react";
import type { DepotTransaction } from "@finance-tracker/shared/contract";
import type { Data, Loading } from "../App.tsx";
import {
  dailyValues,
  depotFigures,
  lastSale,
  priced,
  shares,
  since,
  today,
  withoutPrices,
  type DepotFigures,
} from "../figures.ts";
import { DepotSummary } from "../DepotSummary.tsx";
import { Donut, slicesOf, type Slice } from "../Donut.tsx";
import { ColouredGain } from "../Gain.tsx";
import { Intro } from "../Intro.tsx";
import { Loaded, SkeletonRows } from "../Loaded.tsx";
import { Logo } from "../Logo.tsx";
import { MoneyWithPercent } from "../MoneyWithPercent.tsx";
import { href } from "../route.ts";
import { depotSeries, ValueChart } from "../ValueChart.tsx";
import "./securities.css";

type Security = {
  isin: string;
  name: string;
  logo: string | null;
  transactions: DepotTransaction[];
  shares: string;
  figures: DepotFigures | null;
};

const isHeld = (security: Security) => Number(security.shares) > 0;

const marketValue = (security: Security) =>
  Number(priced(security.figures)?.marketValue ?? -1);

const skeleton = (
  <div className="scroll">
    <div className="figures">
      <span className="skeleton" />
      <span className="skeleton big" />
      <span className="skeleton chart-skeleton" />
    </div>
    <div className="donut-table">
      <div className="donut">
        <span className="skeleton" />
      </div>
      <div className="skeleton-rows">
        <SkeletonRows count={7} />
      </div>
    </div>
  </div>
);

export function Securities({
  loading,
  isin,
}: {
  loading: Loading;
  isin: string | null;
}) {
  return (
    <>
      <header className="page-head plain">
        <h1>Securities</h1>
      </header>
      <Loaded loading={loading} skeleton={skeleton}>
        {(data) => <Analysis data={data} selectedIsin={isin} />}
      </Loaded>
    </>
  );
}

function securitiesOf({ transactions, prices }: Data) {
  const depotTransactions = transactions.flatMap(({ depot }) => depot ?? []);
  const securities = [
    ...new Map(
      depotTransactions.map((transaction) => [transaction.isin, transaction]),
    ).values(),
  ].map(({ isin, securityName, securityLogo }): Security => {
    const ofSecurity = depotTransactions.filter(
      (transaction) => transaction.isin === isin,
    );
    return {
      isin,
      name: securityName,
      logo: securityLogo,
      transactions: ofSecurity,
      shares: shares(ofSecurity),
      figures: depotFigures(ofSecurity, prices),
    };
  });
  const held = securities
    .filter(isHeld)
    .sort((a, b) => marketValue(b) - marketValue(a));
  const pricedTransactions = securities.flatMap((security) =>
    priced(security.figures) ? security.transactions : [],
  );
  return {
    listed: [
      ...held,
      ...securities
        .filter((security) => !isHeld(security))
        .sort((a, b) =>
          lastSale(b.transactions).localeCompare(lastSale(a.transactions)),
        ),
    ],
    pricedTransactions,
    figures: depotFigures(pricedTransactions, prices),
    unpriced: securities.flatMap(({ name, figures }) =>
      priced(figures) ? [] : [name],
    ),
    slices: slicesOf(
      held.flatMap(({ isin, figures }) => {
        const known = priced(figures);
        return known ? [{ key: isin, value: known.marketValue }] : [];
      }),
    ),
  };
}

const securityHref = (isin: string | null) =>
  href({ view: "securities", isin });

function Analysis({
  data,
  selectedIsin,
}: {
  data: Data;
  selectedIsin: string | null;
}) {
  const [hoveredIsins, setHoveredIsins] = useState<string[]>([]);
  const { listed, pricedTransactions, figures, unpriced, slices } = useMemo(
    () => securitiesOf(data),
    [data],
  );
  const selected = listed.find(({ isin }) => isin === selectedIsin);
  const charted = useDeferredValue(selected);
  const values = useMemo(
    () =>
      since(
        data.settings.transactionsStart,
        dailyValues(
          charted?.transactions ?? pricedTransactions,
          data.prices,
          today(),
        ),
      ),
    [charted, pricedTransactions, data.prices, data.settings],
  );
  if (!listed.length)
    return (
      <Intro
        icon={<ChartLine />}
        title="No securities yet"
        text="Sync a depot in the browser extension's popup."
      />
    );

  const shown = selected ? selected.figures : figures;
  const note = selected
    ? shown &&
      "unpriced" in shown &&
      `No price for ${shown.unpriced.join(", ")}.`
    : unpriced.length > 0 && withoutPrices(unpriced);
  const toggleHref = (isin: string) =>
    securityHref(isin === selectedIsin ? null : isin);

  return (
    <div className="scroll">
      <section className="figures">
        <nav className="crumbs" aria-label="Selection">
          <a
            href={securityHref(null)}
            aria-current={selected ? undefined : "page"}
          >
            All securities
          </a>
          {selected && (
            <>
              <ChevronRight />
              <span className="named" aria-current="page">
                <Logo src={selected.logo} name={selected.name} />
                <span>{selected.name}</span>
              </span>
            </>
          )}
        </nav>
        <DepotSummary figures={shown} shares={selected?.shares} />
        {note && <span className="note">{note}</span>}
        <ValueChart values={values} series={depotSeries} />
      </section>
      <div className="donut-table">
        {slices.length > 0 && (
          <aside className="donut" aria-label="Market value by security">
            <Donut
              slices={slices}
              selectedKey={selectedIsin}
              hrefOf={toggleHref}
              onHover={setHoveredIsins}
            />
          </aside>
        )}
        <SecurityTable
          securities={listed}
          totalMarketValue={Number(priced(figures)?.marketValue)}
          slices={slices}
          selectedIsin={selectedIsin}
          hoveredIsins={hoveredIsins}
          hrefOf={toggleHref}
        />
      </div>
    </div>
  );
}

function SecurityTable({
  securities,
  totalMarketValue,
  slices,
  selectedIsin,
  hoveredIsins,
  hrefOf,
}: {
  securities: Security[];
  totalMarketValue: number;
  slices: Slice[];
  selectedIsin: string | null;
  hoveredIsins: string[];
  hrefOf: (isin: string) => string;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Security</th>
          <th className="num">Market value</th>
          <th className="num">Gain</th>
        </tr>
      </thead>
      <tbody>
        {securities.map((security) => {
          const { isin, name, logo, figures } = security;
          const known = priced(figures);
          return (
            <tr
              key={isin}
              className={
                isin === selectedIsin
                  ? "selected"
                  : hoveredIsins.includes(isin)
                    ? "hovered"
                    : undefined
              }
            >
              <td>
                <a className="named stretched" href={hrefOf(isin)}>
                  <span
                    className="dot"
                    style={{
                      background: slices.find(({ keys }) => keys.includes(isin))
                        ?.fill,
                    }}
                  />
                  <Logo src={logo} name={name} />
                  <span>{name}</span>
                </a>
              </td>
              <td className="num">
                {known && isHeld(security) && (
                  <MoneyWithPercent
                    amount={known.marketValue}
                    percent={Number(known.marketValue) / totalMarketValue}
                  />
                )}
              </td>
              <td className="num">
                {known && (
                  <ColouredGain
                    amount={known.gain}
                    purchases={known.purchases}
                  />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
