import { expect, test } from "vitest";
import paypal from "./extract.ts";
import { headerV1 } from "./shapes.ts";

test("a payment books its net amount with the merchant as counterparty and its item title, subject and note once each as description", () => {
  const data = {
    ...Object.fromEntries(headerV1.map((column) => [column, ""])),
    Datum: "29.10.2026",
    Name: "Adobe Systems Software Ireland LTD",
    Typ: "PayPal Express-Zahlung",
    Status: "Abgeschlossen",
    Währung: "EUR",
    Brutto: "-1.038,98",
    Gebühr: "0,00",
    Netto: "-1.038,98",
    Transaktionscode: "1AB23456CD789012E",
    Artikelbezeichnung: "Creative Cloud",
    Betreff: "Creative Cloud",
    Hinweis: "Jahresabo",
    "Auswirkung auf Guthaben": "Soll",
  };
  expect(paypal.extractions.cash[1]([data])).toEqual([
    {
      data,
      identity: "1AB23456CD789012E",
      cash: {
        date: "2026-10-29",
        amount: "-1038.98",
        currency: "EUR",
        counterparty: "Adobe Systems Software Ireland LTD",
        counterpartyIban: null,
        description: "Creative Cloud · Jahresabo",
      },
    },
  ]);
});
