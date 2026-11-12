import { depotNumber, iban } from "@finance-tracker/shared/account-number";
import type { Bank } from "@finance-tracker/shared/bank";

export default {
  name: "Trade Republic",
  logo: new URL("./logo.png", import.meta.url).href,
  accounts: { cash: iban, depot: depotNumber(10, [4, 4, 2]) },
} satisfies Bank;
