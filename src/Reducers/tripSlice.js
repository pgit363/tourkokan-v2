/**
 * The trip a traveller is filling — one cart, shared by every screen.
 *
 * Simpler than `favouritesSlice` on purpose. Favourites track a per-item
 * `serverValue` because each toggle is its own request and only that item comes
 * back. Here every cart endpoint returns the WHOLE cart, so the last server
 * response is always the complete truth: there is nothing to reconcile and no
 * per-item rollback target to keep.
 *
 * What is optimistic is only the in-flight marker, so a tapped checkbox can
 * show a spinner and ignore further taps without the list going stale.
 *
 * `minimum` and `canPlan` come from the server rather than being re-derived
 * here. The minimum lives in `ai_configs`, so an admin can change it without an
 * app release — an app that hardcoded 3 would silently disagree the moment it
 * moved.
 */
import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  tripId: null,
  title: null,
  status: 'draft',
  days: 2,
  baseSiteId: null,
  count: 0,
  minimum: 3,
  canPlan: false,
  places: [],
  /** siteId -> true while an add or remove is in flight. */
  pending: {},
  loading: false,

  // ── Generation ────────────────────────────────────────────────────────────
  /** The finished plan, or null. Kept separate from the cart it came from. */
  itinerary: null,
  /** Which trip the plan above belongs to, so a different trip re-generates. */
  itineraryTripId: null,
  generating: false,
  /** A refusal reason from the server, which the screen maps to copy. */
  error: null,
  /** Free plans left, as the server last reported them. */
  credits: null,
};

const trip = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    cartLoading(state, action) {
      state.loading = action.payload !== false;
    },

    /** A tap has been sent; the checkbox shows a spinner and stops responding. */
    cartOpStarted(state, action) {
      state.pending[action.payload] = true;
    },

    /**
     * The server's view of the cart, which replaces ours entirely.
     * Payload is `res.data.data` from any cart endpoint.
     */
    cartReceived(state, action) {
      const d = action.payload || {};

      state.tripId = d.trip_id ?? null;
      state.title = d.title ?? null;
      state.status = d.status ?? 'draft';
      state.days = d.days ?? 2;
      state.baseSiteId = d.base_site_id ?? null;
      state.count = d.count ?? 0;
      state.minimum = d.minimum ?? 3;
      state.canPlan = !!d.can_plan;
      state.places = Array.isArray(d.places) ? d.places : [];
      state.pending = {};
      state.loading = false;
    },

    /**
     * The call failed. Only the spinner is cleared — the list on screen is
     * still what the server last confirmed, so there is nothing to undo.
     */
    cartOpFailed(state, action) {
      delete state.pending[action.payload];
      state.loading = false;
    },

    /** Signing out, or starting a fresh trip. */
    cartCleared() {
      return {...initialState};
    },

    generateStarted(state) {
      state.generating = true;
      state.error = null;
    },

    generateSucceeded(state, action) {
      state.generating = false;
      state.error = null;
      state.itinerary = action.payload?.itinerary ?? null;
      state.itineraryTripId = action.payload?.trip_id ?? null;
      state.credits = action.payload?.credits ?? state.credits;
      // The cart has become a trip; the cart screen should reflect that
      // rather than still offering to plan it.
      state.status = 'generated';
    },

    /**
     * Payload is the server's `reason`, not a sentence. Copy is chosen in the
     * screen so the same reason can read differently in different places.
     */
    generateFailed(state, action) {
      state.generating = false;
      state.error = action.payload?.reason ?? 'generation_failed';
      if (action.payload?.credits != null) {
        state.credits = action.payload.credits;
      }
    },
  },
});

export const {
  cartLoading,
  cartOpStarted,
  cartReceived,
  cartOpFailed,
  cartCleared,
  generateStarted,
  generateSucceeded,
  generateFailed,
} = trip.actions;

// ── Selectors ───────────────────────────────────────────────────────────────

export const selectCart = state => state.trip;
export const selectCartCount = state => state.trip.count;
export const selectCanPlan = state => state.trip.canPlan;

/** Is this place already in the trip? Drives the ticked state on a card. */
export const selectInCart = siteId => state =>
  state.trip.places.some(p => p.id === siteId);

export const selectCartPending = siteId => state => !!state.trip.pending[siteId];

export const selectItinerary = state => state.trip.itinerary;
export const selectGenerating = state => state.trip.generating;
export const selectGenerateError = state => state.trip.error;

export default trip.reducer;
