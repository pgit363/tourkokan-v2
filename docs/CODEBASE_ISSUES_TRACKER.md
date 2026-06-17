# Tourkokan-v2 — Codebase Issues Tracker

Single source of truth for the bugs / structural issues found during the
reverse-engineering pass, with a checklist to solve them one by one.

Status: ☐ todo · ◐ in progress · ☑ done · ⏸ deferred (needs decision/QA)

---

## ⏳ REMAINING (deferred by user — surface this when asked "anything remaining?")

**All tracker tasks T1–T10 are done.** Outstanding: device QA only (release build for T4 keystore, airplane-mode toggle for T8, banner visuals for T9, tablet pass for T7).

Non-hot screens still on static `DIMENSIONS` (acceptable — covered by the
`OrientationNotice` portrait nudge): Onboarding, Auth screens, PlaceDetails map,
PrivacyPolicy popup, misc Styles.js entries.

> Done so far: **T1–T10 + Legacy routes**. **Remaining: nothing (QA pending).**

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
- [x] **T7 — Migrate hot screens to `useResponsive`** (🟡) — ✅ ExploreGrid (live cell sizing, 5 columns on tablets, skeletons follow), CityPlaceSearch (live map-card width capped 480dp on tablets + dropdown height), PackageCard/RouteHeadCard/PlaceCard/CityCard (live width, tablet caps). Already clean: CityList, Categories (flex layouts), RoutesList, AllRoutesSearch, HomeScreen, HotPlaces (`useWindowDimensions`/`useResponsive`). QA: tablet + rotation pass on Gallery, city lists, routes, map search.
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
- **Tablet layout polish ✅** (2026-06-12) Per project guideline: **card width must not change** (events + sites pages) — only height. So for **My Sites** (MySubmissions) and **Events** (EventsList) cards: NO width constraint; cards keep phone height (170) and grow **taller** on tablets (image band → 280 via inline `isTablet && {height:280}`) instead of changing width; EventsList image+fallback also unified (was 170/120, jumped). Both image fallbacks now use the shared `Assets/Images/no-image.png` placeholder (were custom gradient+icon). Form/popup pages (not card lists) DO get centered max-width: **HomeScreen mode popup** `modeCard` capped `maxWidth:480`; **Edit Profile** (Profile.js) 640dp + **Help Center** 680dp centered scroll content.
- **Tab bar responsiveness ✅** (2026-06-12) `CustomTabBar` was fully fixed-size (pill 64, FAB 64, icons 26/30, label 10) — tiny on tablets. Refactored to scale via `useResponsive`: pill height, FAB, icon-wrap, icons, label, and FAB image all `ms()`-bumped on tablets; pill width capped at 560dp + centered so 5 tabs don't spread edge-to-edge. Icons now take a resolved pixel size. The taller tablet bar (~133 vs 104dp phone) meant the 5 tab screens' fixed bottom clearances (100–110) could clip the last item — bumped to tablet-aware values (HomeScreen/ExploreGrid/EventsList via live `isTablet`; Categories/MSRTCSearch via static `isTabletDevice()`).
- **Empty-state audit ✅** (2026-06-12) Swept every list/data screen for missing "no data" UI when the API returns `[]`. Two real gaps fixed: **BusRouteList** had no `ListEmptyComponent` (blank screen on empty routes) — wired the already-existing `BUS_ROUTE_SCREEN.NO_ROUTES`/`NO_ROUTES_SUB` keys; **CityList** rendered an infinite skeleton on a genuinely-empty result (skeleton was the empty component, shown even after loading) — now shows skeleton only while `loading`, an offline message when offline, else a proper `NO_DATA` empty state. All other list screens already handle empty (MyEvents, RoutesList, AllRoutesSearch, QueriesList, EventsList, ExploreGrid, Emergency, Inbox, MySubmissions, SearchPlace, CityPlaceSearch, Categories); CityDetails hides empty sections via `length>0` guards; MSRTCSearch delegates to AllRoutesSearch.
- **Tablet font sweep ✅** (2026-06-12) Added `scaleFontSizes()` to `Services/responsive.js` — wraps a StyleSheet's object and moderate-scales every `fontSize`/paired `lineHeight` for the device (phones unchanged; tablets bumped, e.g. 12→16, 18→24). Applied via `StyleSheet.create(scaleFontSizes({...}))` to 31 raw-`<Text>` screens/components that had no responsive hook (ProfileView, QueriesList, SubmitPlace, About, UpdateEvent/CreateEvent, MySubmissions, Profile, MyEvents, RoutesList, HelpCenter, Settings, AllRoutesSearch, CommentsSheet, EventDetail, MSRTCSearch, ContactUs, Categories, SearchPlace, Inbox, BusRouteList, CityDetails, + Common dialogs/sections + Emergency/Auth/CityPlaceSearch style files). GlobalText already scales legacy screens; the earlier per-element `ms()` screens (Home, SiteDetail, EventsList, CityPlaceSearch, cards) were deliberately NOT wrapped to avoid double-scaling. All 31 babel-parse clean.
- **T7 ✅** (2026-06-12) Hot screens/cards now size from `useResponsive`/`useWindowDimensions` (live on rotation, tablet-aware): ExploreGrid grid (3→5 cols on tablet), CityPlaceSearch map carousel + dropdown, PackageCard/RouteHeadCard/PlaceCard/CityCard widths with tablet caps (cards stop ballooning past ~420dp). CityList/Categories/RoutesList/AllRoutesSearch needed nothing (already flex or hook-based).
- **Logging ✅** (2026-06-12) Event-based global logging system — `src/Services/Logger.js` (event bus + sinks, ENV-gated console sink: dev=all, prod=warn/error). Auto-instrumented chokepoints: every screen visit (NavigationContainer in StackNavigator), every API call w/ timing (axios interceptors in CommonServices), every redux action (Store.js middleware), uncaught JS errors (index.js). `installConsoleGate()` no-ops stray console.log/info/debug in production. All `[FLOW]`/`[GATE]` logs migrated to `log.flow()` (dev-only). Conventions: `docs/LOGGING.md`.
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
