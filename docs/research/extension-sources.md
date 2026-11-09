# Extension sources research

Researched on 2026-11-09 for the bank websites the extension reads, which [ADR 0003](../adr/0003-ingestion-through-the-extension-only.md) makes all of them.
Move each fact into the adapter that handles it, and delete this note once none remain.

## Firefox

- Release and Beta builds of Firefox install only add-ons signed by Mozilla; a private add-on can be signed as unlisted on addons.mozilla.org without being published, or loaded through `about:debugging` until the browser restarts ([signing overview][amo-signing]).
- `webRequest.filterResponseData()` lets an extension read HTTP response bodies, which Chromium browsers do not offer ([StreamFilter][streamfilter]).

## ING

The user's proof-of-concept extension verified these facts on a live account in September 2026, except where a source is linked.

- The Umsatzanzeige's "Exportieren → CSV (Excel)" exports one account for the von/bis range set in its filter, as an `xmlhttprequest` that `filterResponseData()` reads, and the `downloads` API can cancel and erase the file Firefox would save.
- ING keeps about 13 months online and silently clamps a wider von/bis range to it, while a preset such as "1 Jahr" overwrites von/bis and exports less, so the file's own Zeitraum line is the only trustworthy period.
- The file is windows-1252, semicolon-separated and unquoted, starts with a preamble of IBAN, Kontoname, Zeitraum and Saldo, and has the columns Buchung, Wertstellungsdatum, Auftraggeber/Empfänger, Buchungstext, Verwendungszweck, Saldo, Währung, Betrag and Währung.
- A semicolon inside a Verwendungszweck lengthens its row, which realigns from both ends because the four columns before and after it are fixed.
- The file has neither counterparty IBAN nor transaction ID nor pending transactions ([RechnungsFee templates][ing-csv]).
- The site renders on the server with Apache Wicket and answers AJAX in XML, and its transaction list loads a row's Verwendungszweck only when the row is expanded, so the export carries more than the page.

## Trade Republic

- The web app presumably reads the same WebSocket timeline as the unofficial client `pytr`, in which each event carries an `id` (UUID), `timestamp`, `title` (merchant or counterparty), `subtitle`, `amount`, `status`, `eventType` and detail sections ([pytr][pytr]).
- Transfer details show the counterparty's name, IBAN and "Referenz", and cash and depot holdings are separate subscriptions ([pytr][pytr]).
- `pytr` drops "likely same but newer" order and savings-plan events that arrive within 500 ms under a different `id`, so the timeline can repeat an event ([pytr][pytr]).
- Headless clients face AWS WAF bot protection, which a logged-in browser avoids ([pytr][pytr]).
- Since 2026-04-15 the app exports the full cash account and depot history as CSV under Profil → Kontoauszüge → Transaktionsexport ([mobiflip][mobiflip-tr]).
- The CSV header is `datetime;date;account_type;category;type;asset_class;name;symbol;shares;price;amount;fee;tax;currency;original_amount;original_currency;fx_rate;description;transaction_id;value_date;counterparty_name;counterparty_iban;payment_reference`, and a newer comma-quoted variant drops `value_date` and adds `mcc_code` ([Portfolio Performance extractor][pp-trcsv]).
- In the CSV, `transaction_id` is a UUID, `symbol` holds the ISIN, card payments carry the merchant in `description`, and dividends appear twice, as "Cash dividend" and "Cash dividend corrected" ([Portfolio Performance extractor][pp-trcsv], [Portfolio Performance forum][pp-tr-csv]).
- Whether the CSV's `transaction_id` equals the timeline's event `id` is untested.
- The Firefox add-on [Trade Republic CSV Exporter][amo-tr] (MPL-2.0) exports the transaction list the web app has loaded and serves as reference code.

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

[amo-signing]: https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/
[amo-tr]: https://addons.mozilla.org/addon/trade-republic-csv-exporter/
[db-csv]: https://github.com/ramazankarisan/household-budget/blob/main/docs/research/07-deutsche-bank-csv.md
[fsm-flex]: https://www.fonds-super-markt.de/fnz-bank/konto-flex/
[fsm-portal]: https://www.fonds-super-markt.de/neuigkeiten/artikel/welche-moeglichkeiten-bietet-das-online-portal-der-fnz-bank/
[i4]: https://github.com/lennartmoeller/finance-tracker/issues/4#issuecomment-6745729813
[ing-csv]: https://github.com/nicolettas-muggelbude/RechnungsFee/blob/main/vorlagen/bank-csv/README.md
[mobiflip-tr]: https://www.mobiflip.de/trade-republic-bekommt-neue-export-funktion-und-outbank-zieht-sofort-nach/
[outbank-db]: https://help.outbankapp.com/en/kb/articles/deutsche-bank-neues-banking
[pp-csv]: https://github.com/nils-werner/beancount-paypal/blob/master/beancount_paypal/lang.py
[pp-tr-csv]: https://forum.portfolio-performance.info/t/import-trade-republic-csv-transaktionsexport/39126
[pp-trcsv]: https://github.com/portfolio-performance/portfolio/blob/master/name.abuchen.portfolio/src/name/abuchen/portfolio/datatransfer/traderepublic/TradeRepublicCSVExtractor.java
[pytr]: https://github.com/pytr-org/pytr
[streamfilter]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/StreamFilter
[wf-45]: https://github.com/waldonso2/wealthfolio-importer-addon/issues/45
