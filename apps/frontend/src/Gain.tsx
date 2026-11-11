import {
  formatAmount,
  formatMoney,
  formatPercent,
  formatUnsignedPercent,
} from "./format.ts";

type Props = { amount: string; purchases: string };

const direction = (amount: string) =>
  Number(amount) > 0
    ? { className: "gain", arrow: "▲ " }
    : Number(amount) < 0
      ? { className: "loss", arrow: "▼ " }
      : { className: "", arrow: "" };

export const Gain = ({ amount, purchases }: Props) =>
  `${formatAmount(amount, "EUR")} · ${formatPercent(Number(amount) / Number(purchases))}`;

export function ColouredGain({
  amount,
  purchases,
  withArrow = false,
}: Props & { withArrow?: boolean }) {
  const { className, arrow } = direction(amount);
  const size = amount.replace("-", "");
  return (
    <span className={className}>
      {withArrow && arrow}
      {formatMoney(size)} (
      {formatUnsignedPercent(Number(size) / Number(purchases))})
    </span>
  );
}
