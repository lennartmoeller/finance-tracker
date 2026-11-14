import type {
  Account,
  Brand,
  CashTransaction,
  Category,
  DepotTransaction,
  Price,
  Rule,
  Transaction,
} from "@finance-tracker/shared/contract";
import type { Data } from "../App.tsx";
import { banks } from "../banks.ts";

type Security = { isin: string; name: string; logo: string | null };

export const deutscheBankShares = "DE0005140008";

const tile = (background: string, color: string, text: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${background}"/><text x="20" y="27" font-family="system-ui,sans-serif" font-size="${text.length > 1 ? "15" : "21"}" font-weight="700" text-anchor="middle" fill="${color}">${text}</text></svg>`,
  )}`;

type FakeRule = { brand?: string; counterparty?: string; description?: string };

let ruleId = 0;
const rulesOf = (rules: FakeRule[]): Rule[] =>
  rules.map(({ brand, counterparty, description }) => ({
    id: ++ruleId,
    requiredBrandId: brands.find(({ name }) => name === brand)?.id ?? null,
    counterpartyPattern: counterparty ?? null,
    descriptionPattern: description ?? null,
  }));

const brands: Brand[] = [];
for (const [name, domain, colours, ...rules] of [
  [
    "Rossmann",
    "rossmann.de",
    ["#d6001c", "#fff", "R"],
    { counterparty: "rossmann" },
  ],
  [
    "Kaufland",
    "kaufland.de",
    ["#e10915", "#fff", "K"],
    { counterparty: "kaufland" },
  ],
  ["Lidl", "lidl.de", ["#0050aa", "#fff000", "L"], { counterparty: "lidl" }],
  ["EDEKA", "edeka.de", ["#ffe500", "#1b4a9c", "E"], { counterparty: "edeka" }],
  ["dm", "dm.de", ["#fff", "#e2001a", "dm"], { counterparty: "visa dm " }],
  [
    "Uber Eats",
    "ubereats.com",
    ["#000", "#06c167", "U"],
    { counterparty: "uber \\*eats" },
  ],
  [
    "Netflix",
    "netflix.com",
    ["#000", "#e50914", "N"],
    { counterparty: "netflix" },
  ],
  [
    "Spotify",
    "spotify.com",
    ["#1db954", "#000", "S"],
    { counterparty: "spotify" },
  ],
  [
    "Amazon",
    "amazon.de",
    ["#232f3e", "#ff9900", "a"],
    { counterparty: "amazon" },
  ],
  [
    "Deutsche Bahn",
    "bahn.de",
    ["#fff", "#ec0016", "DB"],
    { counterparty: "db vertrieb" },
    { description: "bahn\\.de" },
  ],
  ["Shell", "shell.de", ["#fbce07", "#dd1d21", "S"], { counterparty: "shell" }],
  [
    "PayPal",
    "paypal.com",
    ["#003087", "#fff", "P"],
    { counterparty: "paypal" },
  ],
  [
    "Vodafone",
    "vodafone.de",
    ["#e60000", "#fff", "V"],
    { counterparty: "vodafone" },
  ],
  [
    "McDonald's",
    "mcdonalds.de",
    ["#da291c", "#ffc72c", "M"],
    { counterparty: "mcdonalds" },
  ],
  ["Sky", "sky.de", ["#000", "#fff", "sky"], { counterparty: "^sky " }],
  [
    "DAZN",
    "dazn.com",
    ["#0c161c", "#f8fc00", "D"],
    { counterparty: "paypal", description: "dazn" },
  ],
  [
    "Stadtbäckerei",
    "stadtbaeckerei.de",
    null,
    { counterparty: "stadtbaeckerei" },
  ],
] satisfies [string, string, [string, string, string] | null, ...FakeRule[]][])
  brands.push({
    id: brands.length + 1,
    name,
    domain,
    logo: colours && tile(...colours),
    rules: rulesOf(rules),
  });

const leaves: [path: string, ...rules: FakeRule[]][] = [
  ["Bank fees", { description: "entgelt" }],
  [
    "Food › Eating out",
    { brand: "Uber Eats" },
    { brand: "McDonald's" },
    { counterparty: "cafe" },
  ],
  [
    "Food › Groceries",
    { brand: "Kaufland" },
    { brand: "Lidl" },
    { brand: "EDEKA" },
  ],
  ["Housing › Rent", { counterparty: "hausverwaltung" }],
  ["Housing › Utilities", { counterparty: "stadtwerke" }],
  ["Income › Interest", { description: "zinsen|interest payment" }],
  ["Income › Salary", { description: "lohn/gehalt" }],
  ["Personal care", { brand: "Rossmann" }, { brand: "dm" }],
  ["Shopping", { brand: "Amazon" }, { brand: "PayPal" }],
  ["Streaming › Netflix", { brand: "Netflix" }],
  ["Streaming › Sport streaming › DAZN", { brand: "DAZN" }],
  ["Streaming › Sport streaming › Sky", { brand: "Sky" }],
  [
    "Subscriptions",
    { brand: "Spotify" },
    { brand: "Vodafone" },
    { brand: "Amazon", description: "prime video" },
  ],
  ["Transport", { brand: "Deutsche Bahn" }, { brand: "Shell" }],
];

const categories: Category[] = [];
for (const [path, ...rules] of leaves) {
  const leaf = path
    .split(" › ")
    .reduce<Category | undefined>((parent, name) => {
      const parentId = parent?.id ?? null;
      const found = categories.find(
        (category) => category.parentId === parentId && category.name === name,
      );
      if (found) return found;
      const created = { id: categories.length + 1, parentId, name, rules: [] };
      categories.push(created);
      return created;
    }, undefined);
  leaf?.rules.push(...rulesOf(rules));
}

const matches = (pattern: string | null, text: string | null) =>
  pattern === null || (text !== null && new RegExp(pattern, "i").test(text));

const conditions = (rule: Rule) =>
  [
    rule.requiredBrandId,
    rule.counterpartyPattern,
    rule.descriptionPattern,
  ].filter((condition) => condition !== null).length;

const ranked = (owners: { id: number; rules: Rule[] }[]) =>
  owners
    .flatMap(({ id, rules }) => rules.map((rule) => ({ ...rule, ownerId: id })))
    .sort((a, b) => conditions(b) - conditions(a) || a.id - b.id);

export function matchTransactions(data: Data): Data {
  const brandRules = ranked(data.brands);
  const categoryRules = ranked(data.categories);
  const match = (
    rules: typeof brandRules,
    { counterparty, description }: CashTransaction,
    brandId: number | null,
  ) =>
    rules.find(
      (rule) =>
        (rule.requiredBrandId === null || rule.requiredBrandId === brandId) &&
        matches(rule.counterpartyPattern, counterparty) &&
        matches(rule.descriptionPattern, description),
    )?.ownerId ?? null;
  return {
    ...data,
    transactions: data.transactions.map((transaction) => {
      if (!transaction.cash) return transaction;
      const brandId = match(brandRules, transaction.cash, null);
      const categoryId = match(categoryRules, transaction.cash, brandId);
      return { ...transaction, brandId, categoryId };
    }),
  };
}

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
  sap: security("DE0007164600", "SAP SE", tile("#0070f2", "#fff", "S"), 241.6),
  siemens: security(
    "DE0007236101",
    "Siemens AG",
    tile("#009999", "#fff", "S"),
    214.3,
  ),
  microsoft: security(
    "US5949181045",
    "Microsoft Corp.",
    tile("#737373", "#fff", "M"),
    421.8,
  ),
  emergingMarkets: security(
    "IE00BTJRMP35",
    "Xtrackers MSCI Emerging Markets UCITS ETF 1C",
    null,
    57.4,
  ),
};

const closedStartBalance = 1250;

function fakeNumber(bank: string, type: Account["type"], index: number) {
  if (type === "depot")
    return String(index + 1)
      .repeat(12)
      .slice(
        0,
        banks.find(({ name }) => name === bank)?.accounts.depot?.length,
      );
  const bban = `37040044${String(532013000 + index).padStart(10, "0")}`;
  const check = 98n - (BigInt(`${bban}131400`) % 97n);
  return `DE${check.toString().padStart(2, "0")}${bban}`;
}

const accounts: [
  Account["bank"],
  Account["type"],
  string,
  number,
  Account["startBalance"]?,
  Account["closed"]?,
][] = [
  ["ING", "cash", "Everyday", 0.1],
  ["ING", "cash", "Reserve", 3],
  ["Trade Republic", "cash", "Spending", 9],
  ["Deutsche Bank", "cash", "Main", 45],
  ["Trade Republic", "depot", "ETFs", 9],
  ["Deutsche Bank", "depot", "Employee shares", 120],
  ["finvesto", "depot", "Fund plan", 14],
  ["Sparkasse", "cash", "Closed", 480, closedStartBalance.toFixed(2), true],
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

const purchases: [number, [number, number], string][] = [
  [0.15, [8, 85], "VISA KAUFLAND 2345"],
  [0.15, [8, 85], "VISA LIDL SAGT DANKE"],
  [0.15, [8, 85], "EDEKA CENTER SCHMIDT"],
  [0.06, [3, 35], "VISA ROSSMANN 1234"],
  [0.06, [3, 35], "VISA DM FIL.2345"],
  [0.15, [2, 9], "VISA STADTBAECKEREI 12"],
  [0.07, [3, 12], "VISA CAFE MILCHBAR"],
  [0.07, [14, 38], "VISA UBER *EATS HELP.UBER.C"],
  [0.05, [9, 89], "VISA DB VERTRIEB GMBH"],
  [0.04, [30, 75], "VISA SHELL 1234"],
  [0.08, [9, 120], "AMAZON PAYMENTS EUROPE S.C.A."],
  [0.05, [5, 60], "PayPal Europe S.a.r.l. et Cie S.C.A"],
  [0.04, [6, 14], "VISA MCDONALDS 1234"],
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
      brandId: null,
      categoryId: null,
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
      brandId: null,
      categoryId: null,
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
        ),
      8: () =>
        cash(
          everyday,
          date,
          -30,
          "Sky Deutschland Fernsehen GmbH",
          "Sky Ticket Supersport",
        ),
      12: () => cash(everyday, date, -10.99, "Spotify AB", "Spotify Premium"),
      15: () =>
        cash(everyday, date, -39.99, "Vodafone GmbH", "Kundennr. 123456789"),
      20: () =>
        cash(
          everyday,
          date,
          -44.99,
          "PayPal Europe S.a.r.l. et Cie S.C.A",
          "1046793210354/. DAZN Limited, Ihr Einkauf bei DAZN Limited",
        ),
      22: () =>
        cash(
          everyday,
          date,
          -8.99,
          "AMAZON PAYMENTS EUROPE S.C.A.",
          "Prime Video Kanal-Abo",
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
    for (const [chance, range, counterparty] of purchases)
      if (random() < chance)
        cash(everyday, date, -between(range), counterparty, card(date));
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
  for (const [bought, ago, amount] of [
    [securities.allianz, 790, 1000],
    [securities.sap, 720, 400],
    [securities.siemens, 560, 300],
    [securities.microsoft, 430, 350],
    [securities.emergingMarkets, 300, 200],
  ] as const) {
    buy(etfs, daysAgo(ago), bought, amount, "Buy trade");
    cash(
      spending,
      daysAgo(ago),
      -amount,
      null,
      `Buy trade ${bought.isin} ${bought.name}`,
    );
  }
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
  return matchTransactions({
    accounts: accounts.map(
      (
        [bank, type, name, syncedDaysAgo, startBalance = null, closed = false],
        index,
      ) => ({
        id: index + 1,
        bank,
        type,
        name,
        number: fakeNumber(bank, type, index),
        lastSyncedAt: new Date(Date.now() - syncedDaysAgo * 86_400_000),
        startBalance,
        closed,
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
    brands,
    categories,
  });
}
