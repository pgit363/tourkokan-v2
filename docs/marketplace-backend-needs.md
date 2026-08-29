# Marketplace — Everything Needed from Backend

**From:** App (tourkokan-v2) · marketplace
**To:** Backend (tourkokan-backend)
**Date:** 2026-08-18
**Basis:** Endpoints the app actually calls (`src/Services/Api/MarketplaceServices.js`), verified against the earlier backend response (`marketplace-backend-response.md`).

This supersedes the open items in `marketplace-backend-asks.md` and adds what the next feature slice needs.

---

## A. BLOCKING for testing (data/seeding, not code)

**A1. Seed api-test with the category whitelist + attribute schemas.**
This is the root cause of "categories just spin / never load" on dev creds. Prod/local are seeded; api-test is not.

- Run: `ProductCategorySeeder`, `VendorCategorySeeder`, and whatever populates `AllowedProductCategory` (per-site whitelist) and each category's `attribute_schema`.
- Endpoints that return empty without it: `allowedProductCategories`, `categoryAttributeSchema`, `businessCategories`.
- Until this runs, **the entire Add-Product flow looks broken on api-test** even though the app is correct.

---

## B. DECIDED (both closed 2026-08-20 — no build)

**B1. `custom_specs` — CLOSED as no-build.** Vendors use the category's schema attributes; anything extra goes in the product `description`. The schema-driven Add-Product form stays as-is.

**B2. Self-serve subscription upgrade — CLOSED as no-build.** Plans stay admin-assigned; the app keeps "Contact us to switch". Revisit when the commerce/payment layer ships.

---

## C. NEW WORK for the next feature slice

| # | Feature | Endpoint status | Backend action |
|---|---------|-----------------|----------------|
| C1 | **Edit a product** | `updateProduct` **exists** ✅ | Confirm `getProduct` returns **all editable fields** for prefill: `name`, `description`, `base_price`, `sale_price`, `unit`, `attributes` (as stored), `product_category` (id), and `media[]`. Confirm `updateProduct` accepts the same multipart shape as `addProduct` and re-enters review on approved items. |
| C2 | **Per-product analytics** | `productAnalytics` **exists** ✅ | Confirm the response shape the screen expects: `{ name, views_count, leads_count, conversion_rate, series:[{date, views}] (or daily), leads_by_type:{call,whatsapp,directions,enquiry} }`. |
| C3 | **Product image gallery** | needs response change ⚠️ | `productDetail` / `getProduct` must return the **full ordered media array**, not just the cover — e.g. `media: [{ id, url (relative), is_cover, sort_order }]`. Confirm the field name. Today the app only gets the cover. |
| C4 | **Buyer's favourites list** | **MISSING** ❌ | Toggle (`addDeleteFavourite`) exists, but there is **no list endpoint**. Add `v2/myFavourites` (or `v2/favourites`) filtered by `favouritable_type=Product`, paginated, returning product cards. Without it, favouriting is a dead end. |
| C5 | **Buyer's enquiry history** | ✅ **Built** (2026-08-20) — `v2/myEnquiries` live; app screen wired at Profile → My Enquiries with `available:false` tombstone handling. | — |

---

## D. RESPONSE-SHAPE CONTRACTS the app already depends on

Please keep these stable — the app parses them exactly:

- **`myUsageStats` must stay nested:** `{ leads:{total}, views:{total}, listings:{total}, conversion_rate }`. A flat shape breaks the dashboard (produced `NaN` before this nesting was confirmed).
- **Pagination envelope everywhere:** `{ success, message, data:{ current_page, last_page, data:[...] } }`. Non-paginated: `{ success, data:[...] }`.
- **Price resolution:** product price comes from `default_variant` (fallback `base_price`/`sale_price`, `currency`, `unit`).
- **Images are relative** and prefixed with `AWS_URL` client-side (confirmed). Keep the convention; don't mix absolute/relative within one payload.
- **`mySites` rows** include: `is_primary`, `phone`, `whatsapp`, `logo`, and city/`parent_id`.
- **`productDetail` / `vendorProfile`** include public `phone`, `whatsapp`, `latitude`, `longitude` (confirmed implemented).
- **`myLeads` rows** include: `lead_type`, optional `message`, `product.name` (or `product_name`), `created_at`.

---

## E. WIRED but UNUSED (confirm they work if/when we build UI)

These service wrappers exist in the app but no screen calls them yet. No action now — just flagging that a future slice will depend on them:

- **Reviews/ratings:** `rateProduct` (`addUpdateRating`), `productComments` (`comments`), `addProductComment` (`comment`) — all with `type="Product"`. Product detail shows read-only `rating_avg_rate`/`rating_count` today; there's no write path. Confirm these accept `Product` and return `{rate, avg, count}` + comment lists with user name + timestamp.
- **Variants:** `saveProductVariant`, `deleteProductVariant`.
- **Media management:** `deleteProductMedia`, `setProductCover`, `reorderProductMedia`.
- **Misc:** `setPrimarySite`, `productsBySite`, `featuredProducts`.

---

## F. Confirmed ready — NO action (for reference)

Browse/detail/vendors, `addProduct` (schema-driven validation, errors keyed `attributes.<field>`), `addSite` + `businessCategories` + `is_business` filtering, vendor role-request flow (`requestRole` / `myRoleRequests`), enquiry-only booking for v1, attribute filtering out of scope for v1.

---

### One-line summary
**Must-do now:** A1 (seed api-test), B1 & B2 (two decisions), C3 (gallery media array) + C4 (favourites list). **Everything else is already built or just needs a shape confirmation.**
