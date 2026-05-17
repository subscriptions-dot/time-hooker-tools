# Time Hooker UI

The floating panel is designed for mobile browser users.

## Main Controls

- `SCRIPT ON/OFF`: master switch for the whole script.
- `Fast-Forward Timers`: speeds supported timer APIs.
- `Timer Speed`: controls how aggressively future timers are accelerated.
- `Aggro Bypass`: attempts a one-time safe finish/reveal on known gates.
- `Kill Ad Overlays`: hides common ad overlays and closeable blockers.
- `Auto Click Target`: enables automatic intermediate flow clicks.
- `Auto Flow Skip`: enables safe redirect/timer/continue flow movement on supported chains.
- `Universal Pattern Mode`: enables proxy-first pattern detection on unknown sites with similar timer/verify/continue pages.
- `Highlight Original`: outlines the real detected target.
- `Pin Fake Button`: shows a large floating proxy button.

## Macro Controls

- `Record`: start recording manual clicks for the current site.
- `Stop & Save`: save the recorded sequence.
- `Play`: replay the selected macro.
- `Delete`: remove the selected macro.

## Final Link Guard

Final VPlink/Telegram links are not auto-opened. The proxy button remains manual so the user can confirm the final destination.

Final LinkShortify pages with Cloudflare Turnstile are also manual. The proxy shows `SOLVE TURNSTILE` until the page has a real token, then it can point to `Get Link`.

## SchemePro Skipper

On `sb1.schemepro.org` and `sb2.schemepro.org`, Time Hooker can skip article steps by decoding the page's own next-step URL. This does not click ad iframes or disabled wait buttons.

## VPlink Chain

On VPlink-style chains, Time Hooker can move through safe intermediate pages such as DarkGuruji and StartupLearners redirects, timer gates, and hidden Continue buttons using the faster V38-style flow. Final destinations remain manual, and repeated URL loops stop with `FLOW LOOP: manual`.

## Universal Pattern Mode

Universal Pattern Mode is OFF by default. When enabled, unknown domains are scanned for common shortlink page shapes such as step counters, timer text, hidden Continue buttons, and inline JavaScript redirects. It keeps final, external, and Telegram-style links manual.
