/**
 * Trip planner API — thin wrappers over comnPost.
 *
 * Every endpoint is POST and JWT-gated (token auto-attached by CommonServices).
 * Callers read `res.data.success` and `res.data.data`.
 *
 * Every cart endpoint returns the SAME shape, so a screen never has to guess
 * which call it came from:
 *   { trip_id, title, status, days, base_site_id,
 *     count, minimum, can_plan, places: [...] }
 *
 * `can_plan` is the server's own answer to "may this trip be planned yet" —
 * bind the Plan button to it rather than re-deriving the minimum in the app,
 * so the rule lives in one place and an admin can change it without a release.
 */
import {comnPost} from './CommonServices';

// ── The cart ────────────────────────────────────────────────────────────────

/** The open cart, or a specific trip. Omit trip_id while browsing. */
export const getCart = (trip_id, navigation) =>
  comnPost('v2/trip/cart', trip_id ? {trip_id} : {}, navigation);

/**
 * Tick a place. With no trip_id the server adds to the open cart and creates
 * one on the first tick, so browsing never has to think about trips.
 */
export const addToCart = (site_id, trip_id, navigation) =>
  comnPost(
    'v2/trip/addToCart',
    trip_id ? {site_id, trip_id} : {site_id},
    navigation,
  );

export const removeFromCart = (site_id, trip_id, navigation) =>
  comnPost('v2/trip/removeFromCart', {site_id, trip_id}, navigation);

/** site_ids in the order the traveller dragged them. */
export const reorderCart = (trip_id, site_ids, navigation) =>
  comnPost('v2/trip/reorderCart', {trip_id, site_ids}, navigation);

/** Days, base town and title — the rest of the cart screen. */
export const updateCart = (trip_id, changes, navigation) =>
  comnPost('v2/trip/updateCart', {trip_id, ...changes}, navigation);

// ── Generation ──────────────────────────────────────────────────────────────

/**
 * Turn a cart into an itinerary. Free, but it spends one of the traveller's
 * plans — and re-planning the same trip does not, because the server keys the
 * spend by trip rather than by request.
 *
 * On refusal the envelope carries `data.reason`, which the screen maps to copy:
 *   verification_required · insufficient_credits
 *   cart_too_small        · generation_failed
 */
export const planFromCart = (trip_id, navigation) =>
  comnPost('v2/trip/planFromCart', {trip_id}, navigation);

// ── The plan form ───────────────────────────────────────────────────────────

/**
 * The form's own options, served rather than shipped: towns that can be
 * searched around, interests that have places behind them, and the live
 * limits. Do not hardcode a category list in the app — an interest nothing
 * carries would be offered until the next release.
 *
 *   { towns: [{site_id, name, mr_name, lat, lng}],
 *     interests: [{code, name, mr_name, icon, places}],
 *     days: {min, max, default}, max_towns, radius_km, credits }
 */
export const tripQuestionSet = navigation =>
  comnPost('v2/trip/questionSet', {}, navigation);

/**
 * What a filter set would give, before anything is spent. Free, and no model
 * call — safe to run as the traveller changes their mind.
 *
 *   { can_plan, reason, candidates, needed, days, towns, cost, credits }
 */
export const quoteTrip = (filters, navigation) =>
  comnPost('v2/trip/quote', filters, navigation);

/**
 * Generate from the form. Spends one plan, and returns the same payload as
 * planFromCart, so the itinerary screen serves both entry points.
 *
 * Refusal reasons add two to the cart path's list:
 *   town_not_found · not_enough_places
 */
export const planTrip = (filters, navigation) =>
  comnPost('v2/trip/plan', filters, navigation);
