# Extension sources research

Researched on 2026-11-09 for the bank websites the extension reads, which [ADR 0003](../adr/0003-ingestion-through-the-extension-only.md) makes all of them.
Move each fact into the adapter that handles it, and delete this note once none remain.

## PayPal

- The activity CSV has Datum, Uhrzeit, Zeitzone, Name, Typ, Status, Währung, Brutto, Gebühr, Netto, sender and recipient email, Transaktionscode, Zugehöriger Transaktionscode, Empfangsnummer, Artikelbezeichnung, Betreff, Hinweis and Guthaben ([beancount-paypal][pp-csv]).
- The activity CSV lists currency conversions as separate rows ([beancount-paypal][pp-csv]).
- PayPal's login rejects a WebDriver-controlled Firefox, so an adapter is tried out in a regular profile ([#4][i4]).

[i4]: https://github.com/lennartmoeller/finance-tracker/issues/4#issuecomment-6745729813
[pp-csv]: https://github.com/nils-werner/beancount-paypal/blob/master/beancount_paypal/lang.py
