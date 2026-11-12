import { Pie, PieChart, Sector } from "recharts";

export type Slice = { isins: string[]; value: number; fill: string };

// The categorical palette passes the colour-blind and normal-vision checks as a closed ring for up to six slices, but not for seven.
const categoryColours = 6;

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
        innerRadius="62%"
        outerRadius="100%"
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
        shape={(props) => (
          <Sector
            {...props}
            fillOpacity={
              selectedIsin && !slices[props.index]?.isins.includes(selectedIsin)
                ? 0.25
                : 1
            }
          />
        )}
      />
    </PieChart>
  );
}
