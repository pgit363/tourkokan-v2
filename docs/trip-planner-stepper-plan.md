# AI Trip Planner — Stepper Flow: Plan & Status

Turning the single-page planner form into a multi-step flow where the traveller
picks their own places — browse → select → arrange → review → plan — instead of
handing every choice to the AI.

The map screen keeps its own "Add to my trip" (it writes to the same cart), but
place-picking must **also** live inside the planner flow, which is what this
document plans.

Design artboards: Artifact `7h8Rp1Tm6gBQb6CUGWgYmo`.

---

## Status legend
`⬜ Not started` · `🟡 In progress` · `✅ Done` · `⛔ Blocked` · `♻️ Already built (reuse)`

## Module status board

| # | Module | Layer | Status | Est. |
|---|--------|-------|--------|------|
| B0 | Cart CRUD (add / remove / **reorder**) + `planFromCart` + credits | backend | ♻️ Already built | — |
| B1 | `POST v2/trip/places` — browse by towns[] + categories[] | backend | ✅ Done | — |
| B2 | `updateCart` persists `filters` + `planFromCart` honours them | backend | ✅ Done | — |
| M0 | Map screen place-picking (add / in-trip / cart badge) | app | ✅ Done, verified on device | — |
| M1 | Step 1 — Where & what (split out of PlanTripScreen) | app | ✅ Done, verified on device | — |
| M2 | Step 2 — Pick places (list + map toggle, filtered) | app | ✅ Done, verified on device | — |
| M3 | Step 3 — Arrange selected places | app | ✅ Done, verified on device | — |
| M4 | Step 4 — Review → `planFromCart` | app | ✅ Done, verified on device | — |
| M5 | Step chrome (progress, back/next, state, entry points) | app | ✅ Done (completed by M4's wiring) | — |
| M6 | i18n en + mr sweep + device verification | app | ✅ Done, verified on device in both languages | — |

**Total remaining: none on this plan.** Not yet done, and outside it: iOS
verification, and one happy-path run of the stepper by a verified user with
credits (see "What landed with M4").

> Keep this table the single source of truth for progress.

---

## Why this is cheaper than it looks

The backend was built for this flow and is roughly 90% ready. Nothing below
needs writing:

- **`CandidateFetcher::aroundMany(anchors[], categoryCodes[], radiusKm)`** —
  the exact multi-town + multi-category query step 2 needs. It is also what the
  planner itself uses, so a browse list built on it can never offer a place the
  planner then refuses to plan around.
- **`CandidateFetcher::project(Collection $sites)`** — the API shape.
- **`QuoteTripRequest`** already validates `town_site_ids[]` + `category_codes[]`.
  The browse request is a trim of it.
- **`reorderCart`** — route, `TripServices.reorderCart`, and the
  `useTripCart().reorder` hook all exist. **No screen calls it yet**, so the
  arrange step is pure UI on finished plumbing.
- **`TripPlanner::planFromCart`** already honours cart order
  (`$this->cart->contents($trip)`), reads `$trip->filters` for `category_codes`
  and `radius_km`, fills gaps around the picked places via
  `CandidateFetcher::nearby`, and handles the credit spend **and refund on
  failure**.
- **`saved_trips.filters`** is an existing JSON column (`'filters' => 'array'`).

Because the map screen writes to the same cart, a place added there already
appears in steps 2–4 with no extra work.

---

## The flow

```
Step 1  Where & what      towns[] + interests[]        (split out of PlanTripScreen)
Step 2  Pick places       filtered list + map toggle   (new — uses B1)
Step 3  Arrange           ordered list, reorder()      (new — plumbing exists)
Step 4  Review            everything + credit cost     (new — from TripCartScreen)
        ↓
        planFromCart → ItineraryScreen
```

`min_cart_places` is **3** (`AiConfig`). Step 2 must say so up front, and the
review CTA stays blocked until it is met.

---

## What landed with M1

`src/Components/Trip/StepChrome.js` — `Section`, `Chip` and `Choice` were
declared *inside* PlanTripScreen; four step screens each re-declaring a chip is
how two of them end up subtly different. They are shared now, and the one-page
form imports them from here too, so there is one chip in the app. `StepHeader`
(progress line, not tappable — a step depends on the one before it) and
`StepFooter` (primary action blocked *with a reason*) are the stepper's own,
which is most of M5.

`src/Screens/TripWhereScreen.js` — step 1. The answers are saved to the trip
via `updateCart`, not carried in route params or Redux, because `planFromCart`
reads them off the trip. That also makes the flow resumable: the screen
prefills from `cart.filters` on re-entry.

**`cart` now returns `filters`** (backend). Without it the stepper could not be
resumed — step 1 had nothing to prefill from.

**Both entry points are on Home**: "Plan a trip" opens the stepper, "Let the AI
choose" opens the one-page form. That was decision 2.

Verified on device, against the local backend: 8 towns, live interest counts,
"29 places to choose from" from the free quote, and the filters landing on the
trip row.

## What landed with M2

`src/Screens/TripPickScreen.js` — the list from `trip/places`, a map toggle,
a name search, and the progress counter.

- **List and map are two views of one set.** Toggling does not refetch; it
  draws the same places as markers, so the count cannot differ between them.
  Verified: the footer reads "3 places — ready to arrange" in both.
- **Search filters locally.** The server already sent everything in range, so
  a request per keystroke would be slower and no more accurate.
- **The minimum comes from the server.** A browse response refreshes
  `minimum`, so step 2's counter and the cart footer cannot disagree.
- `src/Components/Trip/AddToTripButton.js` carries over the lesson M0's
  verification produced: the spinner is not decoration, because `toggle`
  drops a tap while a request is in flight and a slow reply otherwise reads as
  a dead button. One component because `useInTrip` is keyed per site id.

**Markers say what they are.** `src/Components/Trip/PlaceMarker.js` draws a
category glyph and a short name instead of a red pin, because a row of
identical pins means tapping each one to find out whether it is a beach or a
fort. The name is trimmed from both ends — `"Shree Dev Kunkeshwar Mandir"` →
`"Kunkeshwar"`, `"Vengurla Beach (Ubhadanda)"` → `"Vengurla"` — since this
dataset puts the identifying part in the middle and truncating would have given
`"Shree Dev Kunkes…"`. Nothing is dropped if under three characters would
remain, so `"Vetalgad"` survives whole. `tracksViewChanges` is released after
the first paint; left on, sixty custom markers redraw every frame and the map
cannot be panned. MapScreen still uses default pins and could take this too.

Known: labels overlap in a dense cluster (Malvan's beaches). Clustering or
hiding labels below a zoom threshold would fix it; not done.

## What landed with M3

`src/Screens/TripArrangeScreen.js` — the picked places in the order they will
be visited, with a position badge, up/down arrows and a remove button.

- **Arrows, not drag** (decision 1). Dragging needs another native dependency
  interacting with gesture-handler and reanimated on this app's paper
  architecture; arrows cannot break, and the list can be swapped for a
  draggable one later without touching anything else on the screen.
- **The move is applied locally, then replaced by the server's view.** The row
  answers the tap at once, and a rejected reorder snaps back to the truth on
  its own rather than lingering as a lie.
- Verified on device: moving Tarkarli Beach down renumbered the list, and
  `favourites.sort_order` for the open trip came back `Rajkot Fort, Tarkarli
  Beach, Chivla Beach` — so `planFromCart` will read that order.
- Fixed while verifying: `GlobalText` centres by default, so a name filling a
  `flex: 1` column was centred. Step 2's category line had it too.

## What landed with M4

`src/Screens/TripReviewScreen.js` — the checkout: towns, interests, days and
the places in step 3's order, each block with a "Change" that walks back to
the step that owns it, then one button that makes the plan.

- **The screen existed but was never reachable.** It was written, and step 3
  already navigated to `SCREEN.TRIP_REVIEW`, but it was never imported or
  registered in `StackNavigator`, and its nine `STEP4_*` strings were missing
  from both `en.json` and `mr.json`. That is what M4 actually was.
- **It does not generate.** The button hands `tripId` to `ItineraryScreen`,
  which stays the single place a plan is ever made — so the generating UI, the
  refusals and the "nothing was charged" reassurance live in one screen.
- Fixed while verifying: the days block was labelled with a new `STEP4_DAYS`
  that duplicated the existing `HOW_MANY_DAYS`, and rendered its value with
  `DAY_N` — so a field asking *how many* answered "Day 2" instead of "2 days".
  Now uses `HOW_MANY_DAYS` with the `ONE_DAY`/`DAYS_WORD` pair that
  `PlanTripScreen` already uses, and the duplicate key is gone.
- Verified on device, the whole stepper in one walk: Home → step 1 (Malvan,
  Fort + Beach, "29 places to choose from") → step 2 (`v2/trip/places` 200,
  four ticked) → step 3 → review. Review showed Malvan, Beach + Fort, "2
  days", the four places in order; "Change" on *Where* returned to step 1; and
  "Make my plan" navigated to `Itinerary`, which called `planFromCart` (200)
  and rendered its refusal.
- The refusal seen was "Save your trip first" — the local DB's user is an
  unverified guest, not an M4 fault. **The happy path, a plan generated from
  the stepper, is still unverified** and needs a verified user with credits.

## What landed with M6

An i18n sweep of the whole app, then a walk of the stepper in both languages.

**The stepper's own strings were already complete** — no screen had a missing
key, no hardcoded user-facing literal (18 files scanned for `text` /
`placeholder` / `accessibilityLabel` / `title` props, bare JSX text and
`Alert`/`Toast` literals), and every `TRIP.*` value is genuinely translated.
The two real bugs were elsewhere.

**1 · Marathi place names with English categories.** Step 2 and step 4 printed
"Beach" and "Fort" beneath Marathi place names — step 4 showing
"समुद्रकिनारा" as an interest chip and "Beach" in the row underneath, on the
same screen. Three causes, all fixed:

- `CandidateFetcher` eager-loaded `categories:id,name,code`, so `mr_name` was
  never selected. `Category::getNameAttribute` falls back to English when
  `$this->mr_name` is empty, and an unselected column is empty — so the
  accessor's Marathi path could never fire on any trip query. Fixed in all
  three selects.
- `present()` sent only `code` and `name` per category, unlike the site beside
  it and unlike `interestOptions()`, which both send `mr_name` too. It now
  sends both, with `name` as `getRawOriginal` so the field is unambiguous.
- Seven screens each re-implemented `.map(c => c.name)`. They now share
  `categoryNames(place)` in `src/Services/trip.js`, so the rule lives in one
  place: TripPick, TripArrange, TripReview, TripCart, TripContacts,
  TripStopDetail and Map.

  Worth knowing: a **place** name is localised server-side (the `Site`
  accessor keys on the user's stored `language`, which Settings syncs on
  switch), while a **category** name is now picked app-side from `mr_name`.
  The app-side pick is the more robust of the two — it still reads correctly
  if that sync fails.

**2 · A location alert that printed its own key names.** `SignUp` calls
`ALERT.LOCATION_REQUIRED`, `ALERT.ENABLE_LOCATION_SERVICES` and
`ALERT.OPEN_SETTINGS`. The first two existed only in `mr`; the third existed
in `mr` as `"OPEN_SETTINGS:"` — with a trailing colon, so it never resolved in
either language. An English user saw "ALERT.LOCATION_REQUIRED" as the alert
title. Added to `en`, colon dropped in `mr`.

`en.json` and `mr.json` now hold 1176 keys each across 123 namespaces with no
asymmetry.

### Deliberately left alone

Three things the audit flags that must **not** be "fixed":

- `STORAGE.SELECTED_CITY_ID` / `_NAME` (HomeScreen) resolve to the literal
  strings `"STORAGE.SELECTED_CITY_ID"` / `"STORAGE.SELECTED_CITY_NAME"`, and
  those literals are the **AsyncStorage keys in production**. Adding the keys
  would repoint every reader and silently orphan every user's saved city.
- `SCREEN.HELP_CENTER` (StackNavigator) resolves to a literal, making that
  stack route inert; the drawer registers its own working `HelpCenter`. Adding
  the key would create the same route name in two navigators and could change
  which one opens. The name is never shown to anyone.
- `MARKETPLACE.LEAD_` is a false positive — a dynamic key
  (`t('MARKETPLACE.LEAD_' + type.toUpperCase())`); all four variants exist.

### Verified on device

The stepper walked end to end in **Marathi** (कुठे आणि काय → ठिकाणे निवडा →
क्रम लावा → सहलीचा आढावा, with "किती दिवस? / 2 दिवस" and "माझी आखणी करा"),
then switched back to **English** and walked again. Both read correctly, place
and category names included.

---

## B1 · `POST v2/trip/places`

New browse endpoint. ~60 lines.

- Request: `BrowsePlacesRequest` — a trim of `QuoteTripRequest`
  (`town_site_ids[]`, `category_codes[]`, `radius_km`, plus `search` / paging).
- Body: `CandidateFetcher::aroundMany(...)` → `project(...)`.
- Why not extend `v2/sites`: that endpoint takes a **single** `category` code
  and a **single** `parent_id`, its validation is already convoluted, and many
  screens depend on it. Extending it to arrays risks all of them.

## B2 · `updateCart` accepts `filters`

So the step-1 answers survive to the plan. ~20 lines.

- Add `filters` to `UpdateCartRequest::rules()` and persist in `TripCart`.
- **Check while doing it:** `planFromCart` reads `category_codes` and
  `radius_km` out of `$trip->filters`, but `town_site_ids`, `stay` and
  `arrival` are currently only consumed on the filters path. `TripPlanner::run(
  ... filters:)` may need a small merge so the stepper's answers are not
  silently dropped.

---

## Decisions taken (2026-11-02)

1. **Up/down arrows for step 3** — no new dependency, nothing to break on the
   paper architecture. Drag stays a later swap of the list component.
2. **Both paths stay** — the one-page form is the express "let the AI pick
   everything" route; the stepper is "pick your own". Two entry points.
3. **Live progress counter for the minimum** — a persistent
   "1 of 3 minimum — add 2 more", becoming "3 places — ready to arrange".
   Never blocks silently; matches the cart footer's existing wording.

<details>
<summary>The original framing of those three</summary>

1. **Drag-reorder vs up/down arrows.** Drag needs
   `react-native-draggable-flatlist`, which means `--legacy-peer-deps` and a
   gesture-handler/reanimated interaction on RN 0.78 **paper** architecture
   (`newArchEnabled=false`). Arrows cost nothing and cannot break.
   **Recommendation: ship arrows first**, add drag later if wanted.
2. **Does the one-page form stay?** If the stepper replaces it, the filters-path
   `planTrip` becomes dead code — but that is also the "let the AI pick
   everything" path, which is faster for someone who does not want to browse.
   **Recommendation: keep both** — express vs. pick-your-own.
3. **Minimum 3 places** gates the review CTA. Confirm the copy for how step 2
   communicates it.

</details>

---

## Repo state at handoff (2026-11-02)

### Mobile — `/Users/pranavkamble/Documents/tourkokan-v2`, branch `test`
**Nothing committed.** 15 modified + 6 new screens in the working tree:

```
M  src/Navigators/StackNavigator.js      M  src/Services/Api/CommonServices.js
M  src/Reducers/tripSlice.js             M  src/Services/Api/TripServices.js
M  src/Screens/AuthScreens/Email.js      M  src/Services/Constants/STRINGS.js
M  src/Screens/AuthScreens/Styles.js     M  src/Services/trip.js
M  src/Screens/ItineraryScreen.js        M  src/localization/translations/en.json
M  src/Screens/MapScreen.js              M  src/localization/translations/mr.json
M  src/Screens/PlanTripScreen.js         ?? src/Screens/AddFromLinkScreen.js
M  src/Screens/ProfileView.js            ?? src/Screens/MyTripsScreen.js
M  src/Screens/TripCartScreen.js         ?? src/Screens/SampleTripScreen.js
                                         ?? src/Screens/TripContactsScreen.js
                                         ?? src/Screens/TripLegScreen.js
                                         ?? src/Screens/TripStopDetailScreen.js
```

### Backend — `/Users/pranavkamble/Documents/tourkokan-backend`, branch `test`
Clean at **`42ee93b`**.

⛔ **api-test is still on `f0dab8e` — one commit behind.** Confirmed by probe:
`trip/resolveMapLink` and `trip/addCustomStop` (added in `42ee93b`) both return
**405**, while `trip/myTrips` returns 401. **`42ee93b` needs deploying** before
`AddFromLinkScreen` can work.

---

## What was finished just before this handoff

**Map screen (M0) — verified on device, all of it:**

| Element | Result |
|---|---|
| Category chips (All / Temple / Fort / Beach / Dam / WaterFall…) | ✅ active state, refetches `v2/sites` |
| Interactive map + markers | ✅ |
| Place card on marker tap | ✅ |
| "+ Add to my trip" | ✅ cart 1 → 2 |
| "✓ In your trip" | ✅ |
| "View my trip N" bar + badge | ✅ |
| "See a sample trip" bar when cart empty | ✅ |

Chips are built from the planner's own `questionSet` interests, **not** a
hardcoded list — a filter must never offer a category the planner cannot plan
around.

Two fixes this verification produced:
- The map never loaded the cart (`questionSet` + `v2/sites` but no `trip/cart`),
  so `cartCount` was always 0 and the bar could never show "View my trip".
  Added `useTripCart().refresh` to the mount effect.
- The card's add button was `disabled={pending}` but looked identical while in
  flight. `useInTrip.toggle` drops any tap while a request is outstanding, so a
  slow reply read as a dead button. It now shows a spinner and dims.

Credits for the test user read **99999 free plans left**.

---

## Verification gotchas (these cost hours — read before testing on device)

1. **`adb exec-out screencap -p` WORKS.** Use it as the primary way to verify
   UI. Scale with `sips -Z 900 shot.png --out small.png`; the device is
   1344×2992, so multiply coordinates read off a 900-tall image by **3.3244**.
2. **`uiautomator dump` is the unreliable one.** On any continuously animating
   screen (the Google map, an `ActivityIndicator`) it exits 1 with
   `ERROR: could not get idle state` and writes nothing — and if an old
   `/sdcard/ui.xml` exists, `cat`-ing it silently returns a **stale** snapshot
   of a screen you left minutes ago. `rm -f` it first and check the exit code.
3. **The emulator loses DNS after the Mac sleeps.** Every request fails with
   axios `Network Error` after 10–30s, which looks exactly like a hung backend.
   Restart with explicit DNS:
   `emulator -avd Pixel_9_Pro_XL -dns-server 8.8.8.8,8.8.4.4 -no-snapshot-load`.
   It returns on a **new serial**, so re-run `adb reverse tcp:8081 tcp:8081`.
4. **There is no axios timeout** (`CommonServices`). A dead network hangs a
   request for 10–30s before the OS gives up. Worth adding a timeout, separately.
5. `npm install` needs `--legacy-peer-deps` (rneui vs safe-area-context v5).
6. The API endpoint is baked from `@env` keyed on **`APP_ENV`**, not the gradle
   flavour. A release script that does not set `APP_ENV` ships the test API.
