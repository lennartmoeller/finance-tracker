import { depotNumber } from "../../account-number.ts";
import type { Bank } from "../../bank.ts";

export default {
  name: "finvesto",
  logo: new URL("./logo.png", import.meta.url).href,
  accounts: { depot: depotNumber(11, [4, 4, 3]) },
} satisfies Bank;
