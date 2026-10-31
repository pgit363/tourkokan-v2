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
  removeFromCart,
  reorderCart,
  updateCart,
} from './Api/TripServices';
import {
  cartCleared,
  cartLoading,
  cartOpFailed,
  cartOpStarted,
  cartReceived,
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
