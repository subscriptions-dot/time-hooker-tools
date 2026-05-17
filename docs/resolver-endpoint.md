# Optional Resolver Endpoint

Time Hooker V37 is script-first. It skips SchemePro article steps in the browser by decoding the page-provided next URL.

A backend resolver can be added later for cases where a local/server browser is useful. The endpoint should stay disabled by default and should not claim to bypass CAPTCHA or Turnstile challenges.

## Contract

`POST /resolve`

```json
{
  "url": "https://lksfy.com/DigLaHFT",
  "mode": "schemepro-linkshortify"
}
```

Response:

```json
{
  "ok": false,
  "stage": "linkshortify-final",
  "finalUrl": "",
  "blockedBy": "turnstile",
  "steps": [
    {
      "host": "sb1.schemepro.org",
      "step": 1,
      "to": "https://sb1.schemepro.org/example"
    }
  ]
}
```

`blockedBy` should be one of `turnstile`, `captcha`, `expired`, or `unsupported`.

## Resolver Behavior

- Follow the first shortlink redirect with a clean cookie jar.
- Parse SchemePro `tagrget_url` values from HTML and decode them.
- Set or clear `user_step` exactly like the page JavaScript does.
- Stop at final LinkShortify if Turnstile/Captcha is required and no legitimate token is available.
- Never click ad iframes.
