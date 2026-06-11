# Changelog

## 51.0 - Fast Auto-Walk + Crash-Safe Navigation

- **Faster multi-hop walk**: auto-navigation between safe flow hops now fires in ~150 ms (was 300 ms), so 2-3 redirect hops chain through near-instantly instead of dragging.
- **Crash-safe guard**: a single `window.th_navigating` lock ensures only one navigation is ever scheduled at a time, so the main loop can't double-fire or bounce a page into a redirect loop. Honest note: the final Telegram link on well-built shorteners is server-gated and cannot be extracted directly — V51 makes walking the chain fast and safe, and the deep scanner still jumps directly whenever a next/final URL is actually embedded in the page.

## 50.0 - Stronger Ad-Overlay Removal + Chain Coverage

- **Ad-overlay removal upgraded** (`Kill Ad Overlays`): now also removes full-screen `fixed`/`absolute`/`sticky` blocking layers, clears body scroll-locks (`overflow`, `position:fixed`, and `modal-open`/`no-scroll`/`overflow-hidden`/etc. classes), and matches more selectors (`backdrop`, `interstitial`, `aria-modal`) and ad networks (propeller, hilltopads, monetag, popcash...). A `hasFlowInside()` guard protects any container holding the timer / continue / get-link / our own panel, so real content is never hidden.
- **Chain coverage**: traced `vplink.in/<id>` → it JS-redirects to `vacancymode.in` (landing → same-site article timer with countdown + continue + Google ads) → further hops → final Telegram link. Added `vacancymode.in` to the remote rules so the article-timer step auto-activates. Same-site landing→article hops are handled by the V48 deep scanner; cross-domain hops the pages perform themselves via `location.href`.

## 49.0 - Cleaner UI

- Removed the **Site Macro** section (Record / Stop / Play / Delete + dropdowns) from the panel — it was the most complex, least-used part. The macro backend functions remain dormant in code but are no longer exposed.
- Removed the **Auto Click Target** toggle and merged its behaviour into **Auto Flow Skip** (`shouldAutoFlow()` now triggers on either), so there is a single, clear "do it automatically" switch instead of two overlapping ones.
- Kept Video Fast Forward (it genuinely changes media `playbackRate`), Highlight, Pin, and Position. No functional change to flow/timer/captcha logic; cleanup is UI-only plus the auto-click merge.

## 48.0 - Deep Page Scanner

- **Deep page scanner**: when there is no confident Continue/Get-Link button, the script now reads the page's own code to find the hidden next URL — JS `location`/`location.replace` assignments, `<meta http-equiv=refresh>`, `data-url`/`data-href`/`data-link` attributes, and base64-encoded URLs decoded with `atob`. This is the "scan the page and understand the flow" capability.
- **Stable by design**: only **same-host / known-safe-intermediate** scanned URLs auto-advance (loop-protected, max 3 visits); **external / final / Telegram** URLs are never auto-jumped — instead the proxy shows `➡️ NEXT PAGE` for a one-tap move, so the script can't send you somewhere wrong on its own.
- The `⚡ Force Skip` button also uses the scanner: if nothing is clickable, it navigates to the discovered next URL (user-initiated, so external hops are allowed there).
- Runs only as a late fallback under Auto Flow Skip / Universal mode; known-site flows and the captcha pause are unchanged.

## 47.0 - Instant Self-Healing Panel

- The floating panel now re-injects **instantly** via a `MutationObserver` on `<html>` (debounced ~150 ms) instead of only a 2 s poll. Many shortlink/timer pages rebuild `<body>` or wipe the DOM when their countdown starts, which removed the menu and left it gone — this is why the panel showed on some sites but vanished on others. It now reappears immediately and the periodic safety net (now 1.5 s) remains as backup, with the top-most z-index re-asserted.
- Diagnosis note: the affected sites (e.g. kishanganjhalchal.com, loan.kannursalafi.com) send **no CSP**, so the cause was DOM rebuilds + the pre-V42 builds having no watchdog at all. Devices still on the old published version must update to get the self-healing panel.

## 46.0 - Remote Rules Sync

- **Remote rules sync**: a single hosted JSON (`rules/time-hooker-rules.json`, set via `REMOTE_RULES_URL`) can add or update site rules for every installed device with **no re-publish**. Edit the JSON once → all devices pick it up within a day.
- **Stability first**: the fetch runs only in the userscript sandbox via `GM_xmlhttpRequest` (added `@grant` + `@connect` hosts), is throttled to once per day, size-limited (200 KB), and fully wrapped in try/catch. The page always boots instantly from the cached/built-in rules and **never blocks**; if the URL is unreachable it silently keeps the last good cache.
- **Safe by construction**: only known `PROFILE_KEYS` are read from each remote entry and type-coerced, so a malformed remote file cannot break the engine. Remote rules act like built-in profiles (priority: user's own → built-in → remote → learned → global) and never override the captcha pause or the manual final/external/Telegram link guards.
- Seeded the rules file with common global networks (GPLinks, Exe.io, Ouo.io, ShrinkMe, Clk.sh, Adshrink, Try2Link). UI profile label now shows `remote` when a remote rule is active.

## 45.0 - Captcha-Safe Pause + Per-Site Learning

- **Captcha / Cloudflare / Turnstile guard**: when a real human-verification challenge is detected (Cloudflare "just a moment" / "checking your browser", reCAPTCHA, hCaptcha, Turnstile widgets), Time Hooker **fully pauses** — no timer speed-up (the timer engine reads `window.th_captcha_present`), no flow skip, no auto-click. The proxy shows `🔒 SOLVE CAPTCHA` so it never looks "stuck". Resumes automatically once the challenge clears. Detection requires the widget to be actually visible (or a full-page CF interstitial) to avoid pausing on hidden/idle widgets.
- **Per-site trick learning**: a new `siteTricks` store records whether a site needed `force` (stuck-recovery fired) or flowed normally as `timer`. Known `force` sites get a lower stuck threshold (3 ticks instead of 8) so they recover faster next time.
- No change to known-site flows beyond the captcha pause.

## 44.0 - Stuck-Timer Killer

- **`performance.now()` hook**: now scaled with the same factor as `Date.now`, so `requestAnimationFrame` and performance-based countdowns also fast-forward. Keeping both clocks consistent also avoids tamper-detection that freezes/resets timers when the two clocks diverge.
- **Stuck-timer auto-recovery**: if a detected countdown value does not change for ~8 loop ticks (e.g. an ad callback never fired, or it is a server/perf timer the script cannot speed), the gate is force-finished and the Continue/Get-Link button is revealed.
- **`⚡ Force Skip Now` button** in the panel: one tap zeros visible countdown numbers, finishes a recognised gate, and reveals + clicks the best Continue/Get-Link target. Final VPlink/Telegram links stay manual (highlighted only).
- These run only when the script is enabled; known-site flows are unchanged.

## 43.0 - Cross-Device Auto-Update

- Added distribution metadata to the userscript header so installs **auto-update across every device**: `@updateURL` + `@downloadURL` (Greasy Fork), plus `@homepageURL`, `@supportURL`, and `@icon`.
- Publish flow: bump `@version` → upload to the hosted URL → Tampermonkey/Violentmonkey on each device picks up the new version automatically (default daily check; user can force "Check for updates").
- One install link works on any device with Tampermonkey/Violentmonkey: the Greasy Fork page (or the raw `*.user.js` URL) triggers install.
- No behavior change to the flow engines; this release is about distribution + update reach.

## 42.0 - Self-Learning Flow + Self-Healing UI

- Added **self-learning sites**: when Universal Pattern Mode is on and a new domain matches the shortlink/countdown/verify shape, the script remembers it. On the next visit that site auto-activates (Fast-Forward + Auto Flow Skip + Universal mode) like a built-in profile.
- Added a one-tap **"➕ Add Site"** button to save the current domain as a strong site profile, plus a **"🗑 Forget"** button to remove a learned/saved site and fall back to global.
- Added a **self-healing floating panel**: if a page wipes the DOM or rebuilds `<body>`, the menu re-injects itself within ~2s and keeps its top-most z-index, so it never disappears.
- Refreshed the **UI/UX**: gradient title, an always-visible live status bar (current flow/gate state), profile-source label (built-in / learned / global), and a learned-sites counter.
- New `learnedSites` store section is persisted via GM storage alongside profiles and macros; learned sites respect the existing per-site disable/forget controls.

> Note: this release is built on the local 40.0 source. If the published 41.0 contained extra fixes, reconcile those into this branch before publishing.

## 40.0 - V38 Flow + Universal Pattern Mode

- Restored V38 fast VPlink/DarkGuruji/StartupLearners step behavior by removing the V39 step-state wait and `STEP LOOP: manual` block.
- Added optional `Universal Pattern Mode` for unknown same-pattern shortlink pages.
- Universal mode is OFF by default and can be saved per site profile.
- Unknown sites use proxy-first safety: intermediate same-host flow links may continue, but final, external, and Telegram-style targets stay manual.

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
