import { expect, test } from "vitest";
import sparkasse from "./extract.ts";

const extract = (rawTransactions: unknown[]) =>
  sparkasse.extractions.cash[1](rawTransactions);

const booking = Object.assign(Array<string>(17).fill(""), {
  0: "DE89370400440532013000",
  1: "01.06.23",
  2: "01.06.23",
  3: "FOLGELASTSCHRIFT",
  4: "Abschlag Strom 06/2023 ",
  11: `${"Stadtwerke Beispiel GmbH".padEnd(70)}Musterstr. 1 12345 Musterstadt`,
  12: "DE02120300000000202051",
  14: "-31,24",
  15: "EUR",
  16: "Umsatz gebucht",
});

test("a booking reads its two-digit year as 20yy, its counterparty without padding and address, its purpose trimmed, and its identity hashes the whole row, while a pending one fails the shape", () => {
  expect(extract([booking])).toEqual([
    {
      data: booking,
      identity: { hashOf: booking },
      cash: {
        date: "2023-06-01",
        amount: "-31.24",
        currency: "EUR",
        counterparty: "Stadtwerke Beispiel GmbH",
        description: "Abschlag Strom 06/2023",
      },
    },
  ]);
  expect(extract([booking.with(16, "Umsatz vorgemerkt")])).toBeUndefined();
});
