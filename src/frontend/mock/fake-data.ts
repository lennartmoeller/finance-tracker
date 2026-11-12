import type {
  Account,
  DepotTransaction,
  Price,
  Transaction,
} from "@finance-tracker/shared/contract";
import type { Data } from "../App.tsx";

type Brand = NonNullable<Transaction["brand"]>;
type Security = { isin: string; name: string; logo: string | null };

export const deutscheBankShares = "DE0005140008";

const tile = (background: string, color: string, text: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${background}"/><text x="20" y="27" font-family="system-ui,sans-serif" font-size="${text.length > 1 ? "15" : "21"}" font-weight="700" text-anchor="middle" fill="${color}">${text}</text></svg>`,
  )}`;

const brand = (name: string, ...colours: [string, string, string] | []) => ({
  name,
  logo: colours.length ? tile(...colours) : null,
});

const brands = {
  rossmann: brand("Rossmann", "#d6001c", "#fff", "R"),
  kaufland: brand("Kaufland", "#e10915", "#fff", "K"),
  lidl: brand("Lidl", "#0050aa", "#fff000", "L"),
  edeka: brand("EDEKA", "#ffe500", "#1b4a9c", "E"),
  dm: brand("dm", "#fff", "#e2001a", "dm"),
  uberEats: brand("Uber Eats", "#000", "#06c167", "U"),
  netflix: brand("Netflix", "#000", "#e50914", "N"),
  spotify: brand("Spotify", "#1db954", "#000", "S"),
  amazon: brand("Amazon", "#232f3e", "#ff9900", "a"),
  deutscheBahn: brand("Deutsche Bahn", "#fff", "#ec0016", "DB"),
  shell: brand("Shell", "#fbce07", "#dd1d21", "S"),
  paypal: brand("PayPal", "#003087", "#fff", "P"),
  vodafone: brand("Vodafone", "#e60000", "#fff", "V"),
  mcdonalds: brand("McDonald's", "#da291c", "#ffc72c", "M"),
  bakery: brand("Stadtbäckerei"),
} satisfies Record<string, Brand>;

const security = (
  isin: string,
  name: string,
  logo: string | null,
  close: number,
) => ({ isin, name, logo, close });

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

const closedStartBalance = 1250;

const accounts: [
  Account["bank"],
  Account["type"],
  string,
  number,
  Account["startBalance"]?,
][] = [
  ["ING", "cash", "Everyday", 0.1],
  ["ING", "cash", "Reserve", 3],
  ["Trade Republic", "cash", "Spending", 9],
  ["Deutsche Bank", "cash", "Main", 45],
  ["Trade Republic", "depot", "ETFs", 9],
  ["Deutsche Bank", "depot", "Employee shares", 120],
  ["finvesto", "depot", "Fund plan", 14],
  ["Sparkasse", "cash", "Closed", 480, closedStartBalance.toFixed(2)],
];
const [
  everyday,
  reserve,
  spending,
  main,
  etfs,
  employeeShares,
  fundPlan,
  closed,
] = [1, 2, 3, 4, 5, 6, 7, 8];

const purchases: [number, [number, number], string, Brand | null][] = [
  [0.15, [8, 85], "VISA KAUFLAND 2345", brands.kaufland],
  [0.15, [8, 85], "VISA LIDL SAGT DANKE", brands.lidl],
  [0.15, [8, 85], "EDEKA CENTER SCHMIDT", brands.edeka],
  [0.06, [3, 35], "VISA ROSSMANN 1234", brands.rossmann],
  [0.06, [3, 35], "VISA DM FIL.2345", brands.dm],
  [0.15, [2, 9], "VISA STADTBAECKEREI 12", brands.bakery],
  [0.07, [3, 12], "VISA CAFE MILCHBAR", null],
  [0.07, [14, 38], "VISA UBER *EATS HELP.UBER.C", brands.uberEats],
  [0.05, [9, 89], "VISA DB VERTRIEB GMBH", brands.deutscheBahn],
  [0.04, [30, 75], "VISA SHELL 1234", brands.shell],
  [0.08, [9, 120], "AMAZON PAYMENTS EUROPE S.C.A.", brands.amazon],
  [0.05, [5, 60], "PayPal Europe S.a.r.l. et Cie S.C.A", brands.paypal],
  [0.04, [6, 14], "VISA MCDONALDS 1234", brands.mcdonalds],
];

export function fakeData(): Data {
  let seed = 20261111;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const between = ([low, high]: [number, number]) =>
    Math.round((low + random() * (high - low)) * 100) / 100;
  const digits = (count: number) =>
    Array.from({ length: count }, () => Math.floor(random() * 10)).join("");
  const cities = ["BERLIN", "HAMBURG", "POTSDAM"];
  const card = (date: Date) =>
    `NR XXXX 4711 ${cities[Math.floor(random() * cities.length)] ?? ""} KAUFUMSATZ ${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")} ${digits(6)}\nARN${digits(23)}\nGoogle Pay`;

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const daysAgo = (days: number) =>
    new Date(today.getTime() - days * 86_400_000);
  const iso = (date: Date) =>
    `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const days = (from: number, to = 1) =>
    Array.from({ length: from - to + 1 }, (_, index) => daysAgo(from - index));

  const history = 850;
  const closes = new Map(
    Object.values(securities).map(({ isin, close }) => {
      const ofSecurity = new Map<string, number>();
      let price = close;
      for (const date of days(history + 7).toReversed()) {
        if (date.getDay() % 6 === 0) continue;
        ofSecurity.set(iso(date), Math.round(price * 100) / 100);
        price /= 1 + (random() - 0.48) * 0.03;
      }
      return [isin, ofSecurity];
    }),
  );
  const closeOn = ({ isin }: Security, date: Date) => {
    for (let day = date; ; day = new Date(day.getTime() - 86_400_000)) {
      const close = closes.get(isin)?.get(iso(day));
      if (close) return close;
    }
  };

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
  ) => {
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
    return quantity ?? 0;
  };
  const buy = (
    accountId: number,
    date: Date,
    bought: Security,
    amount: number,
    description: string,
  ) =>
    depot(
      accountId,
      date,
      bought,
      "trade",
      amount / closeOn(bought, date),
      amount,
      description,
    );
  const sell = (
    accountId: number,
    date: Date,
    sold: Security,
    quantity: number,
  ) => {
    const amount = quantity * closeOn(sold, date) - 1;
    depot(accountId, date, sold, "trade", -quantity, -amount, "Sell trade");
    return amount;
  };
  const savingsPlan = (date: Date, bought: Security, amount: number) => {
    const quantity = buy(etfs, date, bought, amount, "Savings plan execution");
    cash(
      spending,
      date,
      -amount,
      null,
      `Savings plan execution ${bought.isin} ${bought.name}, quantity: ${quantity.toFixed(4)}`,
    );
    return quantity;
  };

  for (const date of days(390)) {
    const month = date.toLocaleString("de-DE", { month: "long" });
    const period = `${month} ${String(date.getFullYear())}`;
    const monthly: Record<number, () => void> = {
      1: () =>
        cash(
          everyday,
          date,
          -950,
          "Hausverwaltung Beispiel GmbH",
          `Miete ${period}\nWhg. 3 OG links`,
        ),
      2: () =>
        cash(
          everyday,
          date,
          -500,
          "Trade Republic Bank GmbH",
          "Einzahlung Trade Republic",
        ),
      5: () =>
        cash(
          everyday,
          date,
          -13.99,
          "Netflix International B.V.",
          "Netflix Monatsabo",
          brands.netflix,
        ),
      12: () =>
        cash(
          everyday,
          date,
          -10.99,
          "Spotify AB",
          "Spotify Premium",
          brands.spotify,
        ),
      15: () =>
        cash(
          everyday,
          date,
          -39.99,
          "Vodafone GmbH",
          "Kundennr. 123456789",
          brands.vodafone,
        ),
      27: () =>
        cash(everyday, date, 3120, "Beispiel AG", `LOHN/GEHALT ${period}`),
      28: () => {
        cash(everyday, date, -300, "Alex Example", "Sparen");
        cash(reserve, date, 300, "Alex Example", "Sparen");
      },
    };
    monthly[date.getDate()]?.();
    if (date.getDate() === 30 && date.getMonth() % 3 === 2)
      cash(
        reserve,
        date,
        between([4, 15]),
        null,
        "Abschluss\nZinsen 2,75 % p.a.",
      );
    if (date.getDay() === 0) continue;
    for (const [chance, range, counterparty, shop] of purchases)
      if (random() < chance)
        cash(everyday, date, -between(range), counterparty, card(date), shop);
    if (random() < 0.02)
      cash(everyday, date, between([10, 60]), "Erika Musterfrau", "Danke!");
  }

  cash(
    spending,
    daysAgo(history),
    2000,
    "Alex Example",
    "Incoming transfer from Alex Example",
  );
  savingsPlan(daysAgo(history - 3), securities.msciWorld, 1000);
  let amundiShares = 0;
  for (const date of days(history - 4)) {
    const day = date.getDate();
    if (day === 1)
      cash(spending, date, between([2, 12]), null, "Your interest payment");
    if (day === 2) {
      cash(
        spending,
        date,
        500,
        "Alex Example",
        "Incoming transfer from Alex Example",
      );
      savingsPlan(date, securities.msciWorld, 150);
      savingsPlan(date, securities.allWorld, 100);
      if (date <= daysAgo(661))
        amundiShares += Number(
          savingsPlan(date, securities.amundi, 50).toFixed(4),
        );
    }
    const dividend = (paying: Security, amount: number) => {
      depot(etfs, date, paying, "distribution", null, amount, null);
      cash(
        spending,
        date,
        amount,
        null,
        `Cash Dividend for ISIN ${paying.isin}`,
      );
    };
    if (day === 26 && date.getMonth() % 3 === 2)
      dividend(securities.allWorld, between([4, 14]));
    if (day === 15 && date.getMonth() === 4)
      dividend(securities.allianz, between([45, 52]));
  }
  const amundiSale = sell(etfs, daysAgo(655), securities.amundi, amundiShares);
  cash(
    spending,
    daysAgo(655),
    amundiSale,
    null,
    "Sell trade LU2089238203 Amundi",
  );
  buy(etfs, daysAgo(790), securities.allianz, 1000, "Buy trade");
  cash(
    spending,
    daysAgo(790),
    -1000,
    null,
    "Buy trade DE0008404005 Allianz SE",
  );
  const appleShares = buy(
    etfs,
    daysAgo(610),
    securities.apple,
    500,
    "Buy trade",
  );
  sell(etfs, daysAgo(270), securities.apple, appleShares);

  let closedBalance = closedStartBalance;
  for (const date of days(840, 500)) {
    if (date.getDate() !== 1) continue;
    const fee = -4.47;
    const power = -between([20, 60]);
    closedBalance += fee + power;
    cash(closed, date, fee, null, "Entgeltabrechnung");
    cash(closed, date, power, "Stadtwerke Beispiel", "Abschlag Strom");
  }
  cash(
    closed,
    daysAgo(495),
    -closedBalance,
    null,
    "Created by hand: balance paid out to the ING account on closing",
  );
  cash(
    everyday,
    daysAgo(494),
    closedBalance,
    "Alex Example",
    "Ausgleich des Kontosaldos wegen Kontoauflösung",
  );

  cash(main, daysAgo(183), 1000, "Alex Example", "Umbuchung");
  cash(main, daysAgo(181), -49.9, "Deutsche Bank AG", "Kontoführungsentgelt");
  cash(main, daysAgo(176), -4.9, "VISA CAFE MILCHBAR", "KARTENZAHLUNG");
  cash(main, daysAgo(170), -250, "Alex Example", "Umbuchung");
  for (const received of [412, 231])
    depot(
      employeeShares,
      daysAgo(received),
      securities.deutscheBank,
      "trade",
      30,
      30 * closeOn(securities.deutscheBank, daysAgo(received)),
      "RECEIPT",
    );
  depot(
    employeeShares,
    daysAgo(183),
    securities.deutscheBank,
    "distribution",
    null,
    20.4,
    "Dividende",
  );

  for (const date of days(650))
    if (date.getDate() === 28) {
      buy(fundPlan, date, securities.dws, 50, "Kauf Sparplan");
      buy(fundPlan, date, securities.amundi, 25, "Kauf Sparplan");
    }
  depot(
    fundPlan,
    daysAgo(340),
    securities.dws,
    "fee",
    -0.0412,
    null,
    "Entgeltbelastung Verkauf",
  );
  depot(
    fundPlan,
    daysAgo(310),
    securities.amundi,
    "tax",
    -0.0178,
    null,
    "Verkauf wegen Vorabpauschale",
  );
  const distribution = 28.51;
  depot(
    fundPlan,
    daysAgo(270),
    securities.dws,
    "distribution",
    null,
    distribution,
    "Ausschüttung",
  );
  depot(
    fundPlan,
    daysAgo(265),
    securities.dws,
    "reinvestment",
    distribution / closeOn(securities.dws, daysAgo(265)),
    null,
    "Wiederanlage Ausschüttung",
  );

  const dateOf = ({ cash, depot }: Transaction) =>
    cash?.date ?? depot?.date ?? "";
  return {
    accounts: accounts.map(
      ([bank, type, name, syncedDaysAgo, startBalance = null], index) => ({
        id: index + 1,
        bank,
        type,
        name,
        number: `FAKE${String(index + 1)}`,
        lastSyncedAt: new Date(Date.now() - syncedDaysAgo * 86_400_000),
        startBalance,
      }),
    ),
    transactions: transactions.sort(
      (a, b) => dateOf(b).localeCompare(dateOf(a)) || b.id - a.id,
    ),
    prices: [...closes].flatMap(([isin, ofSecurity]): Price[] =>
      [...ofSecurity].map(([date, close]) => ({
        isin,
        date,
        price: close.toFixed(2),
      })),
    ),
  };
}
