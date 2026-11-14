import { memo } from "react";
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
import {
  formatAmount,
  formatDate,
  formatMoney,
  formatShortMonth,
  formatWholeMoney,
} from "./format.ts";
import { none } from "./none.tsx";

type Day = { date: string } & Record<string, string | number | null>;

type Series = {
  key: string;
  name: string;
  colour?: string;
  step?: true;
  signed?: true;
};

export const depotSeries: Series[] = [
  { key: "marketValue", name: "Market value", colour: "var(--category-1)" },
  {
    key: "invested",
    name: "Invested money",
    colour: "var(--faint)",
    step: true,
  },
  { key: "gain", name: "Gain", signed: true },
];

export const balanceSeries: Series[] = [
  { key: "balance", name: "Balance", colour: "var(--category-1)" },
];

export const totalSeries: Series[] = [
  { key: "total", name: "Total", colour: "var(--category-1)" },
  { key: "cash", name: "Cash accounts" },
  { key: "depots", name: "Depots" },
];

const maxTicks = 8;
const tick = { fill: "var(--muted)", fontSize: 11 };
const activeDot = (fill: string) => ({
  r: 4,
  fill,
  stroke: "var(--raised)",
  strokeWidth: 2,
});

function monthTicks(values: Day[]) {
  const starts = values
    .map(({ date }) => date)
    .filter((date) => date.endsWith("-01"));
  const step = Math.ceil(starts.length / maxTicks);
  return starts.filter((_, index) => index % step === 0);
}

function Readout({ day, series }: { day: Day; series: Series[] }) {
  return (
    <div className="readout">
      <div className="readout-title">{formatDate(day.date)}</div>
      {series.map(({ key, name, colour, signed }) => {
        const value = day[key];
        return (
          <div className="readout-row" key={key}>
            <span className="key">
              <span style={{ background: colour }} />
              {name}
            </span>
            <strong>
              {typeof value !== "number"
                ? none
                : signed
                  ? formatAmount(String(value), "EUR")
                  : formatMoney(String(value))}
            </strong>
          </div>
        );
      })}
    </div>
  );
}

export const ValueChart = memo(function ValueChart({
  values,
  series,
}: {
  values: Day[];
  series: Series[];
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
          return active && day ? <Readout day={day} series={series} /> : null;
        }}
      />
      {series.map(
        ({ key, colour, step }) =>
          colour &&
          (step ? (
            <Line
              key={key}
              dataKey={key}
              type="stepAfter"
              stroke={colour}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              activeDot={activeDot(colour)}
              zIndex={DefaultZIndexes.area - 1}
            />
          ) : (
            <Area
              key={key}
              dataKey={key}
              stroke={colour}
              strokeWidth={2}
              fill={colour}
              fillOpacity={0.1}
              isAnimationActive={false}
              activeDot={activeDot(colour)}
            />
          )),
      )}
    </ComposedChart>
  );
});
