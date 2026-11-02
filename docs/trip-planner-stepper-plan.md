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

**Total remaining on this plan: none — but the feature does not work with the
AI switched on.** The happy path verified on api-test ran on the fake driver.
With `ai_driver = claude` the generation fails (`day_too_thin`); see "The AI
driver, switched on". Outside this plan: iOS verification and the guest-trip
bug.

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

## Full-feature run against the pushed backend (2026-11-02)

Walked on the emulator against api-test, signed in, with the stepper's own
backend live (`questionSet`, `trip/places`, `addToCart`, `reorderCart`,
`updateCart`, `planFromCart` all 200).

**The plan generates.** Three picks (Kharepatan Fort, Vaibhavwadi, Tarkarli
Beach) became "2 days in Konkan", 5 stops a day. Each pick carries a **YOURS**
badge and the planner filled the gaps around them. Credits went 99999 → 99998,
so the ledger spends exactly once.

Verified with it: day tabs; road legs with distances; **Contacts** (every stop
listed, "Public place · no contact needed", privacy line); **Stop details**
("why it is here", Open in Maps); **Leg** ("No ST bus on this leg — nothing in
the duty sheets runs between these two stops", with the taxi fallback);
**My trips** (the new trip listed, "Made today", offline badge, stop names
middot-joined). Marathi and English both read correctly throughout.

One thing to know about step 3's promise: the arranged order is **regrouped by
geography**, not followed literally. Picks 1 and 3 landed on day 1 and pick 2
opened day 2, because it sits 63 km away. That is sensible planning, but
"We plan around this order" is a softer promise than it sounds.

### Two bugs this run found

**1 · Step 1's CTA failed silently (fixed).** `next` awaited `update()` and
only navigated `if (ok)`. When the save failed the screen simply did not move
and said nothing — the dead button this codebase argues against elsewhere. It
now reports `TRIP.SAVE_FAILED` in the footer.

**2 · Signing in abandons the guest's trip (NOT fixed).** The guest gate says
*"Add an account and this trip stays yours — nothing you picked is lost."*
Nothing implements that. There is no claim or merge of a guest trip anywhere
in the backend. After signing in, the app still held the guest's `trip_id`,
`updateCart` returned **404** (`resolve()` scopes by `user_id`), and the three
places the guest had picked were gone — the account showed its own cart
instead. Needs a decision: claim the guest trip on login, or change the copy.

### Also fixed while testing

`GlobalText` carries `textAlign: 'center'` in its base style, so every screen
must opt out. Four screens had body text centred inside a stretched column:
SampleTrip (stop name/note/time), TripContacts (name/sub), MyTrips
(card title/meta) and TripLeg (route/runs). M3 had hit the same thing on its
own two screens.

## The AI driver, switched on (2026-11-02) — ⛔ generation fails

Everything verified before this ran on `ai_driver = fake`. The itinerary text
"Planned stop at X." is a literal in `Ai/FakeClient.php:61` — no model had
ever been called. Switched the local `ai_configs.ai_driver` to `claude` and
walked it again.

**The client works.** A real call went out: `claude-haiku-5-5`, 5197 in / 431
out, 5.7 s, ₹0.0647, logged to `ai_logs`. The prose is what the product wants
— *"Swim in the shallow clear water and ask at the beach for snorkelling or
diving trips if you want to go out to the reefs."* That is the register the
bundled sample trip promises, and the fake client never produced it.

**The plan was then rejected.** `failure_reason: day_too_thin`,
`valid_sites_used: 0`, `days_generated: 0`.

Not the model's fault in the way it looks. It returned exactly the three cart
site ids, all real. What it got wrong was the shape: **day 1 two stops, day 2
one stop**, against `min_stops_per_day = 2`. `ItineraryAssembler` rejects any
thin day outright, so one short day discards the whole plan.

It also used **none** of the 25 suggested fill-ins that `nearby()` had found
and the prompt had offered (Padmagad Fort, Sindhudurg Fort, Sarjekot Fort,
Kolamb Beach…). With three picks over two days it had to invent a second day
from suggestions, and did not.

### Why, precisely

`ItineraryPrompt` states the rule in prose — *"Between 2 and 5 stops per
day."* — but **`ItinerarySchema` puts no `minItems`/`maxItems` on `stops`**.
The structured-output schema is the only part of the request a model is
actually bound by; prose is advisory. The call also runs at
`'effort' => 'low'` (`ClaudeClient`), which is the right default for
arranging pre-validated rows but leaves little room for a constraint the
schema does not carry.

So: the one rule whose violation hard-fails the whole plan is the one rule not
encoded in the schema.

**That fix is not available.** Putting the bound in the schema was tried and
the API refuses it outright:

> `output_config.format.schema: For 'array' type, 'minItems' values other
> than 0 or 1 are not supported (got: [2, 5])`

Anthropic's structured-output schema subset does not express "at least two".
The attempt made things strictly worse — every call failed with
`model_error` before reaching the model, 0 tokens — and has been reverted.
`ItinerarySchema` is back to its original form.

So the per-day minimum **cannot be enforced in the contract**, and the options
are all elsewhere:

| Option | Cost | Note |
|---|---|---|
| Retry once on `day_too_thin`, feeding back which day was short | one extra call | Most likely to work; the model gets a concrete correction |
| Pad a thin day server-side from the suggestions the assembler already holds | free | Deterministic, but the padded stop has no model-written note |
| Raise `effort` above `'low'` in `ClaudeClient` | higher per call | May improve rule-following; unmeasured |
| Spell out the arithmetic in `ItineraryPrompt` ("N stops across D days; draw the rest from the M suggestions") | free | The model was never told it had to reach a total |
| Lower `min_stops_per_day` to 1 | free | Changes the product, not the bug |

**The prompt option was tried and it works.** Two lines were missing from
`ItineraryPrompt`:

- **What `suggested` is for.** Its only other mention in the system prompt is
  the rule forbidding the *summary* from naming it. Given 25 unexplained
  entries and a rule that every picked place must appear, the model read the
  picks as the plan. It now says the picks are usually too few, that
  `suggested` exists to make up the rest, and states the arithmetic —
  "at least {min × days} stops in total across {days} day(s). Count them
  before you answer."
- **The time format.** `arrive`/`depart` are typed as plain strings, so the
  model answered "Morning" and "Late afternoon" — good English that
  `ItineraryAssembler::time()` discards, leaving every stop with no time at
  all (the UI showed "—"). The prompt now requires strict HH:MM.

Result, same trip: **success**, `claude-haiku-5-5`, 5322 in / 806 out,
₹0.0823, 3 days × 3 stops, times rendering as 09:00 / 11:30 / 14:00, each pick
badged YOURS with Sindhudurg Fort drawn from the suggestions, and two genuine
warnings surfaced ("Ferry and boat schedules … change with season and
weather"). The prose is the register the sample trip promises.

### Three things this run left open

- **Changing an input did not invalidate the shown plan — fixed.** Days was
  changed 2 → 3 on the review screen (`updateCart` 200, `saved_trips.days` =
  3) and "Make my plan" returned the stored 2-day itinerary without calling
  the model at all; no `planFromCart` request was even sent.

  `ItineraryScreen`'s `mine` test asked only whether the plan in state was for
  *this trip id*, which cannot tell that the trip's inputs changed underneath
  it. The two screens whose button means "make it now" — review and the cart
  — now pass `fresh: true`, and `mine` requires having asked, exactly as the
  form path already did. Re-planning is free (the ledger keys the spend by
  trip), so an explicit ask can always ask. Opening a saved trip from My Trips
  still renders what was stored and never regenerates.

  Verified: same trip, days 2 → 3, re-plan sent a fresh call and returned
  "Malvan Coast Three-Day Plan" with three days.
- **The YOURS badges are absent when a trip is opened from My Trips**, though
  they appear on a freshly generated one. The saved payload appears not to
  carry which stops were the traveller's own.
- **`ItineraryScreen`'s stop notes are centred** — the same `GlobalText`
  default that was fixed on four other screens.

⚠️ The local backend is **still on `ai_driver = claude`**.

### api-test after the push (2026-11-02)

Re-walked on api-test with the backend deployed. The stepper works end to end,
and the stale-plan fix holds: days 2 → 3 on review sent a fresh
`planFromCart` and the title changed from "2 days in Konkan" to "3 days in
Konkan" with three day tabs.

**Update — the real model now runs on api-test and the feature works end to
end there.** "Malvan Coast: Forts, Beaches and Sea Views", 3 days x 3 stops
from 3 picked places, 12 s, times rendering as 09:00 / 11:00 / 14:00, the
picks badged YOURS and the other six drawn from suggestions. Day 3 is
entirely suggestion-filled ("North to Achra and Tondavali beaches"). Both
prompt fixes are confirmed against deployed code.

Getting there took three separate environment problems, none of them code:

1. `ai_driver` lives in the `ai_configs` **table**, so deploying the backend
   did not switch it on. Flipped with `AiConfig::set('ai_driver', 'claude')`.
2. `anthropic-ai/sdk` was in `require` and in `composer.lock` but had never
   been installed on that host — `Class "Anthropic\Client" not found`,
   recorded in `ai_logs.error_message`.
3. After `composer install`, php-fpm still served the **old autoloader** from
   opcache, so the same error persisted until the workers were reloaded.

Worth keeping: `ai_logs` answered all three. Each failure recorded its reason
and exception, refunded the credit, and showed the traveller an honest
message. Timing alone was misleading — the third failure took 12 s of
candidate and leg precompute before throwing instantly on the missing class,
which read like a model call that had failed.

What follows below was written when **api-test was still generating with
`FakeClient`** — the itinerary reads
"Planned stop at Tarkarli Beach." and the call returns in ~600 ms, against
5–8 s for a real one. `ai_driver` lives in the **`ai_configs` table**, not in
code, so deploying the prompt fix does not switch it on. To make the AI live
there: set `ai_driver` to `claude` (the admin AI dashboard accepts it, no
deploy needed) and make sure `ANTHROPIC_API_KEY` is in api-test's
environment. Until then the prompt fix is deployed but dormant, and the
itineraries api-test produces are templates.

### What did behave correctly

The failure path is sound: the credit was spent and **refunded** (balance 1
before, 1 after), and the screen says *"That did not come out right — We could
not build a full plan from these places. Nothing was charged, so please try
again"*, with *"Adding one or two more places usually helps."* — which, given
the real cause, happens to be true advice.

⚠️ The local backend is **still on `ai_driver = claude`**. api-test is
untouched and remains on `fake`.

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
