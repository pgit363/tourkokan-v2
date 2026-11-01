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
import {createLogger} from './Logger';
import {
  addToCart,
  getCart,
  planFromCart,
  planTrip,
  quoteTrip,
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
export const useInTrip = siteId => {
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
        const res = inTrip
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
    [dispatch, inTrip, pending, siteId, tripId],
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
  const {itinerary, itineraryTripId, generating, error, credits, tripId, places} =
    useSelector(selectCart);

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
