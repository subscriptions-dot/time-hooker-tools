# Changelog

## 37.0 - SchemePro Chain Skipper

- Added a SchemePro step skipper for `sb1.schemepro.org` and `sb2.schemepro.org`.
- The skipper reads the page's encoded `tagrget_url`, decodes it, and navigates directly to the next step instead of clicking article, ad, or wait buttons.
- Matched SchemePro's own step-cookie behavior by setting `user_step=1` on Step 1/3 and clearing it on Step 2/4 transitions.
- Added per-page navigation locks so the same SchemePro step cannot fire repeatedly.
- Made final `lksfy.com` LinkShortify handling Turnstile-aware: the proxy now waits for a real Turnstile token before treating `Get Link` as ready.
- Kept final `lksfy.com` and VPlink-style final links manual so Auto Click does not open Telegram/final destinations unexpectedly.

