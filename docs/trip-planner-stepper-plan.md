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
| M0 | Map screen place-picking (add / in-trip / cart badge) | app | ↩️ Reverted in `0d28e12` — map picking lives on step 2 | — |
| M1 | Step 1 — Where & what (split out of PlanTripScreen) | app | ✅ Done, verified on device | — |
| M2 | Step 2 — Pick places (list + map toggle, filtered) | app | ✅ Done, verified on device | — |
| M3 | Step 3 — Arrange selected places | app | ✅ Done, verified on device | — |
| M4 | Step 4 — Review → `planFromCart` | app | ✅ Done, verified on device | — |
| M5 | Step chrome (progress, back/next, state, entry points) | app | ✅ Done (completed by M4's wiring) | — |
| M6 | i18n en + mr sweep + device verification | app | ✅ Done, verified on device in both languages | — |

**Total remaining on this plan: none.** The stepper walks end to end against
api-test on the real model, pasted places included. The guest-trip bug is
fixed and verified. The twenty defects and gaps the 2026-11-03 audit confirmed
are all closed — see "Open items — worked through", which also records the five
claims of mine that the audit overturned. What is left there is iOS, a device
walk, and four latent items that nothing reaches today.

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

**2 · Signing in abandoned the guest's trip — FIXED and verified.**
`POST v2/trip/claim` now carries it across, taking the token the traveller was
browsing under as proof rather than a trip id (ids are sequential, so an id
alone would let anyone claim anyone's cart). The source must still be
unverified, and only drafts move — a generated trip was paid for from the
guest's own credits. The favourites rows move with it, since they carry their
own `user_id`.

Verified on api-test by walking the promise itself: browse as guest, pick
Tarkarli Beach / Rajkot Fort / Chivla Beach, hit "Save your trip first", sign
in with Google. `trip/claim` fired automatically after `googleAuth` (200,
435 ms) and Home came back with "3 places picked" — the same three, still
ticked, with the towns and interests intact.

One bug found building it: `$request->string()` returns a Stringable, which
`setToken()` accepted without complaint and then read as the wrong subject —
a silent refusal rather than an exception. Now an explicit cast.

<details><summary>The original description</summary>

**Signing in abandons the guest's trip (NOT fixed).** The guest gate says
*"Add an account and this trip stays yours — nothing you picked is lost."*
Nothing implements that. There is no claim or merge of a guest trip anywhere
in the backend. After signing in, the app still held the guest's `trip_id`,
`updateCart` returned **404** (`resolve()` scopes by `user_id`), and the three
places the guest had picked were gone — the account showed its own cart
instead. Needs a decision: claim the guest trip on login, or change the copy.

</details>

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

## One door, not two (2026-11-02)

The home card had two buttons into two forms that asked almost the same
questions and differed only in what happened afterwards. Whichever you picked,
you could not see what the other one did.

They are one form now, and the fork is a question **on** it — "How should we
choose the places?", with both answers and what they do on screen:

```
Home → "Plan a trip" → step 1, the whole brief + the choice
                        ├ I'll pick them myself → pick → arrange → review → plan   (4 steps)
                        └ Choose for me         → review                   → plan   (2 steps)
```

- Step 1 absorbed the express form's questions: **how long**, **where are you
  sleeping**, **how are you getting here**, with the onward-bus note.
- The dot progress and the CTA follow the choice live — "Step 1 of 4" and
  "Pick places", or "Step 1 of 2" and "Review" — so the length of the flow is
  visible before committing to it.
- **Both paths review before generating**, because generating is what spends
  a credit. The express review swaps the picked-places list for "We will
  choose these from your towns and interests", under a label that does not
  claim they picked anything.
- The express path plans from the saved filters (`planTrip`); the long path
  plans from the cart (`planFromCart`). Step 1 persists `days` as its own
  field as well as inside the filters, because the planner reads the column
  and the prompt reads the filters.

### Also moved

- **Drawer:** "Plan a trip" and "My trip" removed. Planning lives on the home
  card, saved trips live in the profile — each in one place instead of two.
- **"Save trip" went nowhere.** The plan is already persisted server-side, and
  the button called `goBack()`, dropping the traveller onto the review screen
  they had just come through. It now ends the flow on **My trips**, via
  `popToTop()` rather than a named `reset` — the drawer is mounted as
  `SCREEN.MAIN` for a guest and `SCREEN.HOME` once signed in, so naming
  either breaks the other. A first attempt with `reset` was rejected at
  runtime for exactly that reason. Back from My trips now goes home, not back
  into the stepper.

Verified on api-test with the real model: both paths end in a generated plan,
and Save trip lands on My trips with the new trip at the top.

`PlanTripScreen` is now unreachable — nothing navigates to it. Left in place
rather than deleted, as that is a call to make deliberately.

## "Add from link" reaches the plan now (2026-11-02)

`addCustomStop` wrote to `saved_trips.custom_stops` and nothing ever read it.
The planner and assembler never looked at the column, so the app confirmed
"added to your trip" and the plan carried on as if the place did not exist.

Pasted places are picks, so they join `picked` and the model orders and times
them like anything else. They are carried as **Site models that were never
saved, with negative ids** — an unverified pin must not become a row in
`sites` (no owner, no approval, and it would leak into everyone's search
results), but the planner speaks in site ids, and negative is an id space the
table can never produce. "Ours or theirs" is a sign test, not a lookup that
could one day collide.

Three places learned about them: the assembler merges them into its keyed
collection instead of looking them up and flags them `custom`; `persist()`
writes no `TripPlacement` row for a negative id, since no business sits
behind one and no row exists for the foreign key; and the app badges them
YOURS, because the picked-id set comes from the cart and a pasted pin never
enters it.

`syncOriginal()` is needed on those models — `project()` reads names through
`getRawOriginal()`, which is empty on a model that was never loaded, so the
name would otherwise reach the prompt as null.

**Verified in the app against api-test and the real model:** pasted a Maps
link → "INSIDE SINDHUDURG, found near Malvan" → named it → "Added to your
trip" → planned. It came back as **"Nivti Rocks viewpoint", badged YOURS, at
13:00 on day 2**, between Nivti Fort and Bhogwe Beach, legs resolved 4.2 km
in and 5.4 km out by road (correctly road — no ST bus serves an arbitrary
point). The model wrote prose for a place it knew only as a name and a
coordinate — "looks over the rocky coast. Visit before the afternoon heat
builds" — and titled the trip "Malvan and Nivti coast, two days".

### The route it was verified through no longer exists

The walk above went **Map → "View my trip" → "Add your own place"**, and that
route had already been removed by `0d28e12` earlier the same day: the revert
took the cart badge and the way through to "My trip" off the district map. The
build on the emulator still had them. What the walk proves is the flow itself
— resolve, name, add, plan, badge — which is backend and `AddFromLinkScreen`
and is unaffected. What it does not prove is that anyone can get there.

`TripCartScreen` is now unreachable in source: that map bar was its only
entry, and it still holds the days stepper and "Add more places".

### A door on step 2 (2026-11-03)

Step 3 got one in `5db5d34`, but step 3 is behind the 3-place minimum — a
traveller whose one place is missing cannot reach the door that would add it.
Step 2 is where the list is read and where a gap is noticed, so the same
control now sits under that list: same dashed border, same
`TRIP.ADD_OWN_TITLE`, one affordance learned once across step 2, step 3 and
the cart.

It is in `ListFooterComponent`, which FlatList renders on the empty and
no-match states too — "Nothing here yet" and "No place here matches that name"
are the two moments the traveller most needs somewhere else to go. The map
view has no door; the toggle back to the list is one tap, and a FAB over the
map would be a second affordance for the same thing.

**Not verified on device.** Lint and a Babel compile pass, and the control is
the one already shipped on step 3 — but the emulator would not boot: the Mac
had 760 MB of 26 GB swap free and ~64 MB of RAM, so qemu sat at 0% CPU and
never reached adb across three attempts. Worth a two-minute look on the next
real run; there is nothing in it that can fail silently.

**What the door still cannot fix:** nothing about the cart knows the pin
exists. `present()` returns no `custom_stops`, so after "Added to your trip"
step 2's counter does not move and no row appears — see item 1 of the open
items below. The traveller's only confirmation is the one on the screen where
they added it.

---

## Open items — worked through (2026-11-03)

Every item below was audited against the live code before it was touched, by
eight read-only agents, one per cluster. **The audit overturned five of my own
claims**, which is recorded here because the corrections are more useful than
the list was:

| My claim | What the code said |
|---|---|
| `day_too_thin` has no retry | Already fixed by `e8b046b`/`2652d93` — the assembler tops up a short day. The claim was written before those landed. |
| Remove a pin by its array index | Wrong and dangerous. `customSites()` filters coordinate-less entries BEFORE numbering, so the negative id is an index into the *filtered* list, and both renumber on every add. Index removal deletes a different place than the one tapped. It is keyed on a uuid. |
| Nothing reads a stop's categories | `TripStopDetailScreen` and `TripContactsScreen` both do, through `categoryNames()`. So Marathi travellers were reading English category names, not dead payload. |
| `daily_spend_ceiling` is untested | Twelve passing tests, five on the ceiling, correct comparison, correct timezone, and it has fired for real. The **rate limiter** was the untested half. |
| `PlanTripScreen` is a clean delete | It was the only screen reading `max_days` from `ai_configs`, and the only one showing two notes the merged form drops. |

It also found four defects nobody had listed: the fake driver truncating
required picks, the top-up being unable to measure a pasted pin, a first day
emptied by a late arrival being handed over anyway, and a billed model failure
being logged as free.

### Landed

**Backend** — `479f818`, `9e3f0a9`, `a3f09c5`, `c6a4005`

1. ✅ **A pasted pin is a row in the cart.** `present()` emits them with
   negative ids and `custom: true`, after the DB rows — the order
   `planFromCart` concatenates them in, so the review screen lists what the
   model is actually asked to plan. The flag lives in
   `CandidateFetcher::present()`, so a browse row, a cart row and an itinerary
   stop are one object to the app.
2. ✅ **The gate moved with the presenter**, and had to: counting pins in
   `can_plan` while `planFromCart` counted only favourites would have turned an
   invisible stop into a Plan button that offers a trip and is then refused
   `cart_too_small`. A cart of only pins can also anchor its own search now.
3. ✅ **`trip/removeCustomStop`**, keyed on a uuid written at add time. Pins
   stored before keys existed match on `added_at`. Idempotent.
4. ✅ **`max_custom_stops` (10).** Every pin is a mandatory pick, so an
   unbounded list was a trip that could never be planned.
5. ✅ **`cart_too_big`** — more picks than `days × max_stops_per_day` is
   refused before the call instead of spending a credit on an outcome that can
   only be `picked_place_missing`.
6. ✅ **The stored plan carries `picked`** per stop, so a trip reopened from My
   Trips badges identically to a fresh one.
7. ✅ **Category names in a stored plan.** The assembler was the last
   `categories:id,name,code` in `app/Services/Trip` — the one `65d6a5e`
   missed. Two bugs in one line: `$c->name` froze the *generating account's*
   language into a stored payload, and with `mr_name` unselected the Marathi
   branch could never fire anyway (`null == ""`), so everyone got English.
8. ✅ **Three defects inside the top-up**: ids cut by the arrival time are
   given back to the spare pool; a first day with nothing left is
   `arrival_after_day_end` rather than an empty day; and the top-up can
   measure a pin instead of falling through to "the first spare". The
   required-pick guarantee now reads out of the finished plan rather than a
   running tally.
9. ✅ **The fake driver no longer drops picked places.** Its own comment
   promised they all appear, then it sliced the combined list to capacity —
   and since pins concatenate last, pins went first. `ai_driver` defaults to
   `fake`, so the stand-in and the assembler disagreed on every dev machine.
10. ✅ **The throttle counts spending, not taps.** `Limit::after()` skips the
    refusals that never reach the model. It answers in our envelope with a
    `scope`, and a `0` in `ai_configs` can no longer lock everyone out.
11. ✅ **A billed failure records its bill.** A safety refusal, a missing text
    block and non-JSON text all arrive as a billed HTTP 200 and all threw
    before the usage was read, so each was logged `cost_inr = 0` — leaving the
    daily ceiling blind to precisely the loop it exists to catch.
12. ✅ **`q=lat,%20lng` resolves.** The patterns tolerated a literal space,
    which the `url` rule rejects before it arrives, so the tolerance was
    unreachable. Found by writing the tests.

**Mobile** — `5efd9e9`, `4dcfae5`

13. ✅ **The X beside a pasted place works.** It removes by key; there is no
    add side, so for a pin the toggle only ever removes.
14. ✅ **Pins are a fixed tail on step 3** — arrows disabled, swaps refused,
    and only real site ids are sent to `reorder`. They carry a YOURS badge and
    "Your own place" on the arrange and review screens.
15. ✅ **Timeouts.** 15s default, 45s for planning, 60s for uploads, 20s for a
    map link. A timeout says "your plan may have finished anyway — look in My
    trips" instead of becoming `generation_failed`.
16. ✅ **A throttle says the wait in a human unit** — "tomorrow" for a daily
    limit, hours where it is hours, never 1440 minutes.
17. ✅ **Centred text**, across `StepChrome` (which fixes four screens at
    once) and six more files. Genuinely centred things are left alone.
18. ✅ **Step 3's hint** no longer promises an order the planner regroups.
19. ✅ **Both dead screens deleted**, after porting the `max_days` clamp and
    the two dropped notes out of `PlanTripScreen`.
20. ✅ **Adding a place dispatches the cart it gets back**, so the counter
    moves at the moment of saving.

### Tests

`TripCustomStopTest` (27) and `TripRateLimitTest` (5) — the custom-stop surface
had **zero** coverage before this, and so did the limiter. Backend suite:
**544 passing**, up from 524.

They are hermetic: `Http::preventStrayRequests()` is on, because the first
draft of the short-link test passed by quietly fetching google.com. Two fixes
were mutation-checked by reverting them and confirming the test fails.

### Still open

- **iOS is unverified** for the whole stepper. Out of scope while Android
  ships, recorded so it is not mistaken for done.
- **Nothing is verified on a device.** The emulator would not boot — the Mac
  had 760 MB of 26 GB swap free — so everything above is proven by the test
  suite, by live calls against the local API on `:8002`, and by lint. The
  stepper has not been walked by hand since these changes.
- **~35 possibly-orphaned `TRIP.*` translation keys.** Deliberately left: an
  orphan scan flags 50, and at least fifteen are false positives, because
  `KIND_*` and `SAMPLE_*` are reached through a variable. Any cleanup has to
  resolve dynamic keys or it will break the add-from-link chips.
- **`TripCart::count()` is dead code** and `contents()->count()` silently drops
  a favourite whose site was since unapproved, soft-deleted, given a
  `bus_stop_type` or stripped of coordinates — the same class of silent
  disappearance as the custom-stop bug, with a different cause.
- **`reorderCart` leaves gaps in `sort_order`** for any unmatched id. Harmless
  today, since nothing reads it as a dense index.
- **Laravel inverts the middleware order `routes/api.php` documents.**
  `throttle:trip` runs before `verified.email`, so an unverified guest's tap is
  counted before it is refused. Harmless now that free refusals do not count.

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

**An emulator that hangs at 0% CPU is the Mac out of memory, not a broken
AVD.** `emulator -avd …` prints its usual Vulkan/GLDirectMem lines, a
`crashpad_annotations["command_line"]` line, and then nothing; `adb devices`
stays empty for ever and the qemu process sits at 0.0% CPU. Check
`sysctl vm.swapusage` before touching the AVD — 760 MB free of 26 GB means
there is no memory to boot into, and no amount of `-gpu swiftshader_indirect`
or lock-file clearing will help. (`multiinstance.lock` left behind by a killed
emulator is safe to delete; it was not the cause here.)


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
