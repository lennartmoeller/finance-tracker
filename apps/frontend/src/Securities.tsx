import { useDeferredValue, useMemo, useState } from "react";
import { ChartLine, ChevronRight } from "lucide-react";
import type { DepotTransaction } from "@finance-tracker/shared/contract";
import type { Data } from "./App.tsx";
import {
  dailyValues,
  depotFigures,
  shares,
  type DepotFigures,
} from "./figures.ts";
import { formatMoney, formatShares } from "./format.ts";
import { ColouredGain } from "./Gain.tsx";
import { Intro } from "./Intro.tsx";
import { Loaded } from "./Loaded.tsx";
import { Logo } from "./Logo.tsx";
import { MarketValueDonut, slicesOf } from "./MarketValueDonut.tsx";
import { none } from "./none.tsx";
import { ValueChart } from "./ValueChart.tsx";

type Security = {
  isin: string;
  name: string;
  logo: string | null;
  transactions: DepotTransaction[];
  shares: string;
  figures: DepotFigures | null;
};

const priced = (figures: DepotFigures | null) =>
  figures && "marketValue" in figures ? figures : null;

const lastSale = ({ transactions }: Security) =>
  transactions.find(
    ({ type, quantity }) => type === "trade" && Number(quantity) < 0,
  )?.date ?? "";

const isHeld = (security: Security) => Number(security.shares) > 0;

export function Securities({
  data,
  error,
}: {
  data: Data | undefined;
  error: string;
}) {
  return (
    <>
      <header className="page-head plain">
        <h1>Securities</h1>
      </header>
      <Loaded data={data} error={error} skeleton={<Skeleton />}>
        {(loaded) => <Analysis data={loaded} />}
      </Loaded>
    </>
  );
}

function securitiesOf({ transactions, prices }: Data) {
  const depotTransactions = transactions.flatMap(({ depot }) => depot ?? []);
  const securities: Security[] = [
    ...new Map(
      depotTransactions.map((transaction) => [transaction.isin, transaction]),
    ).values(),
  ].map(({ isin, securityName, securityLogo }) => {
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
  const listed = [
    ...securities
      .filter(isHeld)
      .sort(
        (a, b) =>
          Number(priced(b.figures)?.marketValue ?? -1) -
          Number(priced(a.figures)?.marketValue ?? -1),
      ),
    ...securities
      .filter((security) => !isHeld(security))
      .sort((a, b) => lastSale(b).localeCompare(lastSale(a))),
  ];
  const slices = slicesOf(
    listed.flatMap((security) => {
      const known = priced(security.figures);
      return isHeld(security) && known
        ? [{ ...security, marketValue: known.marketValue }]
        : [];
    }),
  );
  return {
    listed,
    pricedTransactions: securities.flatMap((security) =>
      priced(security.figures) ? security.transactions : [],
    ),
    unpriced: securities.filter(({ figures }) => !priced(figures)),
    slices,
    fills: new Map(
      slices.flatMap(({ isins, fill }) => isins.map((isin) => [isin, fill])),
    ),
  };
}

function Analysis({ data }: { data: Data }) {
  const [selectedIsin, setSelectedIsin] = useState<string | null>(null);
  const [hoveredIsins, setHoveredIsins] = useState<string[]>([]);
  const { listed, pricedTransactions, unpriced, slices, fills } = useMemo(
    () => securitiesOf(data),
    [data],
  );
  const selected = listed.find(({ isin }) => isin === selectedIsin);
  const figures = depotFigures(
    selected?.transactions ?? pricedTransactions,
    data.prices,
  );
  // The chart takes about 100 ms to redraw, so it follows a selection after the rest of the view instead of holding it up.
  const charted = useDeferredValue(selected);
  const values = useMemo(
    () => dailyValues(charted?.transactions ?? pricedTransactions, data.prices),
    [charted, pricedTransactions, data.prices],
  );
  if (!listed.length)
    return (
      <Intro
        icon={<ChartLine />}
        title="No securities yet"
        text="Sync a depot in the browser extension's popup."
      />
    );

  const select = (isin: string | null) => {
    setSelectedIsin(isin === selectedIsin ? null : isin);
  };

  return (
    <div className="scroll">
      <section className="figures">
        <nav className="crumbs" aria-label="Selection">
          <button
            aria-current={selected ? undefined : "page"}
            onClick={() => {
              select(null);
            }}
          >
            All securities
          </button>
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
        <Figures figures={figures} shares={selected?.shares} />
        {selected
          ? figures &&
            "unpriced" in figures && (
              <span className="note">
                No price for {figures.unpriced.join(", ")}.
              </span>
            )
          : unpriced.length > 0 && (
              <span className="note">
                Without {unpriced.map(({ name }) => name).join(", ")}, whose
                prices are missing.
              </span>
            )}
        <ValueChart values={values} />
      </section>
      <div className="holdings">
        {slices.length > 0 && (
          <aside className="donut" aria-label="Market value by security">
            <MarketValueDonut
              slices={slices}
              selectedIsin={selectedIsin}
              onSelect={select}
              onHover={setHoveredIsins}
            />
          </aside>
        )}
        <SecurityTable
          securities={listed}
          fills={fills}
          selectedIsin={selectedIsin}
          hoveredIsins={hoveredIsins}
          onSelect={select}
        />
      </div>
    </div>
  );
}

function Figures({
  figures,
  shares,
}: {
  figures: DepotFigures | null;
  shares: string | undefined;
}) {
  const known = priced(figures);
  const sold = shares !== undefined && Number(shares) <= 0;
  return (
    <div className="hero-row">
      <div className="hero-value">
        <span className="hero-amount">
          {known ? formatMoney(known.marketValue) : none}
        </span>
        {known && (
          <span className="hero-gain">
            <ColouredGain
              amount={known.gain}
              purchases={known.purchases}
              withArrow
            />
          </span>
        )}
      </div>
      <div className="hero-parts">
        {shares !== undefined && !sold && (
          <div>
            <span>Shares</span>
            <strong>{formatShares(shares)}</strong>
          </div>
        )}
        {!sold && (
          <div>
            <span>Invested money</span>
            <strong>{figures ? formatMoney(figures.invested) : none}</strong>
          </div>
        )}
        {(
          [
            ["Dist. paid out", known?.paidOut],
            ["Dist. reinvested", known?.reinvested],
          ] as const
        ).map(
          ([name, amount]) =>
            amount &&
            Math.round(Number(amount) * 100) !== 0 && (
              <div key={name}>
                <span>{name}</span>
                <strong>{formatMoney(amount)}</strong>
              </div>
            ),
        )}
      </div>
    </div>
  );
}

function SecurityTable({
  securities,
  fills,
  selectedIsin,
  hoveredIsins,
  onSelect,
}: {
  securities: Security[];
  fills: Map<string, string>;
  selectedIsin: string | null;
  hoveredIsins: string[];
  onSelect: (isin: string) => void;
}) {
  return (
    <table>
      <colgroup>
        <col />
        <col style={{ width: "180px" }} />
      </colgroup>
      <thead>
        <tr>
          <th>Security</th>
          <th className="num">Gain</th>
        </tr>
      </thead>
      <tbody>
        {securities.map((security) => {
          const known = priced(security.figures);
          return (
            <tr
              key={security.isin}
              className={
                security.isin === selectedIsin
                  ? "selected"
                  : hoveredIsins.includes(security.isin)
                    ? "hovered"
                    : undefined
              }
              onClick={() => {
                onSelect(security.isin);
              }}
            >
              <td>
                <span className="named">
                  <span
                    className="dot"
                    style={{ background: fills.get(security.isin) }}
                  />
                  <Logo src={security.logo} name={security.name} />
                  <span>{security.name}</span>
                </span>
              </td>
              <td className="num">
                {known ? (
                  <ColouredGain
                    amount={known.gain}
                    purchases={known.purchases}
                  />
                ) : (
                  none
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Skeleton() {
  return (
    <div className="scroll">
      <div className="figures">
        <span className="skeleton" />
        <span className="skeleton big" />
        <span className="skeleton chart-skeleton" />
      </div>
      <div className="holdings">
        <div className="donut">
          <span className="skeleton" />
        </div>
        <div className="skeleton-rows">
          {Array.from({ length: 7 }, (_, index) => (
            <div className="skeleton-row" key={index}>
              {Array.from({ length: 5 }, (_, cell) => (
                <span className="skeleton" key={cell} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
