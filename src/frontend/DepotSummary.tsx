import type { ReactNode } from "react";
import { priced, type DepotFigures } from "./figures.ts";
import { formatMoney, formatShares } from "./format.ts";
import { ColouredGain } from "./Gain.tsx";
import { none } from "./none.tsx";

function Part({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div>
      <span>{name}</span>
      <strong>{children}</strong>
    </div>
  );
}

export function DepotSummary({
  figures,
  shares,
}: {
  figures: DepotFigures | null;
  shares: string | undefined;
}) {
  const known = priced(figures);
  const held = shares === undefined || Number(shares) > 0;
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
        {held && shares !== undefined && (
          <Part name="Shares">{formatShares(shares)}</Part>
        )}
        {held && (
          <Part name="Invested money">
            {figures ? formatMoney(figures.invested) : none}
          </Part>
        )}
        {known &&
          (
            [
              ["Dist. paid out", known.paidOut],
              ["Dist. reinvested", known.reinvested],
            ] as const
          ).map(
            ([name, amount]) =>
              Math.round(Number(amount) * 100) !== 0 && (
                <Part key={name} name={name}>
                  {formatMoney(amount)}
                </Part>
              ),
          )}
      </div>
    </div>
  );
}
