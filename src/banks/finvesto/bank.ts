import { depotNumber } from "@finance-tracker/shared/account-number";
import type { Bank } from "@finance-tracker/shared/bank";

export default {
  name: "finvesto",
  logo: new URL("./logo.png", import.meta.url).href,
  accounts: { depot: depotNumber(11, [4, 4, 3]) },
} satisfies Bank;
