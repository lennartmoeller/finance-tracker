# Frontend

- Design each new view or redesign with the user in the mock mode first, extending the fake data and the bar's data states until the view reaches every state it has, and build its backend part only after the user approves it.
- Keep the mock mode's code in `mock/`, which `main.tsx` imports only in mock mode.
- Keep each view in its own folder with its stylesheet, and what two views share in the shell's modules directly in the frontend's folder.
- Design for desktop windows from 1,100 pixels wide, because a phone gets an app of its own if one comes, as [the context](../../docs/context/apps.md#one-backend-one-frontend-and-a-browser-extension) records.
- Keep the frontend monochrome, giving colour only to bank and brand logos, to status (freshness, errors and destructive actions), to gains and losses, to chart series, whose colours pass the `dataviz` skill's palette validator in light and dark, and to pattern syntax wherever a pattern shows, whose colours reach 4.5:1 contrast against every background they sit on.
- Give every colour a token on `:root` in `style.css`, written as one `light-dark()` value.
- Format money, numbers and dates in German through `format.ts`, and word labels in English with the code's terms.
- Leave a table cell without a value blank, with neither a dash nor a stand-in icon such as a letter from another column.
