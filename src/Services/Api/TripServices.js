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
import {comnPost, TIMEOUT} from './CommonServices';

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

/**
 * Carry a trip built while browsing onto the account that just signed in.
 *
 * Sends the token the traveller was browsing under, not the trip id: ids are
 * sequential, so an id alone would let anyone claim anyone else's cart. Call
 * this AFTER the new token is stored — the request authenticates as the new
 * account and the guest token travels in the body as proof of who they were.
 */
export const claimGuestTrip = (guest_token, navigation) =>
  comnPost('v2/trip/claim', {guest_token}, navigation);

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
  // A real model call. Giving up at the default 15s would cancel a plan the
  // server is still writing — and the credit is already spent by then.
  comnPost('v2/trip/planFromCart', {trip_id}, navigation, {
    timeout: TIMEOUT.PLAN,
  });

// ── The plan form ───────────────────────────────────────────────────────────

/**
 * The form's own options, served rather than shipped: towns that can be
 * searched around, interests that have places behind them, how a traveller
 * can arrive, and the live limits. Do not hardcode a category list in the app — an interest nothing
 * carries would be offered until the next release.
 *
 *   { towns: [{site_id, name, mr_name, lat, lng}],
 *     interests: [{code, name, mr_name, icon, places}],
 *     days: {min, max, default}, max_towns, radius_km, credits,
 *     arrival: {modes: [{code, label}], points: [{site_id, name, modes}]},
 *     budget: {available} }
 */
export const tripQuestionSet = navigation =>
  comnPost('v2/trip/questionSet', {}, navigation);

/**
 * What a filter set would give, before anything is spent. Free, and no model
 * call — safe to run as the traveller changes their mind.
 *
 *   { can_plan, reason, candidates, needed, days, towns, cost, credits,
 *     arrival: null | {from, at, earliest_start, reaches, onward} }
 *
 * `arrival.onward` is the real answer to "can I get there from the station":
 * the first bus AFTER they land, or null when nothing direct runs.
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
  // Same real model call as planFromCart, same leash.
  comnPost('v2/trip/plan', filters, navigation, {timeout: TIMEOUT.PLAN});

/**
 * The traveller's saved trips, newest first.
 *
 * Free and read-only — a saved trip was paid for when it was generated, so
 * reopening one spends nothing and is not behind the verified-email gate.
 * Rows carry a prebuilt summary (stop count and the first few stop names)
 * because the alternative is downloading every full itinerary to render a list.
 */
export const myTrips = navigation =>
  comnPost('v2/trip/myTrips', {}, navigation);

/**
 * One saved itinerary, in the same shape generation returns, so the itinerary
 * screen renders a reopened trip through the identical path as a fresh one.
 */
export const getSavedTrip = (trip_id, navigation) =>
  comnPost('v2/trip/getTrip', {trip_id}, navigation);

/**
 * Resolve a Google Maps link the traveller pasted.
 *
 * Server-side because a maps.app.goo.gl link carries no coordinates — only a
 * redirect does — and because "is this inside the area we cover" can only be
 * answered against the sites table, which the app does not have.
 */
export const resolveMapLink = (url, navigation) =>
  // The server follows the short link to Google and allows it 8s of its own.
  comnPost('v2/trip/resolveMapLink', {url}, navigation, {
    timeout: TIMEOUT.MAP_LINK,
  });

/**
 * Keep a place the traveller found themselves. Stored on the trip's
 * custom_stops, never as a site — it has no owner and no verification, and
 * writing it to `sites` would put an unchecked point into everyone's search.
 */
export const addCustomStop = (stop, navigation) =>
  comnPost('v2/trip/addCustomStop', stop, navigation);

/**
 * Take a pasted place back off the trip.
 *
 * Keyed on the `key` the cart row carries, never on its id: a pasted place's
 * id is negative and renumbers whenever the list changes, so removing by id
 * can take out a different place than the one tapped. Returns the whole cart,
 * like every other cart endpoint.
 */
export const removeCustomStop = (tripId, key, navigation) =>
  comnPost('v2/trip/removeCustomStop', {trip_id: tripId, key}, navigation);

// ── The stepper ─────────────────────────────────────────────────────────────

/**
 * The places step 2 offers, for the towns and interests chosen in step 1.
 *
 * Runs the planner's own candidate query server-side, so the list can never
 * offer a place the planner then refuses to build around. Free, like the
 * quote — browsing spends nothing.
 *
 *   { towns: [name], radius_km, count, truncated, minimum,
 *     places: [{ id, name, mr_name, image, logo, latitude, longitude,
 *                verified, categories: [{code, name}] }] }
 *
 * The place shape is identical to the cart's, so a browse row and a cart row
 * are the same object to the app.
 */
export const browsePlaces = (filters, navigation) =>
  comnPost('v2/trip/places', filters, navigation);
