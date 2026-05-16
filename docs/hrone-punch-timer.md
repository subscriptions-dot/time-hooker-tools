# HROne Punch Timer

HROne Punch Timer is a focused Chrome extension for showing work-time progress on `app.hrone.cloud`.

## Features

- Detects today's first punch time when available
- Ignores previous-day `Last punch` values so yesterday's attendance does not appear as today's timer
- Shows worked time capped at the `8h30m` target
- Shows remaining time
- Displays progress toward an `8h30m` target
- Uses Chrome local storage only
- No remote server and no analytics

## Files

- `manifest.json`
- `content.js`
- `styles.css`

## Privacy

The extension runs only on:

```text
https://app.hrone.cloud/*
```

It does not transmit attendance data.
