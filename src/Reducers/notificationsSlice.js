/**
 * Unread message/notification count for the header bell.
 *
 * Kept in the store rather than in HomeScreen's local state so every screen that
 * renders the bell shows the same number, and so refreshing it is not tied to
 * Home being focused.
 */
import {createSlice} from '@reduxjs/toolkit';

const notifications = createSlice({
  name: 'notifications',
  initialState: {unreadCount: 0, lastFetchedAt: 0, loading: false},
  reducers: {
    unreadLoading(state, action) {
      state.loading = !!action.payload;
    },
    unreadSet(state, action) {
      state.unreadCount = Math.max(0, Number(action.payload) || 0);
      state.lastFetchedAt = Date.now();
      state.loading = false;
    },
    /** After a message is marked read locally. */
    unreadDecrement(state) {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
  },
  extraReducers: builder => {
    builder.addMatcher(
      action => action.type === 'ResetStore',
      () => ({unreadCount: 0, lastFetchedAt: 0, loading: false}),
    );
  },
});

export const {unreadLoading, unreadSet, unreadDecrement} = notifications.actions;
export default notifications.reducer;
