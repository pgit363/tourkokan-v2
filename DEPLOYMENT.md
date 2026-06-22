# Tourkokan Mobile — Android Build & Play Store Deployment

This is the single reference for building the app per environment and shipping it
through the Google Play Store testing/production tracks.

---

## 1. The mental model: 4 independent axes

| Axis | Values | Decided by |
|------|--------|-----------|
| **Git branch** | `dev` → `test` → `master` | Where the code lives / promotion stage |
| **Build flavor** | `local`, `test`, `production` | Which `.env*` file is baked in |
| **Backend env** | localhost · api-test · api-prod | The flavor's `.env*` file |
| **Play Store track** | internal · closed · open · production | Who Google delivers the build to |

The key insight: **build flavor ≠ Play track.** You build the `test` flavor once
and push it through internal → closed → open. You build the `production` flavor and
push it to the production track. The *same* uploaded artifact can be **promoted**
between tracks in the Play Console without rebuilding.

```
 git branch        build flavor        backend                 Play Store track
 ─────────         ────────────        ───────                 ────────────────
 dev        ─────► local        ─────► localhost:8000          (not published — local dev only)
 test       ─────► qa           ─────► api-test.tourkokan.com  internal / closed / open
 master     ─────► production   ─────► api.tourkokan.com        production
```

---

## 2. Environments & flavors

The flavor automatically selects its `.env` file via `react-native-config`
(wired in `android/app/build.gradle` → `project.ext.envConfigFiles`). You do **not**
pass `ENVFILE` manually anymore.

| Flavor | `.env` file | Backend | applicationId | Installs beside prod? |
|--------|-------------|---------|---------------|----------------------|
| `local` | `.env` | `localhost:8000` | `com.tourkokan.local` | ✅ yes (suffixed) |
| `qa` | `.env.development` | `api-test.tourkokan.com` | `com.tourkokan` | ❌ same listing as prod |
| `production` | `.env.production` | `api.tourkokan.com` | `com.tourkokan` | ❌ — it *is* prod |

> The QA/test flavor is named **`qa`** (not `test`) because Android Gradle reserves
> flavor names starting with `test`. The npm scripts still use `:test` for convenience
> (e.g. `npm run build:aab:test` builds the `qa` flavor → `bundleQaRelease`).

Notes:
- `local` has a `.local` package suffix so a developer can keep the real Play Store
  app installed at the same time. It uses `android/app/src/local/google-services.json`.
  Firebase push (FCM) is not expected to work on the `local` build — that's fine.
- `test` and `production` share `com.tourkokan` = **one Play Console listing**, so a
  test build delivered via the internal track replaces the user's prod install. This
  is what keeps the versionCode sequence continuous (…51 prod, 52 test, 53 prod, …).
- **Android host address for `local`:** the emulator cannot reach your machine's
  `localhost`. Use `http://10.0.2.2:8000` for the Android emulator, `localhost` for
  iOS simulator, or your LAN IP for a physical device. Edit `.env` accordingly.

### Archived env values
All old/unused backend configs were moved out of the `.env*` files into
`env-archive.txt` (git-ignored). Copy a block back into the relevant `.env*` file if
you ever need it.

---

## 3. Versioning

Version is the single source of truth in **`android/version.properties`**, read by
`build.gradle`. Never edit `versionCode`/`versionName` inside `build.gradle`.

```properties
VERSION_CODE=52     # MUST strictly increase on every Play upload (any track)
VERSION_NAME=2.0.4  # human-facing; bump on user-visible releases
```

> 51 was already shipped to production, so the next upload is **52**. The same
> sequence is shared across all tracks of the `com.tourkokan` listing.

Bump it with the helper script:

```bash
npm run version:show              # print current values
npm run version:code              # versionCode += 1
npm run version:code 60           # set versionCode = 60
npm run version:name -- 2.1.0     # set versionName = 2.1.0
```

> **`versionCode` is bumped automatically** by `build:aab:test`, `build:aab:prod`
> (and the fastlane lanes) — they run `version:code` before Gradle so the AAB
> carries the new code. You only need to call `version:code` manually if you want
> to bump without building. `versionName` is never auto-changed.
>
> Note: every `build:aab:*` increments the code even if you don't upload the
> result (e.g. a failed/abandoned build). Gaps in the sequence are harmless —
> Play only requires each upload to be strictly higher than the last.

---

## 4. Git branch strategy

| Branch | Purpose | Build you run from it |
|--------|---------|-----------------------|
| `dev` | day-to-day development | `npm run android:local` |
| `test` | QA / what's on the testing tracks | `npm run build:aab:test` |
| `master` | production / what's live | `npm run build:aab:prod` |

The code is identical across branches — they are **promotion stages**, not different
apps. Flow: merge `dev → test` when ready for QA, then `test → master` when QA passes.

```bash
git checkout test && git merge dev      # promote to QA
git checkout master && git merge test   # promote to production
```

---

## 5. Build & run commands

### Local development
```bash
npm start                 # Metro bundler (keep running)
npm run android           # alias of android:local
npm run android:local     # localDebug  -> localhost
npm run android:test      # testDebug   -> api-test  (debuggable, for inspecting)
npm run android:prod      # productionDebug -> api-prod
```

### Release artifacts (signed with the upload key)
```bash
npm run build:aab:test    # -> app/build/outputs/bundle/testRelease/app-test-release.aab
npm run build:aab:prod    # -> app/build/outputs/bundle/productionRelease/app-production-release.aab
npm run build:aab         # alias of build:aab:prod

npm run build:apk:test    # APK for direct sideloading to QA devices
npm run build:apk:prod
```

> Release signing comes from `android/keystore.properties` (git-ignored). With Play
> App Signing enabled (recommended), this is your **upload** key; Google holds the
> real app signing key. Back up both the keystore and `keystore.properties` securely.

---

## 6. Play Store tracks — what each is for

| Track | Audience | Review | Typical use |
|-------|----------|--------|-------------|
| **Internal** | up to 100 testers by email; live in minutes | none | your team, fast smoke test |
| **Closed** | named testers / Google Groups | light | controlled external beta |
| **Open** | anyone with the opt-in link | full | public beta |
| **Production** | all users; staged rollout supported | full | the real release |

Promotion path: **Internal → Closed → Open → Production** (promote in the Console, or
use the fastlane `promote_*` lanes).

---

## 7. Releasing — step by step

### A. First-time Play Console setup (once)
1. Create the app `com.tourkokan` in the Play Console (already done — app is live).
2. Enable **Play App Signing**.
3. Complete store listing, content rating, data safety, target audience, privacy policy.
4. Create your internal tester list (emails).

### B. Every release
```bash
# 1. Make sure you're on the right branch & code is merged
git checkout test            # (or master for production)

# 2a. Manual upload (no fastlane key yet) — versionCode auto-bumps:
npm run build:aab:test       # then upload the .aab in Play Console → Internal testing
#  ...QA validates via the internal opt-in link...
#  ...promote that release up the tracks in the Console UI...

# 2b. Or automated with fastlane (after key setup, see §8):
npm run deploy:internal      # bump + build test AAB + upload to internal
```

### C. Going to production
```bash
git checkout master && git merge test
npm run build:aab:prod       # auto-bumps, then build → upload to Production track (10% → 50% → 100%)
# or: npm run deploy:production
```

---

## 8. Fastlane automation (optional)

Config lives in `android/fastlane/` (`Appfile`, `Fastfile`). Lanes:

| Command | What it does |
|---------|--------------|
| `npm run deploy:internal` | build `test` AAB → upload to **internal** (draft) |
| `npm run deploy:closed` | build `test` AAB → upload to **closed** (alpha) |
| `npm run deploy:open` | build `test` AAB → upload to **open** (beta) |
| `npm run deploy:production` | build `production` AAB → upload to **production** (10% draft) |
| `bundle exec fastlane promote_internal_to_closed` | promote, no rebuild |
| `bundle exec fastlane promote_closed_to_open` | promote, no rebuild |
| `bundle exec fastlane promote_open_to_production` | promote, no rebuild |

### One-time key setup
1. Install fastlane: from repo root, `bundle install`.
2. In **Google Cloud Console** (linked to your Play account): create a **service
   account**, create a **JSON key** for it, download it.
3. In **Play Console → Users and permissions**: invite that service-account email and
   grant it release permissions (at least "Release to testing tracks" / "Release to
   production").
4. Save the JSON at **`android/fastlane/play-store-key.json`** (already git-ignored).
   In CI, instead set the `PLAY_STORE_JSON_KEY` env var to its path.
5. Verify: `cd android && bundle exec fastlane run validate_play_store_json_key`.

> Closed/open track names default to `alpha`/`beta`. If you created custom track
> names in the Console, update them in `android/fastlane/Fastfile`.

---

## 9. Quick reference

```bash
# version
npm run version:show
npm run version:code

# run
npm run android:local | android:test | android:prod

# build AAB
npm run build:aab:test
npm run build:aab:prod

# deploy (after fastlane key setup)
npm run deploy:internal | deploy:closed | deploy:open | deploy:production
```
