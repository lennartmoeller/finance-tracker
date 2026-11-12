# Popup

- Keep the popup monochrome, giving colour only to bank logos and to status: freshness, success, errors and destructive actions.
- Give every colour a token on `:root` in `style.css` with its dark value under `prefers-color-scheme: dark`.
- Keep an action disabled until its input is complete and valid, and show what is wrong under the field it concerns.
- Show a failed sync under its account and a failed backend call as the banner under the header.
- Word each error once, where it is thrown, and show it unchanged.
- Confirm an action that deletes data by having the user type the name of what it deletes.
