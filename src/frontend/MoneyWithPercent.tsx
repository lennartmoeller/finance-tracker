import { formatMoney, formatUnsignedPercent } from "./format.ts";

export const MoneyWithPercent = ({
  amount,
  percent,
}: {
  amount: string;
  percent: number;
}) => (
  <>
    {formatMoney(amount)}{" "}
    <span className="percent">({formatUnsignedPercent(percent)})</span>
  </>
);
