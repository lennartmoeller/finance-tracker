import { expect, test } from "vitest";
import exportFile from "./export-file.ts";
import { headerV1 } from "./shapes.ts";

const own = "max@example.com";

const read = (text: string, email = own) =>
  exportFile.exportFiles.cash.read(new TextEncoder().encode(text), email)
    .rawTransactions;

const quoted = (cells: string[]) =>
  cells.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",");

const payment: Record<string, string> = {
  Datum: "29.10.2026",
  Uhrzeit: "10:15:00",
  Zeitzone: "CET",
  Name: "Adobe Systems Software Ireland LTD",
  Typ: "Zahlung im Einzugsverfahren mit Zahlungsrechnung",
  Status: "Abgeschlossen",
  Währung: "EUR",
  Brutto: "-38,98",
  Gebühr: "0,00",
  Netto: "-38,98",
  "Absender E-Mail-Adresse": own,
  "Empfänger E-Mail-Adresse": "billing@adobe.example",
  Transaktionscode: "1AB23456CD789012E",
  Artikelbezeichnung: "Creative Cloud\nFoto",
  Guthaben: "-38,98",
  "Auswirkung auf Guthaben": "Soll",
};

const row = (changes: Record<string, string>) =>
  quoted(headerV1.map((column) => ({ ...payment, ...changes })[column] ?? ""));

const funding = {
  Name: "",
  Typ: "Bankgutschrift auf PayPal-Konto ",
  Status: "Ausstehend",
  Brutto: "38,98",
  Netto: "38,98",
  "Absender E-Mail-Adresse": "",
  "Empfänger E-Mail-Adresse": own,
  Transaktionscode: "2BC34567DE890123F",
  Guthaben: "0,00",
  "Auswirkung auf Guthaben": "Haben",
};

const report = (...rows: Record<string, string>[]) =>
  [quoted(headerV1), ...rows.map(row)].join("\n") + "\n";

test("keeps only the rows that move money, such as a payment and the bank funding that pays it, across quoted line breaks, and drops what a reversal undoes", () => {
  const rawTransactions = read(
    report(
      {},
      funding,
      { Typ: "Allgemeine Autorisierung", "Auswirkung auf Guthaben": "Memo" },
      { Typ: "Zahlung per PayPal-Käuferkredit", Netto: "38,98" },
      {
        Typ: "Allgemeine Zahlung",
        Name: "PayPal (Europe) S.à r.l. et Cie, SCA",
      },
      { Typ: "Einbehaltung für offene Autorisierung" },
      { Währung: "USD" },
      { ...funding, Transaktionscode: "3CD45678EF901234G" },
      {
        Typ: "Rückbuchung von ACH-Gutschrift",
        Transaktionscode: "4DE56789FG012345H",
        "Zugehöriger Transaktionscode": "3CD45678EF901234G",
      },
      {
        Typ: "Von Nutzer eingeleitete Abbuchung",
        Status: "Wird bearbeitet",
        Transaktionscode: "5EF67890GH123456I",
      },
      {
        Typ: "Rückbuchung von ACH-Abbuchung",
        Status: "Abgelehnt",
        Transaktionscode: "5EF67890GH123456I",
        "Auswirkung auf Guthaben": "Haben",
      },
    ),
  );
  expect(rawTransactions.map((raw) => raw.Transaktionscode)).toEqual([
    "1AB23456CD789012E",
    "2BC34567DE890123F",
  ]);
  expect(rawTransactions[0]?.Artikelbezeichnung).toBe("Creative Cloud\nFoto");
});

test("refuses another account's report, a changed header, a row with a cell missing and a type the upload has not seen", () => {
  expect(() => read(report({}, funding), "erika@example.com")).toThrow(
    "The PayPal export is of another account.",
  );
  for (const changed of [
    report({}).replace('"Hinweis"', '"Notiz"'),
    report({}).replace(',"Soll"\n', "\n"),
    report({ Typ: "Neue Zahlungsart" }),
  ])
    expect(() => read(changed)).toThrow("doesn't match");
});
