import { depotNumber, iban } from "../../account-number.ts";
import type { Bank } from "../../bank.ts";

export default {
  name: "Trade Republic",
  logo: new URL("./logo.png", import.meta.url).href,
  accounts: { cash: iban, depot: depotNumber(10, [4, 4, 2]) },
} satisfies Bank;
