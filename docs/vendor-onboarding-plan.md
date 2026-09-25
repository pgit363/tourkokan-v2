# Vendor Onboarding — Implementation Plan & Status

Modular plan to make "become a vendor" prominent, capture verified business
details, list before approval, and mirror the flow on the web. Built on top of
what already exists (see `../tourkokan-backend/docs/VENDOR_PRODUCTS_DESIGN.md`).

Flow mockup: Artifact "Vendor Onboarding Flow".

---

## Status legend
`⬜ Not started` · `🟡 In progress` · `✅ Done` · `⛔ Blocked` · `♻️ Already built (reuse)`

## Module status board

| # | Module | Layer | Status | Blocker |
|---|--------|-------|--------|---------|
| M0 | Backend vendor/site/product/approval + reject-with-reason + resubmit | backend | ♻️ Already built | — |
| M1 | Home CTA banner + dedicated BecomeVendor screen | app | ✅ Done (verified live on iOS sim) | — |
| M2 | Missing email/mobile → inline fill popup | app | ✅ Done (verified on iOS sim) | — |
| M3 | Government verification fields (Udyam/GST/Shop-Act) | backend + app | ✅ Done (verified on iOS sim) | ⛔ consent copy is a PLACEHOLDER — legal sign-off before release |
| M4 | Verified badge on site/vendor | app | ✅ Done (verified on iOS sim) | — |
| M5 | Web first-time vendor wizard + first-time guard | web + backend | ✅ Done (backend tested, web builds) | Google button needs `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` env |
| M6 | Free-3-months subscription + `early_adopter` flag | backend + app | ✅ Done (verified on iOS sim) | — |
| M7 | Vendor advertising placement/creative | app + web | ✅ Done (app verified on iOS sim, web builds) | — |
| M8 | Rejected-state screen prominence (polish) | app | ✅ Done (verified on iOS sim) | — |

> Update the Status column as each module lands. Keep this table the single
> source of truth for progress.

### Verification record (2026-09-25)

**Backend** — 380 tests / 1137 assertions pass, including `VendorOnboardTest`
and the M6 promo terms pinned in `PlanLimitTest`.
**Web** — `tsc --noEmit` clean, `next build` clean, `/vendor/register` builds.
**App** — ESLint at the pre-existing baseline (8 errors, all inherited from
`test`; zero added). Walked on the iOS simulator against a local backend:

- **M2** — as a user with neither email nor mobile, *Register my business*
  returned the 403 and opened the sheet asking for exactly those two fields. A
  mobile already in use came back as an inline field error with nothing
  half-saved; a free one saved and the vendor request fired on its own, leaving
  the screen on *Request Pending* and a `pending` row in `user_role_requests`.
- **M3** — the submit wizard now ends on *Verify* (step 5 of 5). Udyam/GSTIN/
  Shop-Act each reveal the number field, certificate upload and consent box;
  submitting stored `reg_type`, `verification_status = pending`, and the
  registration number **encrypted at rest**.
- **M4** — *Verified business* badge shows on the detail page of a site with
  `verification_status = verified`.
- **M6 / M8** — the dashboard header reads *90 days left of your free period*,
  and *1 of your listings need changes* routes to the rejected listing with its
  reason and an Edit & Resubmit button.
- **M1/M7 regression** — see the fix below; the CTA's visibility was wrong on a
  cold cache and is now covered in all four states.

One bug found and fixed while testing: `VendorCTA` decided vendor-or-not from a
cache written after it mounts (and sometimes belonging to the previous user), so
existing vendors were shown "become a vendor". Roles now come from the landing
response as it arrives. Verified for a vendor with a cold cache, a warm cache,
and a stale cache from another user, plus a non-vendor who must still see it.

**Left deliberately undone:** the admin-panel UI for the verification queue.
`pendingVerifications` and `verifySiteRegistration` work, but approving a vendor
currently means calling the API by hand.

---

## M0 — Already built (do NOT rebuild)
- Become-vendor role request: `POST v2/requestRole {role_code:'vendor'}` → `UserRoleRequestController::store`.
- Email + mobile gate at vendor time: `VendorMiddleware::missingContactFields` → structured 403 `incompleteProfileResponse`.
- Business categories picker: `businessCategories` (Tour&Travel / Local Services / Shopping / Accommodation / Food).
- Site submit + status: `submitSite` (→ pending), `mySites`/`mySubmissions`, `submission_status`, `rejection_reason`.
- **List products before approval** (§2.6): both queues fill in parallel; 3 gates keep it private.
- **Reject with reason + notify** — sites (`rejectSite`) and products (`rejectProduct`), both `rejection_reason` required, vendor notified via `VendorNotifier`.
- **Fix & resubmit** — editing a rejected site/product auto-resets `submission_status`/`status` to `pending` (`SiteController::updateSite`, `ProductController::submitProduct`). App surfaces reason + Edit button (`MySubmissionsScreen`, `ManageProductScreen`).
- Plans engine: `plans` (free/starter/growth) + `vendor_subscriptions` (`starts_at`/`ends_at`).

---

## M1 — Home CTA banner + dedicated BecomeVendor screen  ✅
**Goal:** move vendor discovery onto the Home tab, and give "become a vendor" its
own page instead of living inside Profile.

Tasks
- [x] `src/Components/Sections/VendorCTA.js` — Home banner; hides for existing vendors (reads `LANDING_RESPONSE.user.roles`); placed after "Explore Talukas".
- [x] **New dedicated screen** `src/Screens/Marketplace/BecomeVendorScreen.js` — self-contained: loads vendor/role status, value-prop + free-3-months promo + perks, request sheet (`requestRole`), and pending/rejected/already-vendor states + guest gate.
- [x] Registered `SCREEN.BECOME_VENDOR` in `StackNavigator` (next to VendorDashboard).
- [x] `VendorCTA` now navigates to `BECOME_VENDOR` (not Profile).
- [x] **Removed from `ProfileView`:** the become-vendor CTA button, the pending/rejected inline cards, and the whole vendor-request modal + its handlers/state (`handleVendorCtaTap`, `handleVendorSubmit`, `vendorRequest*`, `vendorTapLock`). Kept only the **vendor → dashboard** shortcut (shown to approved vendors).
- [x] i18n: `VENDOR.CTA_*` + `VENDOR.INTRO_*/FREE_*/PERK_*/REGISTER_BUSINESS/TERMS_NOTE/REQUEST_TITLE/GUEST_*` (en + mr).
- [x] ESLint clean on all new/edited files (pre-existing exhaustive-deps warnings only).
- [x] **Verified live on iOS simulator (test API):** banner hidden for the vendor user; Profile shows no become-vendor button (only the vendor→dashboard shortcut); as a **guest** the banner shows on Home between Explore Talukas & Local Buses; tapping opens the BecomeVendor screen (hero + free-3-months + perks + register); "Register my business" as a guest fires the sign-in gate.

Notes: no backend change — reuses `requestRole` / `myRoleRequests`. The become-vendor
entry point is now single-sourced on `BecomeVendorScreen`.

---

## M2 — Missing email/mobile → inline popup  ✅
Backend already returns which fields are missing (`incompleteProfileResponse`).
Replace the raw error with a bottom-sheet that lets the user fill **only** the
missing fields (email and/or WhatsApp mobile), save via profile update, then
continue the vendor request automatically.

Tasks
- [x] Reusable `ContactDetailsSheet` component (`src/Components/Common/ContactDetailsSheet.js` — email + mobile, validated, updateProfile's HTTP-200 error envelope handled).
- [x] Intercept 403 `incompleteProfileResponse` from `requestRole` in `BecomeVendorScreen.submit()`; sheet opens with the named missing fields.
- [x] Save → `updateProfile` → retry `requestRole` automatically (`onSaved` → `submit()`).
- [x] i18n (`VENDOR.CONTACT_*`, en + mr).

---

## M3 — Government verification fields  ✅ (code) ⛔(legal copy)
Add to site submission: `reg_type` (udyam|gstin|shop_act), `reg_number` (encrypted),
`reg_doc` (upload), `verification_status`, `verified_at`.

Tasks
- [x] Migration `2026_09_24_000001_add_verification_to_sites_table` — columns on `sites` (no new table). `reg_number` is TEXT so ciphertext never truncates; index on `verification_status`.
- [x] Encrypt `reg_number` (`encrypted` cast on Site + the same DecryptException guard as User). `reg_number`/`reg_doc` are `$hidden` — public payloads only carry `verification_status`; admin endpoints `makeVisible()` them.
- [x] `submitSite` + `updateMySubmission` validation (optional, tiered): choosing a `reg_type` requires `reg_number` + accepted `consent`; consent timestamp lands in `sites.meta_data.verification`. Editing reg details resets the review to pending.
- [x] Admin: `POST /admin/v2/pendingVerifications` (queue) + `POST /admin/v2/verifySiteRegistration {id, decision, note}` — manual review; verification is a separate axis from listing approval. Vendor notified either way (`VendorNotifier::siteVerified` / `siteVerificationRejected`).
- [x] App: "Verify" step 5 in `SubmitPlaceScreen` — type chips, number, certificate photo upload, DPDP consent checkbox; shows current verification state when editing.
- [x] Feature tests: `VendorOnboardTest` covers submit-with-registration, the admin queue, both decisions, and payload hygiene.
- ⛔ **Blocker (unchanged):** `VENDOR.CONSENT_DPDP` (app) and `vendor.consentPlaceholder` (web) ship as clearly marked **placeholders** — swap in lawyer-approved DPDP consent + Vendor Terms wording before release. Verification method decided: **manual admin review** (no paid API).
- Deploy note: restrict public read on the S3 prefix `<env>/sites/docs/` — certificates are review documents, not site media.

---

## M4 — Verified badge  ✅
Show a "Verified business" badge on site detail, marketplace cards, vendor
profile when `verification_status = verified`.

Done: backend exposes `verification_status` on getSite (full model), mySites,
mySubmissions, catalog site payloads, and vendorProfile (plus a top-level
`verified_business` bool from the primary site). App renders the badge on
SiteDetailPage's hero, VendorProfileScreen's header, and MySubmissionsScreen
cards (verified + under-review chips).

---

## M5 — Web first-time vendor wizard + guard  ⬜
Next.js `tourkokan.com/vendor/register`: Google sign-in → combined business +
first-product wizard. Backend guard allows the combined web wizard only when the
user has **0 sites** and `X-App-Source: web`.

Tasks
- [x] Backend: `POST /api/v2/vendorOnboard` (`VendorOnboardController`) — one transaction: pending site (+ optional verification, optional first product as draft with default variant) + vendor role request. Guards: `X-App-Source: web`, zero existing sites, same contact gate as requestRole. `allowedProductCategories` now also accepts `category_ids[]` (pre-site, for the wizard) and moved out of the vendor middleware group.
- [x] Web: `/vendor/register` — landing → sign-in (email sign-in/sign-up always; Google Identity Services button renders when `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set, posting the credential to the existing `v2/googleAuth`) → 6-step wizard (business, location with Maps-URL parse, contact, optional verification, optional first listing, review) → success. The contact-gate 403 is handled inline (mirrors app M2). `vendorApi` group added to `src/lib/api.ts`; `ApiError` now carries the raw body.
- [x] "First-time" semantics decided: per user = 0 existing sites (any status).
- [x] Feature tests: `VendorOnboardTest` (guards, combined create, no duplicate role request).

---

## M6 — Free-3-months + early access  ✅
- [x] On vendor approval, `enrolOnFree($user, 3, [...])` — `ends_at = now + 3 months` (enrolment already existed at 12; the approval call now passes the promo term). Pinned by `PlanLimitTest`.
- [x] Show "N days left": countdown card on SubscriptionScreen (+ near-expiry warning at ≤14 days) and a header chip on VendorDashboard linking to the plan screen. `mySubscription` now returns `early_adopter`.
- [x] `early_adopter` lives in `vendor_subscriptions.meta_data` (no new column — the JSON field already existed); set with `promo: launch_free_3m`; surfaced as a chip on the plan screen. Feature-gating reads `meta_data.early_adopter`.

---

## M7 — Vendor advertising  ✅
Reuse the Creative Kit "Be the first thing travellers see" business track; add a
vendor-acquisition banner slot on web + app.

Done: web — `VendorAcquireBanner` on the home page (routes to /vendor/register);
app — `VendorCTA` gained a `compact` variant ("Own a business here?") rendered at
the end of SiteDetailPage's content. Both hide for existing vendors.

---

## M8 — Rejected-state screen (polish)  ✅
A dedicated "Rejected — here's why, fix & resubmit" surface (data + edit path
already exist). Mockup screen 9.

Done: VendorDashboard now loads mySubmissions + rejected products and shows a
red attention card ("N of your listings need changes → View & fix") routing to
the right fix surface; MySubmissionsScreen keeps the reason + Edit path.

---

## Blockers summary
1. ⛔ **Legal** (M3): Vendor Terms + liability + DPDP consent — needs a lawyer/CA. Code ships with clearly marked PLACEHOLDER consent copy (`VENDOR.CONSENT_DPDP` app, `vendor.consentPlaceholder` web) — **swap before release**. Still the real launch gate.
2. ~~Verification method (M3)~~ — decided: manual admin review via `/admin/v2/verifySiteRegistration`.
3. ~~First-time-web semantics (M5)~~ — decided: 0 existing sites per user.
4. Encrypted doc storage (M3): column encryption done; **ops task**: restrict public read on the S3 prefix `<env>/sites/docs/`.
5. ~~Feature-flag system (M6)~~ — `early_adopter` in `vendor_subscriptions.meta_data`.
6. Web Google button (M5): set `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` (same client id the app uses) — email auth works without it.
7. Admin panel UI for the verification queue (pendingVerifications / verifySiteRegistration) is not built yet — decisions work via API/Postman.
