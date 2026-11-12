import { memo, type ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  DefaultZIndexes,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayValues } from "../figures.ts";
import {
  formatAmount,
  formatDate,
  formatMoney,
  formatShortMonth,
  formatWholeMoney,
} from "../format.ts";
import { none } from "../none.tsx";

const marketValueColour = "var(--category-1)";
const investedColour = "var(--faint)";
const maxTicks = 8;
const tick = { fill: "var(--muted)", fontSize: 11 };
const activeDot = (fill: string) => ({
  r: 4,
  fill,
  stroke: "var(--raised)",
  strokeWidth: 2,
});

function monthTicks(values: DayValues[]) {
  const starts = values
    .map(({ date }) => date)
    .filter((date) => date.endsWith("-01"));
  const step = Math.ceil(starts.length / maxTicks);
  return starts.filter((_, index) => index % step === 0);
}

function Readout({ day }: { day: DayValues }) {
  const rows: [string, string | undefined, ReactNode][] = [
    [
      "Market value",
      marketValueColour,
      day.marketValue === null ? none : formatMoney(String(day.marketValue)),
    ],
    ["Invested money", investedColour, formatMoney(String(day.invested))],
    [
      "Gain",
      undefined,
      day.gain === null ? none : formatAmount(String(day.gain), "EUR"),
    ],
  ];
  return (
    <div className="readout">
      <div className="readout-title">{formatDate(day.date)}</div>
      {rows.map(([name, colour, value]) => (
        <div className="readout-row" key={name}>
          <span className="key">
            <span style={{ background: colour }} />
            {name}
          </span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export const ValueChart = memo(function ValueChart({
  values,
}: {
  values: DayValues[];
}) {
  return (
    <ComposedChart
      responsive
      className="chart"
      data={values}
      margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
    >
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis
        dataKey="date"
        ticks={monthTicks(values)}
        tickFormatter={formatShortMonth}
        axisLine={false}
        tickLine={false}
        tick={tick}
      />
      <YAxis
        tickFormatter={formatWholeMoney}
        axisLine={false}
        tickLine={false}
        width="auto"
        tick={tick}
      />
      <Tooltip
        isAnimationActive={false}
        cursor={{ stroke: "var(--border-strong)" }}
        content={({ active, activeIndex }) => {
          const day = values[Number(activeIndex)];
          return active && day ? <Readout day={day} /> : null;
        }}
      />
      <Line
        dataKey="invested"
        type="stepAfter"
        stroke={investedColour}
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
        activeDot={activeDot(investedColour)}
        zIndex={DefaultZIndexes.area - 1}
      />
      <Area
        dataKey="marketValue"
        stroke={marketValueColour}
        strokeWidth={2}
        fill={marketValueColour}
        fillOpacity={0.1}
        isAnimationActive={false}
        activeDot={activeDot(marketValueColour)}
      />
    </ComposedChart>
  );
});
