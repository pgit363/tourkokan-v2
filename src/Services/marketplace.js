/**
 * Marketplace domain helpers — the small rules from docs/app-api-integration.md,
 * in one place so every screen applies them the same way.
 */
import {AWS_URL} from '@env';

/** Absolute URI for a storage path. Relative paths get AWS_URL; absolute pass through. */
export const mediaUri = path =>
  !path ? null : String(path).startsWith('http') ? path : `${AWS_URL}${path}`;

/** Cover image URI for a product row (listProducts / productDetail / myProducts). */
export const productCoverUri = p =>
  mediaUri(
    p?.cover?.path ||
      p?.cover?.path_url ||
      p?.gallery?.find(g => !!Number(g.is_cover))?.path ||
      p?.gallery?.[0]?.path ||
      p?.image ||
      null,
  );

/**
 * Product gallery ordered with the cover first — backend returns is_cover as
 * 1/0 (not boolean), so coerce before sorting. Falls back to the original
 * order when no explicit cover is flagged.
 */
export const productGallery = p => {
  const g = Array.isArray(p?.gallery) ? p.gallery : [];
  if (g.length === 0) return [];
  return [...g].sort(
    (a, b) => Number(b.is_cover || 0) - Number(a.is_cover || 0),
  );
};

/**
 * The price the customer actually pays — from the default variant, never
 * base_price alone (base_price is a stale "starting from").
 */
export const productPrice = p => {
  const dv =
    p?.default_variant ||
    (Array.isArray(p?.variants)
      ? p.variants.find(v => v.is_default) || p.variants[0]
      : null);
  const val =
    dv?.sale_price ?? dv?.price ?? p?.sale_price ?? p?.base_price ?? p?.price;
  return val != null ? Number(val) : null;
};

/** Localised field with English fallback (name/mr_name, description/mr_description). */
export const localised = (obj, field, lang) => {
  if (!obj) return '';
  const mr = obj[`mr_${field}`];
  return lang === 'mr' && mr ? mr : obj[field] || '';
};

/** unit → human suffix, e.g. "per_night" → "/ night". */
export const unitSuffix = unit =>
  unit ? '/ ' + String(unit).replace(/^per_/, '').replace(/_/g, ' ') : '';

/** booking_type → the card/detail visual family the design uses. */
const BOOKING_STYLE = {
  date_range: 'stay',
  slot: 'experience',
  quantity: 'produce',
  none: 'service',
};

export const cardStyleFor = product => {
  const cat = product?.product_category || {};
  const bt = cat.booking_type;
  // `none` covers both food (menu/thali) and services — split by category code.
  if (bt === 'none' && /menu|thali|food|meal/.test(cat.code || '')) return 'food';
  return BOOKING_STYLE[bt] || 'service';
};

/** Product lifecycle status → { label, tone } for a status pill. */
export const STATUS_TONE = {
  approved: {label: 'Live', tone: 'live'},
  live: {label: 'Live', tone: 'live'},
  pending: {label: 'Pending', tone: 'pending'},
  draft: {label: 'Draft', tone: 'draft'},
  rejected: {label: 'Rejected', tone: 'rejected'},
  paused: {label: 'Paused', tone: 'paused'},
};
