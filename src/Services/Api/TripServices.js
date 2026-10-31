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
