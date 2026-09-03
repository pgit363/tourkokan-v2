/**
 * The one way to read or change a favourite, anywhere in the app.
 *
 * Screens no longer own favourite state. They call `useFavourite(type, id)` and
 * get `{isFav, pending, toggle}` — every other screen showing the same item
 * updates at the same moment, with no API call of its own.
 */
import {useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {comnPost} from './Api/CommonServices';
import {createLogger} from './Logger';
import store from '../../Store';
import {
  favouritesHydrated,
  favouritesSeeded,
  favouriteToggleStarted,
  favouriteToggleSucceeded,
  favouriteToggleFailed,
} from '../Reducers/favouritesSlice';

const log = createLogger('favourites');
const STORAGE_KEY = 'FAVOURITES_V1';

/**
 * Morph types the backend actually accepts — see getData() in the Laravel
 * helpers: City|User|Place|Photos|Blog|Food|Site|Product.
 *
 * These are hardcoded ON PURPOSE. They used to come from i18n as
 * `t('TABLE.SITE')`, and PlaceCard was sending `t('TABLE.SITES')` — "Sites",
 * plural — which matches no case, so the backend answered
 * 400 "Sites Not Exist..!" and every favourite from that card silently failed.
 * A morph type is a wire contract, not display copy; it must never be
 * translatable.
 */
export const FAV = {SITE: 'Site', PRODUCT: 'Product'};

export const favKey = (type, id) => `${type}:${id}`;

// ── persistence ───────────────────────────────────────────────────────────────

const persist = async () => {
  try {
    const {byKey} = store.getState().favourites;
    const slim = {};
    for (const [key, e] of Object.entries(byKey)) {
      if (e.value) slim[key] = {value: true, updatedAt: e.updatedAt};
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch (e) {
    log.warn('[persist] failed', e);
  }
};

/** Call once at boot so favourites survive a restart. */
export const hydrateFavourites = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    store.dispatch(favouritesHydrated(raw ? JSON.parse(raw) : {}));
  } catch (e) {
    log.warn('[hydrate] failed', e);
    store.dispatch(favouritesHydrated({}));
  }
};

// ── seeding from API payloads ────────────────────────────────────────────────

/**
 * Feed any list/detail payload that carries is_favorite back into the store, so
 * the server stays the source of truth without each screen tracking its own
 * flag. Capture `fetchedAt = Date.now()` BEFORE firing the request and pass it
 * here — a toggle made while the request was in flight then wins.
 */
export const seedFavourites = (items, type, fetchedAt) => {
  const list = Array.isArray(items) ? items : [items];
  const entries = [];
  for (const it of list) {
    if (!it || it.id == null) continue;
    const v = it.is_favorite ?? it.is_favourite;
    if (v === undefined || v === null) continue;
    entries.push({key: favKey(type, it.id), value: !!v && v !== '0'});
  }
  if (entries.length) {
    store.dispatch(favouritesSeeded({entries, fetchedAt: fetchedAt ?? Date.now()}));
  }
};

// ── the toggle ────────────────────────────────────────────────────────────────

/**
 * Optimistically flip, call the API, roll back if it fails.
 * Returns the value now showing, or null if the tap was ignored/failed.
 */
export const toggleFavourite = async ({type, id, navigation}) => {
  const key = favKey(type, id);
  const current = store.getState().favourites.byKey[key];

  // Coalesce double-taps. The endpoint is a blind toggle (it deletes if a row
  // exists, inserts otherwise), so two in-flight requests would cancel out.
  if (current?.pending) return null;

  const next = !current?.value;
  store.dispatch(favouriteToggleStarted({key, next, at: Date.now()}));

  const res = await comnPost(
    'v2/addDeleteFavourite',
    {favouritable_type: type, favouritable_id: id},
    navigation,
  );

  // comnPost RESOLVES on failure rather than rejecting, so .catch() never fires
  // and the response body has to be inspected. Every old call site skipped this,
  // which is why a 400 still left the heart looking filled.
  if (res?.data?.success) {
    store.dispatch(favouriteToggleSucceeded({key, serverValue: res.data?.data?.is_favorite}));
    persist();
    return next;
  }

  log.warn('[toggle] failed', {type, id, message: res?.data?.message});
  store.dispatch(favouriteToggleFailed({key}));
  return null;
};

// ── the hook screens use ──────────────────────────────────────────────────────

/**
 * const {isFav, pending, toggle} = useFavourite(FAV.SITE, site.id, site);
 *
 * Pass the source object as `item` and its own is_favorite seeds the store the
 * first time it is seen, so a fresh payload still lights the heart correctly.
 */
export const useFavourite = (type, id, item) => {
  const dispatch = useDispatch();
  const key = favKey(type, id);
  const known = useSelector(s => s.favourites.byKey[key]);

  // Fall back to whatever the payload said until the store knows about it.
  const seeded = item ? (item.is_favorite ?? item.is_favourite) : undefined;
  const isFav = known ? known.value : !!seeded && seeded !== '0';
  const pending = !!known?.pending;

  const toggle = useCallback(
    navigation => toggleFavourite({type, id, navigation}),
    [type, id],
  );

  return {isFav, pending, toggle, dispatch};
};

export default useFavourite;
