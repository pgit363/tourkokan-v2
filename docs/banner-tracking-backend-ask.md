# Banners — Tracking Ask + Creative Spec

**From:** App (tourkokan-v2)
**To:** Backend (tourkokan-backend) + Admin panel
**Date:** 2026-08-20
**Priority:** #1 is revenue-affecting.

Found during a full banner audit of all 10 placements (all 19 seed creatives measured
against how each screen renders them).

---

> **UPDATE 2026-08-25 — DONE (app side).** Both endpoints are live and wired in the app:
> `recordBannerImpression` fires on the active carousel slide (+ splash on show); `recordBannerClick`
> fires before `Linking.openURL`. Placement is derived from `banner_placement_id` via a map that was
> verified against live landingpage data (all 10 ids correct). Service: `src/Services/Api/BannerServices.js`;
> wiring in `Banner.js` + `HomeScreen.js` (splash). Two backend notes surfaced during verification:
> **(a)** every seed banner has an end_date in the past (Aug 17 / Jul 25), so the recording endpoint
> rejects them all — refresh the seed dates to test a live `counted:true`. **(b)** an expired banner
> returns `{"success":false,"message":"Unauthorized. This is an API server."}` — a confusing message for
> "campaign ended"; consider a clearer string (the app ignores all failures, so no app impact).

## 1. ⚠️ BLOCKING — impressions and clicks are never recorded

**The problem:** every banner row returns `impressions: 0, clicks: 0`, and **the app has no
way to increment either**. There is no tracking endpoint, so the app only opens
`redirect_url` on tap and reports nothing.

**Consequence:** advertisers are paying for placements whose performance numbers are
permanently zero. There is currently no way to tell an advertiser how their ad performed,
and no data behind `banner_packages` pricing.

**What the app needs — two endpoints** (mirroring the product `recordProductView` /
`recordProductLead` pattern the app already uses):

```
POST /api/v2/recordBannerImpression   { id, placement?, platform? }
POST /api/v2/recordBannerClick        { id, placement?, platform? }
```

| Field | Type | Notes |
|---|---|---|
| `id` | int | the banner id |
| `placement` | string | optional, e.g. `HOME_HERO` — useful if one creative runs in several slots |
| `platform` | string | optional, `app` (matches the product-lead convention) |

**Response:** anything with the standard envelope. The app treats both as
**fire-and-forget** — it ignores the response and never blocks the UI, same as
`recordProductView`.

**Semantics the app will implement once these exist:**
- **Impression** fires when a banner actually becomes visible — for a carousel, once per
  slide per session, not once per render (an auto-playing 3-slide carousel must not inflate
  counts on every loop).
- **Click** fires on tap, *before* `Linking.openURL`, so it is recorded even if the browser
  handoff fails.
- Both deduped client-side per session to avoid inflating numbers on re-render/scroll.

**Please confirm:** should an impression be counted once per *session*, once per *slide
view*, or every time it scrolls into view? That decision belongs to whoever prices the
packages — it changes what advertisers are billed against. The app can implement any of the
three.

---

## 2. Creative spec to enforce at upload (admin panel)

Every placement's container ratio is now driven by the creative's real aspect ratio. If an
advertiser uploads an off-ratio image it will letterbox or crop. **Enforce these dimensions
in the admin upload form:**

| Placement | Required size | Ratio |
|---|---|---|
| `HOME_HERO` | **1200×600** (ideally **1200×667**, see below) | 2:1 |
| `HOME_MIDDLE` | 1200×400 | 3:1 |
| `HOME_FOOTER` | 1200×200 | 6:1 |
| `CITY_MIDDLE` | 1200×400 | 3:1 |
| `CITY_FOOTER` | 1200×200 | 6:1 |
| `ROUTE_DETAIL_MIDDLE` | 1200×400 | 3:1 |
| `ROUTE_DETAIL_FOOTER` | 1200×200 | 6:1 |
| `ROUTE_LIST_MIDDLE` | 1200×400 | 3:1 |
| `ROUTE_LIST_FOOTER` | 1200×200 | 6:1 |
| `APP_SPLASH` | 1080×1920 | 9:16 |

**Safe area:** keep all text and logos within **10% of every edge**. The hero band renders
slightly taller than 2:1, so it trims ~5% per side — the current seed creative has 6.67%
left padding, which only just survives. 10% padding makes any creative safe.

**Hero would ideally be 1200×667 (1.8:1).** The app renders the hero band at 1.8:1; a 2:1
creative therefore gets a 5%-per-side trim to fill it. A 1200×667 creative fills the band
with **zero** trim and would let the band go taller safely.

---

## 3. Carousel placements should be ratio-consistent

The app measures the **first** image in a placement to size the carousel. Placements with
multiple creatives (`HOME_MIDDLE` ×3, `CITY_MIDDLE` ×2, `ROUTE_*_MIDDLE` ×2) therefore
assume every creative in that slot shares one ratio.

Today all seed data is uniform, so this is fine. But if an advertiser uploads a 3:1 into a
slot whose first image is 6:1, images 2..n will letterbox. **Enforcing #2 at upload solves
this** — no app change needed.

---

## 4. ✅ Fixed on the app side (no backend action)

- **Hero was cropping 32.5% of every ad** (16% per edge) — the container was 1.35:1 while
  creatives are 2:1. Fixed; the full ad is now visible.
- **`mr_image` was never used.** The app read `image` only, so Marathi users saw English
  creatives on all 8 placements that ship a `_mr` variant. Now honoured (with fallback to
  `image`) in both the carousel and the splash overlay.
- Null-guard added on image paths (a missing path previously threw).

---

### Summary
**One thing to build:** the two tracking endpoints in #1 (plus the impression-counting
decision). **One thing to enforce:** the creative spec in #2, in the admin upload form.
Everything else is already handled app-side.
