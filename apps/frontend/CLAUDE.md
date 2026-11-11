# Frontend

- Design each new view or redesign with the user in the mock mode first, extending the fake data and the bar's data states until the view reaches every state it has, and build its backend part only after the user approves it.
- Keep the mock mode's code in `src/mock/`, which `main.tsx` imports only in mock mode.
- Keep the frontend monochrome, giving colour only to bank and brand logos and to status: freshness, errors and destructive actions.
- Give every colour a token on `:root` in `style.css`, written as one `light-dark()` value.
- Format money, numbers and dates in German through `format.ts`, and word labels in English with the glossary's terms.
