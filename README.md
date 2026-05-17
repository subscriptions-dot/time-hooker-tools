# Time Hooker Tools

Smart browser helpers for everyday timer-heavy workflows.

This repository includes:

- **Time Hooker - Universal Shortlink Timer Bypass**: a userscript for supported shortlink, countdown, verify, continue, and get-link pages.
- **HROne Punch Timer**: a lightweight Chrome extension that shows worked time and remaining time on HROne.
- **Local Link Resolver**: a no-login local redirect helper for exact source-to-final URL rules.

Optional backend resolver design: `docs/resolver-endpoint.md`

Owner: **Pankaj**

## Time Hooker

Time Hooker is a mobile-friendly userscript for Violentmonkey/Tampermonkey. It helps with supported shortlink flows by speeding safe countdown timers, showing a floating proxy button for the real action, remembering site settings, and preventing unsafe repeated clicks.

### Highlights

- Fast-forward supported countdown timers
- Floating `CLICK` proxy button for real targets
- `Auto Click Target` toggle with safety locks
- `Auto Flow Skip` for safe intermediate redirect/timer/continue pages
- Final-link guard for VPlink/Telegram pages
- Direct SchemePro article-chain skipping by decoding safe page targets
- Per-site saved settings and built-in profiles
- Macro record/play/delete for difficult pages
- Ad overlay cleanup
- Mobile-friendly floating panel

### Supported Flow Families

The current rules are strongest on the inspected families:

- VPlink
- DarkGuruji
- StartupLearners
- PrivateJobBeta / Rempo style timer gates
- SchemePro / LinkShortify style continue flows

On SchemePro chains, Time Hooker reads the page-provided encoded next-step URL and moves through the article steps without clicking ads. Final LinkShortify pages may still require a real Turnstile/Captcha token before the destination can be released.

No userscript can guarantee every shortlink site because many use different backend, ad, session, and anti-bot logic. Time Hooker focuses on safe, inspectable page actions and avoids clicking ad iframes.

VPlink-style chains can include multiple article hops across DarkGuruji and StartupLearners. Time Hooker follows safe page redirects and reveals page-owned Continue buttons, waits for StartupLearners step state after verify, and stops if the same article step repeats.

## HROne Punch Timer

HROne Punch Timer is a small Chrome extension for `app.hrone.cloud`.

It shows:

- worked time
- remaining time
- progress toward the default `8h30m` work target
- hides stale previous-day punches
- stops the displayed worked time at `8h30m` after the target is complete

It stores only today's first punch time in local Chrome storage and does not send attendance data anywhere.

## Local Link Resolver

Local Link Resolver is a small Chrome extension inspired by the local redirect-rule idea from `bypass-links`, but without Firebase login or private server sync.

It can:

- save exact source URL to final URL rules locally
- redirect saved source URLs automatically
- check simple HTTP redirects

It cannot solve JavaScript timer gates by itself. Use Time Hooker for timer pages and Local Link Resolver for repeated exact links where you already know the final URL.

## Install

### Time Hooker userscript

1. Install Violentmonkey or Tampermonkey.
2. Open `userscripts/time-hooker.user.js`.
3. Install or update the script.
4. Keep only the latest Time Hooker enabled to avoid duplicate clicks.

### HROne extension

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable Developer mode.
4. Click `Load unpacked`.
5. Select `extensions/hrone-punch-timer`.

### Local Link Resolver extension

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable Developer mode.
4. Click `Load unpacked`.
5. Select `extensions/local-link-resolver`.

ZIP package: `dist/local-link-resolver.zip`

## Safety Notes

- Final VPlink/Telegram links are manual by design.
- Final LinkShortify Turnstile/Captcha checks remain manual by design.
- Auto mode is controlled by the `Auto Click Target` checkbox.
- Intermediate shortlink flow movement is controlled by `Auto Flow Skip`.
- Ad iframe clicks are intentionally avoided.
- Old versions of similar scripts should be disabled before testing.

## License

MIT
