# Changelog

## 39.0 - StartupLearners Step-State Fix

- Made StartupLearners `btn6`/`btn7` handling conservative so hidden Continue links are not followed immediately after verify.
- Added per-session step-state tracking for VPlink-style chains; repeated `Step 1/3` article loops now stop with `STEP LOOP: manual`.
- Added a short state wait after `nextbtn()` before navigating to the next StartupLearners article.
- Added StartupLearners cookie/localStorage compatibility setup for the inspected step gate.
- Kept final VPlink, Telegram, and external destination actions manual.

## 38.0 - VPlink Multi-Hop Flow

- Added `Auto Flow Skip`, separate from `Auto Click Target`, for safe intermediate shortlink flow movement.
- Added VPlink/DarkGuruji/StartupLearners chain handling for JS redirect pages, `tp-snp2` timer pages, and `btn6`/`btn7` step pages.
- Added session loop protection so repeated article hops stop with `FLOW LOOP: manual` instead of spinning forever.
- Kept final Get Link, Telegram, and external destination actions manual.
- Migrated older saved built-in profiles so supported sites get the new `Auto Flow Skip` default.

## 37.0 - SchemePro Chain Skipper

- Added a SchemePro step skipper for `sb1.schemepro.org` and `sb2.schemepro.org`.
- The skipper reads the page's encoded `tagrget_url`, decodes it, and navigates directly to the next step instead of clicking article, ad, or wait buttons.
- Matched SchemePro's own step-cookie behavior by setting `user_step=1` on Step 1/3 and clearing it on Step 2/4 transitions.
- Added per-page navigation locks so the same SchemePro step cannot fire repeatedly.
- Made final `lksfy.com` LinkShortify handling Turnstile-aware: the proxy now waits for a real Turnstile token before treating `Get Link` as ready.
- Kept final `lksfy.com` and VPlink-style final links manual so Auto Click does not open Telegram/final destinations unexpectedly.
