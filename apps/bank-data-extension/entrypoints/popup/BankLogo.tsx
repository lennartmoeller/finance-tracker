import type { Account } from "@finance-tracker/bank-data-api/contract";
import deutscheBank from "../../assets/deutsche-bank.png";
import finvesto from "../../assets/finvesto.png";
import ing from "../../assets/ing.png";
import tradeRepublic from "../../assets/trade-republic.png";

const logos: Record<Account["bank"], string> = {
  "Deutsche Bank": deutscheBank,
  finvesto,
  ING: ing,
  "Trade Republic": tradeRepublic,
};

export function BankLogo({
  bank,
  size,
}: {
  bank: Account["bank"];
  size: "small" | "medium";
}) {
  return <img className={`logo ${size}`} src={logos[bank]} alt="" />;
}
