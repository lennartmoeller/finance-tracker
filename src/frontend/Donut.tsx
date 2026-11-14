import type { ReactNode } from "react";
import { Pie, PieChart, Sector, Tooltip } from "recharts";
import { formatWholePercent } from "./format.ts";

export type Slice = {
  keys: string[];
  value: number;
  fill: string;
  parts?: Slice[];
};

// The categorical palette passes the colour-blind and normal-vision checks as a closed ring for up to six slices, but not for seven.
const categoryColours = 6;
const minLabelledShare = 0.02;
const labelGap = 18;
const radii = { inner: 0.43, middle: 0.565, outer: 0.7 };

const radius = (fraction: number) => `${String(fraction * 100)}%`;

export function slicesOf(parts: { key: string; value: string }[]): Slice[] {
  const rest = parts.slice(categoryColours);
  return [
    ...parts.slice(0, categoryColours).map(({ key, value }, index) => ({
      keys: [key],
      value: Number(value),
      fill: `var(--category-${String(index + 1)})`,
    })),
    ...(rest.length
      ? [
          {
            keys: rest.map(({ key }) => key),
            value: rest.reduce((sum, { value }) => sum + Number(value), 0),
            fill: "var(--faint)",
          },
        ]
      : []),
  ];
}

export function Donut({
  slices,
  selectedKey,
  onSelect,
  onHover,
  tooltip,
}: {
  slices: Slice[];
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
  onHover?: (keys: string[]) => void;
  tooltip?: (slice: Slice) => ReactNode;
}) {
  const total = slices.reduce((sum, { value }) => sum + value, 0);
  const nested = slices.some(({ parts }) => parts);
  let angle = 0;
  const arcs = slices.map((slice) => {
    const start = angle;
    angle += (360 * slice.value) / total;
    return { slice, start, end: angle };
  });

  const ring = (
    data: Slice[],
    inner: number,
    outer: number,
    [startAngle, endAngle] = [0, 360],
  ) => (
    <Pie
      key={data.map(({ keys }) => keys.join()).join()}
      data={data}
      dataKey="value"
      startAngle={startAngle}
      endAngle={endAngle}
      innerRadius={radius(inner)}
      outerRadius={radius(outer)}
      stroke="var(--bg)"
      strokeWidth={2}
      isAnimationActive={false}
      onMouseEnter={(_, index) => {
        onHover?.(data[index]?.keys ?? []);
      }}
      onMouseLeave={() => {
        onHover?.([]);
      }}
      onClick={(_, index) => {
        const [key, ...others] = data[index]?.keys ?? [];
        if (key && !others.length) onSelect?.(key);
      }}
      shape={(props) => {
        const slice = data[props.index];
        const leaf = !slice?.parts;
        const edge = (props.outerRadius / outer) * radii.outer;
        const share = (slice?.value ?? 0) / total;
        const mid = (-(props.midAngle ?? 0) * Math.PI) / 180;
        return (
          <g
            opacity={
              selectedKey && !slice?.keys.includes(selectedKey) ? 0.25 : 1
            }
          >
            <Sector {...props} outerRadius={leaf ? edge : props.outerRadius} />
            {leaf && share >= minLabelledShare && (
              <text
                className="share"
                x={props.cx + (edge + labelGap) * Math.cos(mid)}
                y={props.cy + (edge + labelGap) * Math.sin(mid)}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {formatWholePercent(share)}
              </text>
            )}
          </g>
        );
      }}
    />
  );

  return (
    <PieChart responsive>
      {tooltip && (
        <Tooltip
          isAnimationActive={false}
          content={({ active, payload }) => {
            const slice = payload[0]?.payload as Slice | undefined;
            return active && slice ? tooltip(slice) : null;
          }}
        />
      )}
      {ring(slices, radii.inner, nested ? radii.middle : radii.outer)}
      {arcs.flatMap(({ slice, start, end }) =>
        slice.parts
          ? [ring(slice.parts, radii.middle, radii.outer, [start, end])]
          : [],
      )}
    </PieChart>
  );
}
