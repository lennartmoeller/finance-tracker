import { MoneyWithPercent } from "./MoneyWithPercent.tsx";

type Props = { amount: string; purchases: string };

export function ColouredGain({
  amount,
  purchases,
  withArrow = false,
}: Props & { withArrow?: boolean }) {
  const sign = Math.sign(Number(amount));
  const size = amount.replace("-", "");
  return (
    <span className={sign > 0 ? "gain" : sign < 0 ? "loss" : ""}>
      {withArrow && (sign > 0 ? "▲ " : sign < 0 ? "▼ " : "")}
      <MoneyWithPercent
        amount={size}
        percent={Number(size) / Number(purchases)}
      />
    </span>
  );
}
