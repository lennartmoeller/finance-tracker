import { banks } from "../../banks.ts";

export function BankLogo({
  bank,
  size,
}: {
  bank: string;
  size: "small" | "medium";
}) {
  const logo = banks.find(({ name }) => name === bank)?.logo;
  return logo && <img className={`logo ${size}`} src={logo} alt="" />;
}
