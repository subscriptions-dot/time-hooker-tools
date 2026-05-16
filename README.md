# Time Hooker Tools

Smart browser helpers for everyday timer-heavy workflows.

This repository includes:

- **Time Hooker - Universal Shortlink Timer Bypass**: a userscript for supported shortlink, countdown, verify, continue, and get-link pages.
- **HROne Punch Timer**: a lightweight Chrome extension that shows worked time and remaining time on HROne.

Owner: **Pankaj**

## Time Hooker

Time Hooker is a mobile-friendly userscript for Violentmonkey/Tampermonkey. It helps with supported shortlink flows by speeding safe countdown timers, showing a floating proxy button for the real action, remembering site settings, and preventing unsafe repeated clicks.

### Highlights

- Fast-forward supported countdown timers
- Floating `CLICK` proxy button for real targets
- `Auto Click Target` toggle with safety locks
- Final-link guard for VPlink/Telegram pages
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

No userscript can guarantee every shortlink site because many use different backend, ad, session, and anti-bot logic. Time Hooker focuses on safe, inspectable page actions and avoids clicking ad iframes.

## HROne Punch Timer

HROne Punch Timer is a small Chrome extension for `app.hrone.cloud`.

It shows:

- worked time
- remaining time
- progress toward the default `8h30m` work target

It stores only today's first punch time in local Chrome storage and does not send attendance data anywhere.

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

## Safety Notes

- Final VPlink/Telegram links are manual by design.
- Auto mode is controlled by the `Auto Click Target` checkbox.
- Ad iframe clicks are intentionally avoided.
- Old versions of similar scripts should be disabled before testing.

## License

MIT
