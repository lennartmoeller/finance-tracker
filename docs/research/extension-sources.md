# Extension sources research

Researched on 2026-11-09 for the bank websites the extension reads, which [ADR 0003](../adr/0003-ingestion-through-the-extension-only.md) makes all of them.
Move each fact into the adapter that handles it, and delete this note once none remain.

## Deutsche Bank

- The website logs in with the self-defined Deutsche Bank ID since 2025-08-25 ([Outbank][outbank-db]).
- A Wealthfolio adapter reads depot transactions from the website's CSV export ([wealthfolio-importer-addon #45][wf-45]).
- The giro account's CSV has the columns Buchungstag, Wert, Umsatzart, Begünstigter / Auftraggeber, Verwendungszweck, IBAN / Kontonummer, BIC, Kundenreferenz, Mandatsreferenz, Gläubiger ID, Fremde Gebühren, Betrag, Abweichender Empfänger, Anzahl der Aufträge, Anzahl der Schecks, Soll, Haben and Währung ([household-budget research][db-csv]).
- The giro account's CSV never contains pending transactions, and its Kundenreferenz often holds `NOTPROVIDED`, so it is no transaction ID ([household-budget research][db-csv]).

## finvesto

- finvesto is a brand of FNZ Bank SE ([FondsSuperMarkt][fsm-flex]).
- The cash account is a euro settlement account for trades, distributions, fees and transfers to the user's other accounts ([FondsSuperMarkt][fsm-flex]).
- The portal's Online-Postkorb holds depot and account statements, transaction statements and cost information as PDFs ([FondsSuperMarkt][fsm-portal]).
- No CSV export from the portal was found.

## PayPal

- The activity CSV has Datum, Uhrzeit, Zeitzone, Name, Typ, Status, Währung, Brutto, Gebühr, Netto, sender and recipient email, Transaktionscode, Zugehöriger Transaktionscode, Empfangsnummer, Artikelbezeichnung, Betreff, Hinweis and Guthaben ([beancount-paypal][pp-csv]).
- The activity CSV lists currency conversions as separate rows ([beancount-paypal][pp-csv]).
- PayPal's login rejects a WebDriver-controlled Firefox, so an adapter is tried out in a regular profile ([#4][i4]).

[db-csv]: https://github.com/ramazankarisan/household-budget/blob/main/docs/research/07-deutsche-bank-csv.md
[fsm-flex]: https://www.fonds-super-markt.de/fnz-bank/konto-flex/
[fsm-portal]: https://www.fonds-super-markt.de/neuigkeiten/artikel/welche-moeglichkeiten-bietet-das-online-portal-der-fnz-bank/
[i4]: https://github.com/lennartmoeller/finance-tracker/issues/4#issuecomment-6745729813
[outbank-db]: https://help.outbankapp.com/en/kb/articles/deutsche-bank-neues-banking
[pp-csv]: https://github.com/nils-werner/beancount-paypal/blob/master/beancount_paypal/lang.py
[wf-45]: https://github.com/waldonso2/wealthfolio-importer-addon/issues/45
