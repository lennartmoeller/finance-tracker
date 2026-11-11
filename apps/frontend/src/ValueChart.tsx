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
import type { DayValues } from "./figures.ts";
import {
  formatAmount,
  formatDate,
  formatMoney,
  formatShortMonth,
  formatWholeMoney,
} from "./format.ts";
import { none } from "./none.tsx";

const maxTicks = 8;
const tick = { fill: "var(--muted)", fontSize: 11 };
const activeDot = (fill: string) => ({
  r: 4,
  fill,
  stroke: "var(--raised)",
  strokeWidth: 2,
});

function monthTicks(values: DayValues[]) {
  const starts = values.flatMap(({ date }) =>
    date.endsWith("-01") ? [date] : [],
  );
  const step = Math.ceil(starts.length / maxTicks);
  return starts.filter((_, index) => index % step === 0);
}

function Readout({ day }: { day: DayValues }) {
  const rows = [
    ["market-value", "Market value", day.marketValue, formatMoney],
    ["invested-money", "Invested money", day.invested, formatMoney],
    ["", "Gain", day.gain, (gain: string) => formatAmount(gain, "EUR")],
  ] as const;
  return (
    <div className="readout">
      <div className="readout-title">{formatDate(day.date)}</div>
      {rows.map(([key, name, value, format]) => (
        <div className="readout-row" key={name}>
          <span className={`key ${key}`}>{name}</span>
          <strong>{value === null ? none : format(String(value))}</strong>
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
  const byDate = new Map(values.map((day) => [day.date, day]));
  return (
    <figure className="chart">
      <ComposedChart
        responsive
        data={values}
        style={{ width: "100%", height: 260 }}
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
          content={({ active, label }) => {
            const day = byDate.get(String(label));
            return active && day ? <Readout day={day} /> : null;
          }}
        />
        <Line
          dataKey="invested"
          type="stepAfter"
          stroke="var(--faint)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          activeDot={activeDot("var(--faint)")}
          zIndex={DefaultZIndexes.area - 1}
        />
        <Area
          dataKey="marketValue"
          stroke="var(--category-1)"
          strokeWidth={2}
          fill="var(--category-1)"
          fillOpacity={0.1}
          isAnimationActive={false}
          activeDot={activeDot("var(--category-1)")}
        />
      </ComposedChart>
    </figure>
  );
});
