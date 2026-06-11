# Changelog

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
