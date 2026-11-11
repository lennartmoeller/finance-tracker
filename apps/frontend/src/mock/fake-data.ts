import type {
  Account,
  DepotTransaction,
  Price,
  Transaction,
} from "@finance-tracker/shared/contract";
import type { Data } from "../App.tsx";

type Brand = NonNullable<Transaction["brand"]>;
type Security = {
  isin: string;
  name: string;
  logo: string | null;
  price: number;
};

export const deutscheBankShares = "DE0005140008";

const tile = (background: string, color: string, text: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${background}"/><text x="20" y="27" font-family="system-ui,sans-serif" font-size="${text.length > 1 ? "15" : "21"}" font-weight="700" text-anchor="middle" fill="${color}">${text}</text></svg>`,
  )}`;

const brand = (name: string, logo: string | null): Brand => ({ name, logo });
const brands = {
  rossmann: brand("Rossmann", tile("#d6001c", "#fff", "R")),
  kaufland: brand("Kaufland", tile("#e10915", "#fff", "K")),
  lidl: brand("Lidl", tile("#0050aa", "#fff000", "L")),
  edeka: brand("EDEKA", tile("#ffe500", "#1b4a9c", "E")),
  dm: brand("dm", tile("#fff", "#e2001a", "dm")),
  uberEats: brand("Uber Eats", tile("#000", "#06c167", "U")),
  netflix: brand("Netflix", tile("#000", "#e50914", "N")),
  spotify: brand("Spotify", tile("#1db954", "#000", "S")),
  amazon: brand("Amazon", tile("#232f3e", "#ff9900", "a")),
  deutscheBahn: brand("Deutsche Bahn", tile("#fff", "#ec0016", "DB")),
  shell: brand("Shell", tile("#fbce07", "#dd1d21", "S")),
  paypal: brand("PayPal", tile("#003087", "#fff", "P")),
  vodafone: brand("Vodafone", tile("#e60000", "#fff", "V")),
  mcdonalds: brand("McDonald's", tile("#da291c", "#ffc72c", "M")),
  stadtbaeckerei: brand("Stadtbäckerei", null),
};

const security = (
  isin: string,
  name: string,
  logo: string | null,
  price: number,
): Security => ({ isin, name, logo, price });
const securities = {
  msciWorld: security(
    "IE00B4L5Y983",
    "iShares Core MSCI World UCITS ETF USD (Acc)",
    tile("#000", "#fff", "i"),
    108.4,
  ),
  allWorld: security(
    "IE00B3RBWM25",
    "Vanguard FTSE All-World UCITS ETF (USD) Distributing",
    tile("#96151d", "#fff", "V"),
    136.2,
  ),
  apple: security(
    "US0378331005",
    "Apple Inc.",
    tile("#000", "#fff", "A"),
    228.1,
  ),
  allianz: security(
    "DE0008404005",
    "Allianz SE",
    tile("#003781", "#fff", "A"),
    326.5,
  ),
  deutscheBank: security(
    deutscheBankShares,
    "Deutsche Bank AG",
    tile("#0018a8", "#fff", "/"),
    17.9,
  ),
  dws: security(
    "DE0009848119",
    "DWS Top Dividende LD",
    tile("#0c2340", "#fff", "D"),
    133.4,
  ),
  amundi: security("LU2089238203", "Amundi Prime Global UCITS ETF", null, 35.2),
};

export function fakeData(): Data {
  let seed = 20261111;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const chance = (probability: number) => random() < probability;
  const pick = <T>(list: readonly T[]) =>
    list[Math.floor(random() * list.length)] as T;
  const between = (low: number, high: number) =>
    Math.round((low + random() * (high - low)) * 100) / 100;
  const digits = (count: number) =>
    Array.from({ length: count }, () => Math.floor(random() * 10)).join("");

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const daysAgo = (days: number) =>
    new Date(today.getTime() - days * 86_400_000);
  const iso = (date: Date) =>
    `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const days = (from: number, to = 1) =>
    Array.from({ length: from - to + 1 }, (_, index) => daysAgo(from - index));

  const start = 850;
  const closesOf = new Map(
    Object.values(securities).map(({ isin, price }) => {
      const closes = new Map<string, number>();
      let close = price;
      for (const date of days(start + 7).toReversed()) {
        if (date.getDay() % 6 === 0) continue;
        closes.set(iso(date), Math.round(close * 100) / 100);
        close /= 1 + (random() - 0.48) * 0.03;
      }
      return [isin, closes];
    }),
  );
  const priceOn = ({ isin }: Security, date: Date) => {
    for (let day = date; ; day = new Date(day.getTime() - 86_400_000)) {
      const close = closesOf.get(isin)?.get(iso(day));
      if (close) return close;
    }
  };

  const account = (
    id: number,
    bank: Account["bank"],
    type: Account["type"],
    name: string,
    syncedDaysAgo: number,
  ): Account => ({
    id,
    bank,
    type,
    name,
    number: `FAKE${String(id)}`,
    lastSyncedAt: new Date(Date.now() - syncedDaysAgo * 86_400_000),
  });
  const accounts = [
    account(1, "ING", "cash", "Everyday", 0.1),
    account(2, "ING", "cash", "Reserve", 3),
    account(3, "Trade Republic", "cash", "Spending", 9),
    account(4, "Deutsche Bank", "cash", "Main", 45),
    account(5, "Trade Republic", "depot", "ETFs", 9),
    account(6, "Deutsche Bank", "depot", "Employee shares", 120),
    account(7, "finvesto", "depot", "Fund plan", 14),
  ];

  const transactions: Transaction[] = [];
  const cash = (
    accountId: number,
    date: Date,
    amount: number,
    counterparty: string | null,
    description: string | null,
    brand: Brand | null = null,
  ) =>
    transactions.push({
      id: transactions.length + 1,
      accountId,
      cash: {
        date: iso(date),
        amount: amount.toFixed(2),
        currency: "EUR",
        counterparty,
        description,
      },
      depot: null,
      brand,
    });
  const depot = (
    accountId: number,
    date: Date,
    { isin, name, logo }: Security,
    type: DepotTransaction["type"],
    quantity: number | null,
    amount: number | null,
    description: string | null,
  ) =>
    transactions.push({
      id: transactions.length + 1,
      accountId,
      cash: null,
      depot: {
        date: iso(date),
        isin,
        securityName: name,
        securityLogo: logo,
        type,
        quantity: quantity?.toFixed(4) ?? null,
        amount: amount?.toFixed(2) ?? null,
        currency: amount === null ? null : "EUR",
        description,
      },
      brand: null,
    });
  const buy = (
    accountId: number,
    date: Date,
    bought: Security,
    amount: number,
    description: string,
  ) => {
    const quantity = amount / priceOn(bought, date);
    depot(accountId, date, bought, "trade", quantity, amount, description);
    return quantity;
  };
  const card = (date: Date) =>
    `NR XXXX 4711 ${pick(["BERLIN", "HAMBURG", "POTSDAM"])} KAUFUMSATZ ${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")} ${digits(6)}\nARN${digits(23)}\nGoogle Pay`;

  for (const date of days(390)) {
    const day = date.getDate();
    const month = date.toLocaleString("de-DE", { month: "long" });
    const year = String(date.getFullYear());
    if (day === 1)
      cash(
        1,
        date,
        -950,
        "Hausverwaltung Beispiel GmbH",
        `Miete ${month} ${year}\nWhg. 3 OG links`,
      );
    if (day === 2)
      cash(
        1,
        date,
        -500,
        "Trade Republic Bank GmbH",
        "Einzahlung Trade Republic",
      );
    if (day === 5)
      cash(
        1,
        date,
        -13.99,
        "Netflix International B.V.",
        `${digits(12)} Netflix Monatsabo`,
        brands.netflix,
      );
    if (day === 12)
      cash(
        1,
        date,
        -10.99,
        "Spotify AB",
        `Spotify Premium\nP${digits(10)}`,
        brands.spotify,
      );
    if (day === 15)
      cash(
        1,
        date,
        -39.99,
        "Vodafone GmbH",
        `Kundennr. ${digits(9)}`,
        brands.vodafone,
      );
    if (day === 27)
      cash(1, date, 3120, "Beispiel AG", `LOHN/GEHALT ${month} ${year}`);
    if (day === 28) {
      cash(1, date, -300, "Alex Example", "Sparen");
      cash(2, date, 300, "Alex Example", "Sparen");
    }
    if (day === 30 && date.getMonth() % 3 === 2)
      cash(2, date, between(4, 15), null, "Abschluss\nZinsen 2,75 % p.a.");
    if (date.getDay() === 0) continue;
    if (chance(0.45)) {
      const [shop, counterparty] = pick([
        [brands.kaufland, "VISA KAUFLAND 2345"],
        [brands.lidl, "VISA LIDL SAGT DANKE"],
        [brands.edeka, "EDEKA CENTER SCHMIDT"],
      ] as const);
      cash(1, date, -between(8, 85), counterparty, card(date), shop);
    }
    if (chance(0.12)) {
      const [shop, counterparty] = pick([
        [brands.rossmann, "VISA ROSSMANN 1234"],
        [brands.dm, "VISA DM FIL.2345"],
      ] as const);
      cash(1, date, -between(3, 35), counterparty, card(date), shop);
    }
    if (chance(0.15))
      cash(
        1,
        date,
        -between(2, 9),
        "VISA STADTBAECKEREI 12",
        card(date),
        brands.stadtbaeckerei,
      );
    if (chance(0.07))
      cash(1, date, -between(3, 12), "VISA CAFE MILCHBAR", card(date));
    if (chance(0.06))
      cash(1, date, -between(2, 8), "VISA BAECKEREI KRUSE", card(date));
    if (chance(0.07))
      cash(
        1,
        date,
        -between(14, 38),
        "VISA UBER *EATS HELP.UBER.C",
        card(date),
        brands.uberEats,
      );
    if (chance(0.05))
      cash(
        1,
        date,
        -between(9, 89),
        "VISA DB VERTRIEB GMBH",
        card(date),
        brands.deutscheBahn,
      );
    if (chance(0.04))
      cash(
        1,
        date,
        -between(30, 75),
        "VISA SHELL 1234",
        card(date),
        brands.shell,
      );
    if (chance(0.08))
      cash(
        1,
        date,
        -between(9, 120),
        "AMAZON PAYMENTS EUROPE S.C.A.",
        `302-${digits(7)}-${digits(7)} Amazon.de`,
        brands.amazon,
      );
    if (chance(0.05))
      cash(
        1,
        date,
        -between(5, 60),
        "PayPal Europe S.a.r.l. et Cie S.C.A",
        `${digits(13)}/PP.${digits(4)}.PP/. Ihr Einkauf bei Beispiel Shop`,
        brands.paypal,
      );
    if (chance(0.04))
      cash(
        1,
        date,
        -between(6, 14),
        "VISA MCDONALDS 1234",
        card(date),
        brands.mcdonalds,
      );
    if (chance(0.02))
      cash(
        1,
        date,
        between(10, 60),
        "Erika Musterfrau",
        pick(["Pizza", "Konzertkarten", "Danke!"]),
      );
  }

  const savingsPlan = (date: Date, bought: Security, amount: number) => {
    const quantity = buy(5, date, bought, amount, "Savings plan execution");
    cash(
      3,
      date,
      -amount,
      null,
      `Savings plan execution ${bought.isin} ${bought.name}, quantity: ${quantity.toFixed(4)}`,
    );
    return quantity;
  };
  const sell = (
    accountId: number,
    date: Date,
    sold: Security,
    quantity: number,
    description: string,
  ) => {
    const amount = quantity * priceOn(sold, date) - 1;
    depot(accountId, date, sold, "trade", -quantity, -amount, description);
    return amount;
  };
  const dividend = (date: Date, paying: Security, amount: number) => {
    depot(5, date, paying, "distribution", null, amount, null);
    cash(3, date, amount, null, `Cash Dividend for ISIN ${paying.isin}`);
  };
  cash(
    3,
    daysAgo(start),
    2000,
    "Alex Example",
    "Incoming transfer from Alex Example",
  );
  savingsPlan(daysAgo(start - 3), securities.msciWorld, 1000);
  for (const date of days(start - 4)) {
    const day = date.getDate();
    if (day === 1) cash(3, date, between(2, 12), null, "Your interest payment");
    if (day === 2) {
      cash(3, date, 500, "Alex Example", "Incoming transfer from Alex Example");
      savingsPlan(date, securities.msciWorld, 150);
      savingsPlan(date, securities.allWorld, 100);
    }
    if (day === 26 && date.getMonth() % 3 === 2)
      dividend(date, securities.allWorld, between(4, 14));
    if (day === 15 && date.getMonth() === 4)
      dividend(date, securities.allianz, between(45, 52));
    if (date.getDay() !== 0 && chance(0.03))
      cash(
        3,
        date,
        -between(3, 40),
        "ROSSMANN",
        "Card transaction",
        brands.rossmann,
      );
  }
  let amundiShares = 0;
  for (const date of days(start - 4, 661))
    if (date.getDate() === 2)
      amundiShares += Number(
        savingsPlan(date, securities.amundi, 50).toFixed(4),
      );
  const amundiSale = sell(
    5,
    daysAgo(655),
    securities.amundi,
    amundiShares,
    "Sell trade",
  );
  cash(3, daysAgo(655), amundiSale, null, "Sell trade LU2089238203 Amundi");
  buy(5, daysAgo(790), securities.allianz, 1000, "Buy trade");
  cash(3, daysAgo(790), -1000, null, "Buy trade DE0008404005 Allianz SE");
  const appleShares = buy(5, daysAgo(610), securities.apple, 500, "Buy trade");
  sell(5, daysAgo(270), securities.apple, appleShares, "Sell trade");

  cash(4, daysAgo(183), 1000, "Alex Example", "Umbuchung");
  cash(4, daysAgo(181), -49.9, "Deutsche Bank AG", "Kontoführungsentgelt");
  cash(4, daysAgo(176), -4.9, "VISA CAFE MILCHBAR", "KARTENZAHLUNG");
  cash(4, daysAgo(170), -250, "Alex Example", "Umbuchung");
  for (const receivedDaysAgo of [412, 231])
    depot(
      6,
      daysAgo(receivedDaysAgo),
      securities.deutscheBank,
      "trade",
      30,
      30 * priceOn(securities.deutscheBank, daysAgo(receivedDaysAgo)),
      "RECEIPT",
    );
  depot(
    6,
    daysAgo(183),
    securities.deutscheBank,
    "distribution",
    null,
    20.4,
    "Dividende",
  );

  for (const date of days(650))
    if (date.getDate() === 28) {
      buy(7, date, securities.dws, 50, "Kauf Sparplan");
      buy(7, date, securities.amundi, 25, "Kauf Sparplan");
    }
  depot(
    7,
    daysAgo(340),
    securities.dws,
    "fee",
    -0.0412,
    null,
    "Entgeltbelastung Verkauf",
  );
  depot(
    7,
    daysAgo(310),
    securities.amundi,
    "tax",
    -0.0178,
    null,
    "Verkauf wegen Vorabpauschale",
  );
  const dwsDistribution = 28.51;
  depot(
    7,
    daysAgo(270),
    securities.dws,
    "distribution",
    null,
    dwsDistribution,
    "Ausschüttung",
  );
  depot(
    7,
    daysAgo(265),
    securities.dws,
    "reinvestment",
    dwsDistribution / priceOn(securities.dws, daysAgo(265)),
    null,
    "Wiederanlage Ausschüttung",
  );

  const dateOf = ({ cash, depot }: Transaction) =>
    cash?.date ?? depot?.date ?? "";
  const prices: Price[] = [...closesOf].flatMap(([isin, closes]) =>
    [...closes].map(([date, close]) => ({
      isin,
      date,
      price: close.toFixed(2),
    })),
  );
  return {
    accounts,
    transactions: transactions.sort(
      (a, b) => dateOf(b).localeCompare(dateOf(a)) || b.id - a.id,
    ),
    prices,
  };
}
