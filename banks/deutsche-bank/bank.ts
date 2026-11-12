import { depotNumber, iban } from "@finance-tracker/shared/account-number";
import type { Bank } from "@finance-tracker/shared/bank";

export default {
  name: "Deutsche Bank",
  logo: new URL("./logo.png", import.meta.url).href,
  accounts: { cash: iban, depot: depotNumber(12, [3, 7, 2]) },
} satisfies Bank;
