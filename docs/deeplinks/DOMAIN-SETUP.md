# tourkokan.com — deep link setup

Handoff for whoever manages the tourkokan web servers. Everything here is
domain-side; nothing in this document touches the mobile app or the API.

## TWO domains, not one

The app picks its deep-link host from the build flavor, so **both domains need
the same setup**:

| Build | Host | Package |
|---|---|---|
| production (Play Store) | `tourkokan.com` | `com.tourkokan` |
| qa / internal testing | `test.tourkokan.com` | `com.tourkokan` |
| local dev | `test.tourkokan.com` | `com.tourkokan.local` — **cannot verify**, see below |

`qa` and `production` share an applicationId (`com.tourkokan`), so **the same
`assetlinks.json` content works on both hosts** — just serve the identical file
from each domain.

The `local` flavor has applicationId `com.tourkokan.local`, so it can never
satisfy either file. That is expected; local testing uses the `tourkokan://`
custom scheme, which needs no verification.

**Scope: Android only.** iOS is not live yet — see the last section for what it
will add later.

**Nothing here requires an API change.** The backend already accepts and
validates `referral_code` on both register and Google sign-in. The referral code
travels inside the URL and the app reads it from there.

---

## Current state

Checked 2026-09-04:

| URL | Status |
|---|---|
| `https://tourkokan.com/` | `200` — site is up |
| `https://tourkokan.com/.well-known/assetlinks.json` | **`404` — missing** |
| `https://tourkokan.com/invite/TESTCODE123` | **`404` — missing** |
| `https://test.tourkokan.com/.well-known/assetlinks.json` | needs the same file |
| `https://test.tourkokan.com/invite/TESTCODE123` | needs the same page |

Until both exist, every shared referral link lands on a 404.

---

## 1. `/.well-known/assetlinks.json`

**This is what makes the app open instead of the browser.** Android fetches it
when the app is installed and checks the certificate fingerprint. If it matches,
`tourkokan.com/invite/*` links open directly in the app with no "open with…"
chooser.

Serve the **same content** at both:

```
https://tourkokan.com/.well-known/assetlinks.json
https://test.tourkokan.com/.well-known/assetlinks.json
```

Content:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.tourkokan",
      "sha256_cert_fingerprints": [
        "03:0D:2D:B4:8D:28:80:E8:0D:FC:10:D3:A6:B1:B4:3A:EA:B2:D6:0F:8E:53:EA:5B:05:93:21:61:9B:24:9A:53"
      ]
    }
  }
]
```

### ⚠️ The fingerprint above is probably not the one you need

It was generated from `android/app/tourkokan-release.keystore` (the **upload**
key). If the app ships through Google Play with **Play App Signing** — which is
the default — Google re-signs the app with its own key, and Android verifies
against **that** fingerprint instead.

Get the correct value from:

> **Play Console → Release → Setup → App signing → App signing key certificate → SHA-256**

Add it to the `sha256_cert_fingerprints` array. **Keeping both is correct and
recommended** — one matches Play-installed builds, the other matches release
builds installed directly over USB for testing.

### Serving requirements

Each of these breaks verification **silently** — no error, the link just opens in
the browser instead of the app:

- `Content-Type: application/json`
- HTTPS with a valid certificate
- **No redirects.** A 301/302 to the file fails verification.
- Publicly reachable — no auth, no Cloudflare challenge, no geo-blocking
- No `.json` rewrite rules that alter the path

---

## 2. `/invite/{code}` landing page

**This is only ever seen by people who do NOT have the app.** When the app is
installed and verified, Android intercepts the URL before the browser loads
anything, so this page never renders for existing users.

It exists so a referral link isn't a dead end for new users — which is most
recipients of a referral.

### It must be a wildcard route

The code changes on every share, so this cannot be a static file per code:

```
/invite/:code   →   render the page
```

Example URLs that must all resolve:

```
https://tourkokan.com/invite/ABC123
https://test.tourkokan.com/invite/XY_9-z
```

Both hosts need this route.

### What the page should do

The code does not need to be processed server-side — the app already read it out
of the URL that was tapped. The page only needs to exist and send people to the
store.

Recommended Play Store link:

```
https://play.google.com/store/apps/details?id=com.tourkokan&referrer=code%3D{code}
```

The `referrer` parameter survives installation, so you have the option later of
auto-applying the referral code for users who install fresh (via the Play Install
Referrer API). Not required today, but it costs nothing to include now and cannot
be added retroactively.

**Prefer a visible page with a "Continue to Play Store" button over an instant
redirect.** An instant redirect looks broken when it fails, and leaves nowhere to
show the referral context that motivated the tap.

---

## Verifying

### assetlinks.json

```bash
curl -sSI https://tourkokan.com/.well-known/assetlinks.json
curl -sSI https://test.tourkokan.com/.well-known/assetlinks.json
```

Expect `200`, `content-type: application/json`, and **no** `location:` header.

Google's official validator:

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://tourkokan.com&relation=delegate_permission/common.handle_all_urls
```

### On a device, after installing the app

```bash
adb shell pm get-app-links com.tourkokan
```

You want `verified` beside `tourkokan.com`. If it shows `legacy_failure` or
unverified, the fingerprint does not match — almost always the Play App Signing
issue above.

To force a re-check without reinstalling:

```bash
adb shell pm verify-app-links --re-verify com.tourkokan
```

### End to end

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://tourkokan.com/invite/TESTCODE123" com.tourkokan
```

Before verification this shows a chooser dialog; after, it opens the app
directly. Then open Sign Up — the referral field should be prefilled.

---

## Suggested order

1. **`assetlinks.json`** — makes the app open for existing users. Verifiable
   immediately with `pm get-app-links`, independent of the landing page.
2. **`/invite/{code}` page** — fixes the path for new users.

Both are needed before promoting the referral feature, since today the link 404s
for everyone.

---

## ⚠️ Build-time trap: `APP_ENV`, not `ENVFILE`

`@env` values in JS (including `DEEP_LINK_HOST` and `API_PATH`) are inlined by
**react-native-dotenv**, which reads `.env.${APP_ENV}` — see `babel.config.js`.
`ENVFILE` only feeds the NATIVE side via react-native-config. Setting `ENVFILE`
alone does nothing for JS.

Worse, Metro caches transforms by file content, so **changing `APP_ENV` does not
invalidate the cache**. Measured on this repo:

| Command | Host baked in |
|---|---|
| `ENVFILE=.env.production … bundle` | `test.tourkokan.com` ❌ |
| `APP_ENV=production … bundle` (warm cache) | `test.tourkokan.com` ❌ |
| `APP_ENV=production … bundle --reset-cache` | `tourkokan.com` ✅ |

So a machine that built QA and then built production could ship a production
binary pointing at the **test** API and the **test** deep-link host.

The `build:aab:*` / `build:apk:*` scripts and the fastlane lanes set `APP_ENV`
correctly and run `gradlew clean` first. If you ever bundle manually, or after
switching environments on the same machine, add `--reset-cache`.

**Verify before shipping** — check the artifact, not the command:

```bash
unzip -p app-production-release.aab base/assets/index.android.bundle \
  | grep -oE 'https://api[a-z.-]*\.tourkokan\.com/api/' | sort -u
```

---

## Later, when iOS goes live

iOS needs one more file, served from the same domain:

```
https://tourkokan.com/.well-known/apple-app-site-association
https://tourkokan.com/apple-app-site-association          (fallback path)
```

Content is ready in `docs/deeplinks/apple-app-site-association`. Same serving
rules, plus one iOS-specific trap: **the file must have no `.json` extension.**

The `/invite/{code}` page needs no change — add an App Store button alongside the
Play Store one.
