/**
 * Central favourites state.
 *
 * Before this, every card and detail screen kept its OWN `isFav` useState and
 * made its own `v2/addDeleteFavourite` call. Nothing told anyone else, so a
 * heart toggled on a detail page did not move on Home until that screen happened
 * to refetch — and nothing ever rolled back when the request failed.
 *
 * One entry per favouritable thing, keyed `${type}:${id}` (e.g. "Site:42"):
 *   value       what the UI renders right now (optimistic)
 *   pending     a request is in flight → show a spinner, ignore further taps
 *   serverValue last value the server confirmed — the rollback target
 *   updatedAt   ms epoch of the last LOCAL mutation, used to win races against
 *               a slower list response that still carries the old flag
 */
import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  byKey: {},
  hydrated: false,
};

const entry = (state, key) =>
  state.byKey[key] || (state.byKey[key] = {
    value: false, pending: false, serverValue: false, updatedAt: 0,
  });

const favourites = createSlice({
  name: 'favourites',
  initialState,
  reducers: {
    /** Restore from AsyncStorage at boot. */
    favouritesHydrated(state, action) {
      const map = action.payload || {};
      for (const [key, saved] of Object.entries(map)) {
        state.byKey[key] = {
          value: !!saved.value,
          serverValue: !!saved.value,
          updatedAt: saved.updatedAt || 0,
          // A toggle that was in flight when the app died must not come back
          // as a permanently stuck spinner.
          pending: false,
        };
      }
      state.hydrated = true;
    },

    /**
     * Bulk-merge flags out of any API payload that carries is_favorite.
     * `fetchedAt` must be captured BEFORE the request went out — that is what
     * lets a toggle made mid-flight beat the stale list response it raced.
     */
    favouritesSeeded(state, action) {
      const {entries = [], fetchedAt = 0} = action.payload || {};
      for (const {key, value} of entries) {
        const e = entry(state, key);
        if (e.pending) continue;              // never clobber an in-flight toggle
        if ((e.updatedAt || 0) > fetchedAt) continue;  // local change is newer
        e.value = !!value;
        e.serverValue = !!value;
      }
    },

    favouriteToggleStarted(state, action) {
      const {key, next} = action.payload;
      const e = entry(state, key);
      e.value = !!next;
      e.pending = true;
      e.updatedAt = action.payload.at;
    },

    favouriteToggleSucceeded(state, action) {
      const {key, serverValue} = action.payload;
      const e = entry(state, key);
      e.pending = false;
      // The endpoint returns no boolean today, so the optimistic value is simply
      // promoted. If the backend starts returning one this self-corrects.
      if (typeof serverValue === 'boolean') e.value = serverValue;
      e.serverValue = e.value;
    },

    /** The rollback that did not exist anywhere in the app before. */
    favouriteToggleFailed(state, action) {
      const e = entry(state, action.payload.key);
      e.value = e.serverValue;
      e.pending = false;
    },
  },
  extraReducers: builder => {
    // A 401 dispatches plain 'ResetStore' (see CommonServices) — drop favourites
    // with the session so the next user does not inherit them.
    builder.addMatcher(
      action => action.type === 'ResetStore',
      () => ({...initialState}),
    );
  },
});

export const {
  favouritesHydrated,
  favouritesSeeded,
  favouriteToggleStarted,
  favouriteToggleSucceeded,
  favouriteToggleFailed,
} = favourites.actions;

export default favourites.reducer;
