import { Pie, PieChart, Sector } from "recharts";
import { formatWholePercent } from "../format.ts";

export type Slice = { isins: string[]; value: number; fill: string };

// The categorical palette passes the colour-blind and normal-vision checks as a closed ring for up to six slices, but not for seven.
const categoryColours = 6;
const minLabelledShare = 0.02;
const labelGap = 18;

export function slicesOf(
  holdings: { isin: string; marketValue: string }[],
): Slice[] {
  const rest = holdings.slice(categoryColours);
  return [
    ...holdings
      .slice(0, categoryColours)
      .map(({ isin, marketValue }, index) => ({
        isins: [isin],
        value: Number(marketValue),
        fill: `var(--category-${String(index + 1)})`,
      })),
    ...(rest.length
      ? [
          {
            isins: rest.map(({ isin }) => isin),
            value: rest.reduce(
              (sum, { marketValue }) => sum + Number(marketValue),
              0,
            ),
            fill: "var(--faint)",
          },
        ]
      : []),
  ];
}

export function MarketValueDonut({
  slices,
  selectedIsin,
  onSelect,
  onHover,
}: {
  slices: Slice[];
  selectedIsin: string | null;
  onSelect: (isin: string) => void;
  onHover: (isins: string[]) => void;
}) {
  return (
    <PieChart responsive>
      <Pie
        data={slices}
        dataKey="value"
        innerRadius="43%"
        outerRadius="70%"
        stroke="var(--bg)"
        strokeWidth={2}
        isAnimationActive={false}
        onMouseEnter={(_, index) => {
          onHover(slices[index]?.isins ?? []);
        }}
        onMouseLeave={() => {
          onHover([]);
        }}
        onClick={(_, index) => {
          const [isin, ...others] = slices[index]?.isins ?? [];
          if (isin && !others.length) onSelect(isin);
        }}
        shape={(props) => {
          const slice = slices[props.index];
          const share = props.percent ?? 0;
          const angle = (-(props.midAngle ?? 0) * Math.PI) / 180;
          const radius = props.outerRadius + labelGap;
          return (
            <g
              opacity={
                selectedIsin && !slice?.isins.includes(selectedIsin) ? 0.25 : 1
              }
            >
              <Sector {...props} />
              {share >= minLabelledShare && (
                <text
                  className="share"
                  x={props.cx + radius * Math.cos(angle)}
                  y={props.cy + radius * Math.sin(angle)}
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
    </PieChart>
  );
}
