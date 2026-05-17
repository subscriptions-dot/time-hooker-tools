# bypass-links Inspection

Inspected release: `amitsingh-007/bypass-links` `v26.05.02`

## What It Is

`bypass-links` is a Chrome extension plus web app monorepo. It uses:

- WXT extension
- React/TypeScript popup
- Firebase authentication
- tRPC API
- Firebase Realtime Database
- Vercel-hosted web app

## Important Finding

The shipped extension does not contain a universal shortlink bypass engine like Time Hooker.

Its automatic navigation feature works from stored redirection rules:

```text
current URL -> lookup local mappedRedirections -> chrome.tabs.update(final URL)
```

Those rules are synced from Firebase after login:

```text
extension login -> Firebase ID token -> /api/trpc -> redirectionsGet -> local storage
```

The README says new signups are not open, so a fresh user may not be able to sync rules.

## Why Login Cannot Simply Be Removed

Removing the login button would not unlock the private data. The useful shared redirect rules live behind Firebase/tRPC protected procedures. Without a valid Firebase account/token, the API returns unauthorized.

The safe no-login alternative is local-only rules. That is why this repo includes `extensions/local-link-resolver`.

## Reusable Ideas

- Store normalized URL rules locally
- Redirect from the background service worker
- Keep exact source-to-final mappings instead of guessing
- Let Time Hooker handle timer pages, and let local rules handle known repeated final links

## Not Reused

- Firebase login
- Private backend data
- Protected API calls
- Account sync
