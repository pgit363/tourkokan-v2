# Tourkokan-v2 — Codebase Issues Tracker

Single source of truth for the bugs / structural issues found during the
reverse-engineering pass, with a checklist to solve them one by one.

Status: ☐ todo · ◐ in progress · ☑ done · ⏸ deferred (needs decision/QA)

---

## ⏳ REMAINING (deferred by user — surface this when asked "anything remaining?")

1. **T7 — Migrate hot screens to `useResponsive`** (tablet/rotation) — replace module-load `Dimensions.get()` snapshots with the `useResponsive()` hook in ExploreGrid, CityPlaceSearch, CityList, Categories, RoutesList, AllRoutesSearch, Cards. Mitigated meanwhile by the global `OrientationNotice` overlay (landscape → "please rotate" popup).

> Done so far: **T1–T6 + T8 + T9 + Legacy routes + T10**. **Remaining: T7 only.**

---

> Caveat: findings are from static analysis; items marked **QA** must be tested
> on device before considering fully closed.

---

## Task checklist

- [x] **T1 — Global ErrorBoundary** (🔴 crash safety) — ✅ `Components/Common/ErrorBoundary.js` wraps app in `App.js`
- [x] **T2 — Normalize all `mode` storage reads to `STRING.STORAGE.MODE`** (🟠) — ✅ 13 files converted, 6 imports added, 0 `t('STORAGE.MODE')` left
- [x] **T3 — Harden API response access (`res?.data?.success`)** (🔴) — ✅ 12 `.success` files optional-chained (guards + message/data chains)
- [x] **T4 — Move Android release keystore creds out of `build.gradle`** (🔴) — ✅ git-ignored `android/keystore.properties`; QA: run a release build to confirm signing
- [x] **T5 — Add logging to silent `catch {}` blocks** (🟠) — ✅ 37 single-line empty catches → `console.warn("[caught]", e)` across 20 files (multi-line + `.catch(()=>{})` left as intentional)
- [x] **T6 — Mark dead files** (🟡) — ✅ 12 dead files **renamed `-unused`** (not deleted); `LangSelection` import commented. ⏸ Registered-but-unreachable *routes* (CategoryProjects/ProjectList/ProjectDetails/StopList/SearchList/Explore/BusTimings/AuthScreen/SignIn) still wired in navigators — awaiting your OK to mark those too.
- [ ] **T7 — Migrate hot screens to `useResponsive`** (🟡 tablet/rotation)
- [x] **T8 — Sweep NetInfo-fetch + async-effect-cleanup antipattern** (🟠) — ✅ all 19 NetInfo consumers audited; 6 confirmed cases fixed with the HomeScreen-style connectivity-change guard (`wasConnected` dedupe): ExploreGrid (also: `fetchData(1,true)` was invoked instead of passed as callback to `dataSync`), MapScreen (also: `setOffline(false)` ignored actual state; latent `JSON.parse(array)` crash), ProfileView, Categories (+`isMounted` added), CityList (+duplicate mount fetch from `route.params` effect deduped), QueriesList. Clean (listener only sets offline flag or one-shot `NetInfo.fetch`): EventsList, CityPlaceSearch, SiteDetailPage, Profile, CityDetails, useConnectivityGate; Emergency/MSRTCSearch/ContactUs/RoutesList/AllRoutesSearch/SearchPanel/ChangeLang have no listeners. QA: revisit each fixed screen on device, toggle airplane mode to verify refetch-on-reconnect.
- [x] **T9 — Review `Banner` resizeMode (`stretch` → cover/contain)** (🟡) — ✅ hero-banner default `stretch`→`cover` in `Banner.js` (callers can still override via the `resizeMode` prop); onboarding intro image `stretch`→`contain` in `Screens/Styles.js` (collage has place-name labels at the edges — must not crop; bands blend with white slides). QA: eyeball home hero, detail-page banners, and intro slides on phone + tablet for unwanted cropping.
- [x] **Legacy routes** — ✅ 9 screens renamed `-unused` + navigator imports/registrations commented (CategoryProjects, ProjectList, ProjectDetails, StopList, SearchList, Explore, BusTimings, AuthScreen, SignIn)
- [x] **T10 — API error contract** (🟠) — ✅ `comnGet/comnPost/comnPostForm/comnPut/comnDel` now return `{data:{success:false,...serverError}, status, error}` via `buildErrorResponse()` instead of the raw `Error`. Broader unguarded `res.data.data` reads are now safe (res.data always defined).

---

## Issue details

### T1 — No global Error Boundary 🔴
A render/throw anywhere white-screens the whole app (no recovery). Combined with
T3 (API returning Error objects), a network failure can crash users.
**Fix:** add an `ErrorBoundary` component wrapping the navigators in `App.js`.

### T2 — `mode` read 3 ways 🟠
`t('STORAGE.MODE')` (13 files), `STRING.STORAGE.MODE` (7), literal `'mode'` (2).
All resolve to `'mode'` today, so the entire online/offline system depends on the
en/mr translation never drifting. One typo → offline mode breaks silently.
**Fix:** always read/write via `STRING.STORAGE.MODE`.

### T3 — Unsafe API response access 🔴
`comnPost`/`comnGet` return the **Error object** on failure (`return err`). 15 call
sites do `res.data.success` without optional chaining → `TypeError` on network
failure. **Fix:** `res?.data?.success` + sensible fallback at each site.

### T4 — Committed signing secrets 🔴
`android/app/build.gradle` has plaintext keystore passwords + an absolute
`storeFile` path. **Fix:** read from git-ignored `gradle.properties`/env.

### T5 — 47 silent `catch {}` 🟠
Failures vanish (no log/feedback), making bugs hard to diagnose.
**Fix:** at least `console.warn` in live-screen catches.

### T6 — Dead code 🟡
~12 dead screen files + ~9 unreachable routes (see
`ARCHITECTURE_REVERSE_ENGINEERING.md` §7). **Fix:** remove after confirming the
Projects/old-Stops/Explore/SearchList features are retired.

### T7 — Dimensions snapshot 🟡
Many screens read `Dimensions.get()` at module load (no rotation/tablet support).
**Fix:** migrate hot screens to `useResponsive`.

### T8 — NetInfo-fetch antipattern 🟠
Fetches wired to `NetInfo` events + cleanup returned from async effects caused the
3× landing-call + leaked-listener bug (fixed in HomeScreen). **Fix:** sweep for
the same pattern elsewhere.

### T9 — Banner stretch 🟡
Fixed-height heroes use `resizeMode: 'stretch'` → distortion on mismatched aspect.

### T10 — API error contract ⏸
Ideally `comnPost`/`comnGet` return a consistent `{success:false,error}` shape (or
throw) instead of an `Error`. Wide blast radius → schedule as its own change with
full QA. Mitigated for now by T1 + T3.

---

## Progress log
- **T9 ✅** (2026-06-11) Hero banners now `cover` (proportional fill + crop) instead of `stretch`; onboarding intro art now `contain` (its edge labels must survive). Explicit `resizeMode` props still win.
- **T8 ✅** NetInfo-fetch sweep (2026-06-11). Pattern applied: track `wasConnected` inside the effect; on each NetInfo event compute `changed = wasConnected !== connected`; skip fetch unless first event or genuine reconnect; clear loaders and bail when offline. Fixed: ExploreGrid, MapScreen, ProfileView, Categories, CityList, QueriesList (details in checklist). Side fixes: ExploreGrid passed an invoked promise instead of a callback to `dataSync`; MapScreen hardcoded `setOffline(false)` and could `JSON.parse` a non-string; CityList double-fetched on mount via the `route.params` effect.
- **T1 ✅** Added `ErrorBoundary` (logs to console; hook Crashlytics later) wrapping both render branches in `App.js`.
- **T2 ✅** All `mode` reads/writes now use `STRING.STORAGE.MODE` (constant) instead of `t('STORAGE.MODE')` (translation). Removes the translation-drift landmine.
- **T3 ✅** `res?.data?.success` + optional-chained `message`/`data` chains across the 12 files that had `.success` guards. Remaining non-`.success` `res.data.data` reads tracked under T10.
- **T4 ✅** Secrets moved to git-ignored `android/keystore.properties`; `build.gradle` loads them; release keystore binary was already git-ignored. **Verify with a release build.**
- **T5 ✅** Single-line empty catches now log via `console.warn("[caught]", e)` (20 files). Promise `.catch(()=>{})` and multi-line empty catches left untouched (often intentional/benign).
- **T6 ✅** 12 unused files renamed with `-unused` suffix (history preserved via `git mv`); `LangSelection` import commented out in `StackNavigator.js`. Renamed list: Advertise, Food, Pricing, Weather, SearchScreen, Place_catDetails, Place_catList, "Categories copy", LoginComponents/{EmailOtp,EmailPassword,LoginChoice}, LangSelection.
- **Legacy routes ✅** 9 unreachable screens renamed `-unused`; navigator imports + `<Stack.Screen>` registrations commented out; verified no live navigation/import references them. Files: CategoryProjects, ProjectList, ProjectDetails, StopList, SearchList, Explore, BusTimings, AuthScreen, SignIn.
- **T10 ✅** Added `buildErrorResponse(err)` in `CommonServices.js`; all 5 request helpers return it on failure (preserves server `message`/validation, guarantees `success:false`). Removed debug `console.log`s from `comnPost`. `login()` stub left as-is. Callers using `res?.data ?? res?.response?.data` keep working (server body now lives in `res.data`).
- _Remaining: T7 (useResponsive), T8 (NetInfo sweep), T9 (Banner resizeMode)._
</content>
