/**
 * The one way to read or change the trip cart, anywhere in the app.
 *
 * Screens do not own cart state and do not call the API directly. A place card
 * calls `useInTrip(siteId)` and gets `{inTrip, pending, toggle}`; every other
 * card showing the same place, and the cart badge in the header, move at the
 * same moment.
 *
 * Mirrors `favourites.js` deliberately — same shape, same habits — so the two
 * read alike. The difference is that every cart endpoint returns the whole
 * cart, so there is no per-item reconciliation here.
 */
import {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import i18n from '../localization/i18n';
import {createLogger} from './Logger';
import {
  addToCart,
  browsePlaces,
  getCart,
  planFromCart,
  planTrip,
  quoteTrip,
  removeCustomStop,
  removeFromCart,
  reorderCart,
  tripQuestionSet,
  updateCart,
} from './Api/TripServices';
import {
  cartCleared,
  cartLoading,
  cartOpFailed,
  cartOpStarted,
  browseReceived,
  browseStarted,
  cartReceived,
  generateFailed,
  generateStarted,
  generateSucceeded,
  optionsReceived,
  optionsStarted,
  quoteReceived,
  quoteStarted,
  selectCart,
  selectCartPending,
  selectInCart,
} from '../Reducers/tripSlice';

const log = createLogger('trip');

/** True when the envelope says the call worked. HTTP 200 alone does not. */
const ok = res => res?.data?.success === true;

/**
 * The cart itself, plus the actions the cart screen needs.
 */
export const useTripCart = () => {
  const dispatch = useDispatch();
  const cart = useSelector(selectCart);

  /** Load the open cart, or a specific trip. */
  const refresh = useCallback(
    async (tripId, navigation) => {
      dispatch(cartLoading(true));
      try {
        const res = await getCart(tripId ?? cart.tripId, navigation);
        if (ok(res)) {
          dispatch(cartReceived(res.data.data));
          return true;
        }
        dispatch(cartLoading(false));
      } catch (e) {
        log.error('cart refresh failed', {message: e?.message});
        dispatch(cartLoading(false));
      }
      return false;
    },
    [dispatch, cart.tripId],
  );

  /** Days, base town or title. Each returns the whole cart. */
  const update = useCallback(
    async (changes, navigation) => {
      if (!cart.tripId) {
        return false;
      }
      dispatch(cartLoading(true));
      try {
        const res = await updateCart(cart.tripId, changes, navigation);
        if (ok(res)) {
          dispatch(cartReceived(res.data.data));
          return true;
        }
        dispatch(cartLoading(false));
      } catch (e) {
        log.error('cart update failed', {message: e?.message});
        dispatch(cartLoading(false));
      }
      return false;
    },
    [dispatch, cart.tripId],
  );

  /**
   * Persist the order after a drag. The caller has already reordered its own
   * list for the gesture to feel immediate; the server response then replaces
   * it, so a rejected reorder snaps back to the truth on its own.
   */
  const reorder = useCallback(
    async (siteIds, navigation) => {
      if (!cart.tripId) {
        return false;
      }
      try {
        const res = await reorderCart(cart.tripId, siteIds, navigation);
        if (ok(res)) {
          dispatch(cartReceived(res.data.data));
          return true;
        }
      } catch (e) {
        log.error('cart reorder failed', {message: e?.message});
      }
      return false;
    },
    [dispatch, cart.tripId],
  );

  const clear = useCallback(() => dispatch(cartCleared()), [dispatch]);

  return {cart, refresh, update, reorder, clear};
};

/**
 * One place's membership of the trip. This is what a place card binds to.
 *
 * `toggle` is safe to call repeatedly — a second tap while the first is in
 * flight is ignored rather than queued, which is what stops a double tap from
 * adding and immediately removing.
 */
export const useInTrip = (siteId, customKey = null) => {
  const dispatch = useDispatch();
  const inTrip = useSelector(selectInCart(siteId));
  const pending = useSelector(selectCartPending(siteId));
  const tripId = useSelector(state => state.trip.tripId);

  const toggle = useCallback(
    async navigation => {
      if (pending || !siteId) {
        return;
      }

      dispatch(cartOpStarted(siteId));

      try {
        // A pasted place has no row in `sites`, so removeFromCart had nothing
        // to delete and its X was a button that did nothing. There is no
        // "add" side to it either — it is created by addCustomStop, not
        // ticked — so for these the toggle only ever removes.
        const res = customKey
          ? await removeCustomStop(tripId, customKey, navigation)
          : inTrip
          ? await removeFromCart(siteId, tripId, navigation)
          : // No trip_id on the first tick: the server opens the cart, so
            // browsing never has to think about trips.
            await addToCart(siteId, tripId, navigation);

        if (ok(res)) {
          dispatch(cartReceived(res.data.data));
          return;
        }

        // A refusal the traveller should see rather than a silent no-op —
        // adding a bus stop, for instance.
        log.warn('cart toggle refused', {
          siteId,
          reason: res?.data?.data?.reason,
        });
        dispatch(cartOpFailed(siteId));
      } catch (e) {
        log.error('cart toggle failed', {siteId, message: e?.message});
        dispatch(cartOpFailed(siteId));
      }
    },
    [customKey, dispatch, inTrip, pending, siteId, tripId],
  );

  return {inTrip, pending, toggle};
};

/**
 * Generating a plan from the cart.
 *
 * Separate from `useTripCart` because the itinerary screen cares about a
 * different question — is it ready, did it fail, and why — and nothing else
 * in the app needs to trigger a generation.
 */
export const useTripPlanner = () => {
  const dispatch = useDispatch();
  const {
    itinerary,
    itineraryTripId,
    generating,
    error,
    retryAfter,
    credits,
    tripId,
    places,
  } = useSelector(selectCart);

  /**
   * Generate, from a cart or from the form's filters.
   *
   * Both entry points land here and both come back in the same shape, so the
   * itinerary screen never needs to know which one it was.
   */
  const generate = useCallback(
    async ({tripId: id, filters} = {}, navigation) => {
      const target = id ?? (filters ? null : tripId);

      if (!target && !filters) {
        return false;
      }

      if (generating) {
        return false;
      }

      dispatch(generateStarted());

      try {
        const res = filters
          ? await planTrip(filters, navigation)
          : await planFromCart(target, navigation);

        if (ok(res)) {
          dispatch(generateSucceeded(res.data.data));
          return true;
        }

        // Throttling is the one refusal the server cannot phrase in our own
        // envelope: Laravel's rate limiter answers 429 with its own body
        // before the controller runs, so there is no `reason` to read. Map it
        // here, carrying Retry-After so the screen can count down honestly.
        if (res?.status === 429) {
          dispatch(
            generateFailed({
              reason: 'rate_limited',
              retry_after: res?.retryAfter || null,
            }),
          );
          return false;
        }

        // We stopped waiting — the server may well still be writing the
        // plan. Distinct from a refusal on purpose: "that did not come out
        // right" sends the traveller looking for a problem with their trip,
        // when the honest answer is to look in My Trips in a moment.
        if (res?.timedOut) {
          dispatch(generateFailed({reason: 'timeout'}));
          return false;
        }

        // A refusal, not a crash: the server names the reason and the screen
        // decides what to say about it.
        dispatch(generateFailed(res?.data?.data || {}));
      } catch (e) {
        log.error('generation failed', {tripId: target, message: e?.message});
        dispatch(generateFailed({reason: 'network'}));
      }


      return false;
    },
    [dispatch, generating, tripId],
  );

  return {
    itinerary,
    itineraryTripId,
    generating,
    error,
    /** Seconds until a throttled traveller may plan again; null otherwise. */
    retryAfter,
    credits,
    /** The places the traveller picked themselves, to badge in the plan. */
    picked: places,
    generate,
  };
};

/**
 * The plan form: what it may offer, and what the current filters would give.
 *
 * Both halves come from the server. The options do because an interest with
 * nothing behind it must not be offered, and only the database knows which
 * those are. The quote does because the floor — days × stops per day — lives
 * in `ai_configs`, so an app that worked it out locally would eventually
 * promise a plan the server then refuses.
 */
export const useTripForm = () => {
  const dispatch = useDispatch();
  const {options, optionsLoading, quote, quoting} = useSelector(selectCart);

  /** Load the options once per visit to the form. */
  const load = useCallback(
    async navigation => {
      dispatch(optionsStarted());
      try {
        const res = await tripQuestionSet(navigation);
        if (ok(res)) {
          dispatch(optionsReceived(res.data.data));
          return true;
        }
      } catch (e) {
        log.error('question set failed', {message: e?.message});
      }
      dispatch(optionsReceived(null));
      return false;
    },
    [dispatch],
  );

  /**
   * Ask what the filters would give. Called as the traveller changes their
   * mind, so it clears the previous answer first — a stale "37 places" beside
   * a filter set that no longer produces them is worse than a blank.
   */
  const ask = useCallback(
    async (filters, navigation) => {
      dispatch(quoteStarted());
      try {
        const res = await quoteTrip(filters, navigation);
        // A refusal is still an answer here: `can_plan: false` with a reason
        // is exactly what the form needs in order to explain itself.
        dispatch(quoteReceived(res?.data?.data ?? null));
        return res?.data?.data?.can_plan === true;
      } catch (e) {
        log.error('quote failed', {message: e?.message});
        dispatch(quoteReceived(null));
      }
      return false;
    },
    [dispatch],
  );

  return {options, loading: optionsLoading, quote, quoting, load, ask};
};

/**
 * Step 2's list of places to pick from.
 *
 * Kept in the store rather than in the screen because the cart badge, the map
 * view and the list all read the same set, and because walking back from step
 * 3 should not refetch what has not changed.
 */
export const useTripPlaces = () => {
  const dispatch = useDispatch();
  const {browse, browseTowns, browseLoading, browseTruncated, minimum} =
    useSelector(selectCart);

  /**
   * Fetch for a filter set. Returns false on refusal so the screen can say
   * what happened rather than showing an empty list as if nothing matched.
   */
  const fetch = useCallback(
    async (filters, navigation) => {
      if (!filters?.town_site_ids?.length) {
        return false;
      }

      dispatch(browseStarted());

      try {
        const res = await browsePlaces(filters, navigation);

        if (ok(res)) {
          dispatch(browseReceived(res.data.data));
          return true;
        }

        log.warn('browse refused', {reason: res?.data?.data?.reason});
      } catch (e) {
        log.error('browse failed', {message: e?.message});
      }

      dispatch(browseReceived(null));
      return false;
    },
    [dispatch],
  );

  return {
    places: browse,
    towns: browseTowns,
    loading: browseLoading,
    truncated: browseTruncated,
    minimum,
    fetch,
  };
};

/**
 * A place's category names, in the reader's language.
 *
 * The payload carries `name` and `mr_name` for each category, exactly as it
 * does for the place itself. Reading `c.name` straight is how a Marathi
 * screen came to print "Beach" underneath a Marathi place name — on the same
 * screen whose interest chips said "समुद्रकिनारा". One helper so that rule
 * lives in a single place rather than in each of the six screens that show
 * these rows.
 *
 * The language is read from the i18next instance rather than passed in: every
 * screen rendering these rows subscribes to it through `useTranslation`, so a
 * change re-renders the parent and these children along with it.
 */
export const categoryNames = place =>
  (place?.categories || [])
    .map(c => (i18n.language === 'mr' && c.mr_name ? c.mr_name : c.name))
    .filter(Boolean);
