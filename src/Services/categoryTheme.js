/**
 * categoryTheme — resolves a SITE's category to a visual theme + behaviour kind.
 *
 * Segregation note: this is for PLACE / SITE categories only (city, temple,
 * restaurant, govt office…). Marketplace PRODUCT categories are themed
 * separately by `booking_type` in productTheme() below — never mix the two.
 *
 * kind drives which sections a detail screen shows:
 *   discovery → destinations & attractions (villages, trending, no contact bar)
 *   vendor    → businesses (contact bar + offerings + sticky enquiry)
 *   civic     → government & education (utilitarian, notice, no ratings hero)
 */

// accent = primary; deep = darker shade for gradients; per the approved mockup.
const T = (accent, deep, glyph, kind) => ({accent, deep, glyph, kind});

// keyed by category `code` (exact match wins)
const BY_CODE = {
  // Destination (discovery)
  city: T('#1B6B7B', '#0D3D4A', '🏙️', 'discovery'),
  district: T('#1B6B7B', '#0D3D4A', '🏙️', 'discovery'),
  village: T('#2E5C3A', '#173420', '🏘️', 'discovery'),
  // Kokan View attractions (discovery)
  temple: T('#B5541C', '#5E2A11', '🛕', 'discovery'),
  fort: T('#6B5B45', '#372E22', '🏰', 'discovery'),
  beach: T('#0E8AA0', '#084C5A', '🏖️', 'discovery'),
  waterfall: T('#1B8A6B', '#0C4B3A', '💧', 'discovery'),
  dams: T('#3A6B8C', '#1E3A4C', '💦', 'discovery'),
  garden_park: T('#4A7A3A', '#24401C', '🌳', 'discovery'),
  cave: T('#5A5148', '#2E2924', '🕳️', 'discovery'),
  cultural_site: T('#8A5A2B', '#4A2E12', '🎭', 'discovery'),
  scenic_route: T('#1B8A6B', '#0C4B3A', '🛣️', 'discovery'),
  // Vendors
  restaurant: T('#C1492E', '#6E2415', '🍽️', 'vendor'),
  cafe: T('#B5622A', '#5E2F12', '☕', 'vendor'),
  hotel: T('#2A4A6B', '#152838', '🏨', 'vendor'),
  hotel_rooms: T('#2A4A6B', '#152838', '🏨', 'vendor'),
  lodge: T('#2A4A6B', '#152838', '🛏️', 'vendor'),
  resort: T('#2A4A6B', '#152838', '🏝️', 'vendor'),
  farm_house: T('#4A7A3A', '#24401C', '🏡', 'vendor'),
  tour_operator: T('#0C7C74', '#064541', '🧭', 'vendor'),
  travel_agency: T('#0C7C74', '#064541', '✈️', 'vendor'),
  boat_operator: T('#0E8AA0', '#084C5A', '⛵', 'vendor'),
  taxi_service: T('#C4972A', '#6E5314', '🚕', 'vendor'),
  vehicle_rental: T('#C4972A', '#6E5314', '🚗', 'vendor'),
  playground: T('#C4972A', '#6E5314', '⚽', 'vendor'),
  water_sport: T('#0E8AA0', '#084C5A', '🤿', 'vendor'),
  // Shopping / local services (vendor)
  fish_market: T('#0E8AA0', '#084C5A', '🐟', 'vendor'),
  farm_produce: T('#C48A1E', '#6E4C0C', '🥭', 'vendor'),
  handicraft_shop: T('#8A5A2B', '#4A2E12', '🧶', 'vendor'),
  bakery: T('#B5622A', '#5E2F12', '🥖', 'vendor'),
  // Civic
  school: T('#4B3F86', '#271F4C', '🎓', 'civic'),
  college: T('#4B3F86', '#271F4C', '🎓', 'civic'),
};

// fallback by top-level group `code` when the specific child isn't mapped
const BY_GROUP = {
  destination: T('#1B6B7B', '#0D3D4A', '🧭', 'discovery'),
  kokan_view: T('#1B8A6B', '#0C4B3A', '🌄', 'discovery'),
  tourist_interest: T('#8A5A2B', '#4A2E12', '🎨', 'discovery'),
  accomodation: T('#2A4A6B', '#152838', '🏨', 'vendor'),
  accommodation: T('#2A4A6B', '#152838', '🏨', 'vendor'),
  food: T('#C1492E', '#6E2415', '🍽️', 'vendor'),
  tour_travel: T('#0C7C74', '#064541', '🧭', 'vendor'),
  local_service: T('#5B6B73', '#2E3A40', '🛠️', 'vendor'),
  sport_activity: T('#C4972A', '#6E5314', '⚽', 'vendor'),
  shopping: T('#C48A1E', '#6E4C0C', '🛍️', 'vendor'),
  government: T('#334E7A', '#1B2C48', '🏛️', 'civic'),
  education: T('#4B3F86', '#271F4C', '🎓', 'civic'),
};

const DEFAULT = T('#1B6B7B', '#0D3D4A', '📍', 'discovery');

const norm = s => String(s || '').toLowerCase().trim();

/**
 * Resolve a theme from a site's `categories` array (each {code, name, ...}).
 * Tries the leaf code, then the parent group code, then a name-keyword pass,
 * then the ocean default — so an unmapped/new category still looks intentional.
 */
export const themeForCategories = categories => {
  const cats = Array.isArray(categories) ? categories : [];
  for (const c of cats) {
    const code = norm(c?.code);
    if (BY_CODE[code]) return BY_CODE[code];
  }
  for (const c of cats) {
    const code = norm(c?.code);
    if (BY_GROUP[code]) return BY_GROUP[code];
  }
  // keyword fallback on names (handles unseen child categories)
  const hay = cats.map(c => norm(c?.name) + ' ' + norm(c?.code)).join(' ');
  const kw = [
    ['temple|mandir', 'temple'], ['fort|killa|durg', 'fort'], ['beach|sea', 'beach'],
    ['waterfall|falls', 'waterfall'], ['village', 'village'], ['city|town', 'city'],
    ['hotel|lodge|resort|stay|accomo', 'hotel'], ['restaurant|food|cafe|dhaba', 'restaurant'],
    ['tour operator|travel agency|tour guide|vehicle rental|taxi', 'tour_operator'],
    ['school|college|vidyalaya|educat', 'school'],
    ['office|govt|government|tahsil|panchayat|revenue', 'city'],
  ];
  for (const [re, key] of kw) {
    if (new RegExp(re).test(hay) && BY_CODE[key]) {
      return key === 'city' && /office|govt|government|tahsil|panchayat|revenue/.test(hay)
        ? BY_GROUP.government
        : BY_CODE[key];
    }
  }
  return DEFAULT;
};

/** rgba tint of the accent (for chips, section labels, soft fills). */
export const tint = (hex, a) => {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// ── Marketplace PRODUCT themes — keyed by booking_type, NOT site category ──────
const PRODUCT = {
  date_range: T('#2A4A6B', '#152838', '🛏️', 'stay'), // rooms / stays / tours
  slot: T('#0E8AA0', '#084C5A', '🤿', 'experience'), // activities
  quantity: T('#C48A1E', '#6E4C0C', '🥭', 'produce'), // shop / farm produce
  none: T('#C1492E', '#6E2415', '🍛', 'menu'), // food / services (enquiry)
};

export const productTheme = bookingType =>
  PRODUCT[norm(bookingType)] || PRODUCT.none;

// ── Per-kind section policy ───────────────────────────────────────────────────
// The mockup's core idea: one screen skeleton, but WHICH sections render and in
// WHAT order is decided by the listing's kind. Keep this declarative so a screen
// stays a `policy.order.map(renderers[key])` instead of a wall of conditionals.
//
//   discovery → destination / attraction: villages, trending, hot, events, ads
//   vendor    → business: contact bar first, offerings, sticky WhatsApp enquiry
//   civic     → govt / school: utilitarian. No hero rating, no ad slots.
const POLICY = {
  discovery: {
    contactBar: false,
    heroRating: true,
    ads: true,
    offerings: false,
    bottomBar: 'directions',
    // Hot places lead, then Trending: the hot list is the stronger, editorially
    // curated hook, and Trending's filter chips read better once the eye has
    // already parsed one card rail.
    order: [
      'facts', 'quick', 'about', 'special', 'adMid', 'villages', 'hot',
      'trending', 'events', 'reach', 'location', 'gallery', 'adFoot', 'reviews',
    ],
  },
  vendor: {
    contactBar: true,
    heroRating: true,
    ads: true,
    offerings: true,
    bottomBar: 'whatsapp',
    // Same skeleton/order as discovery — a business just leads with the contact
    // bar and its catalog. Everything stays data-gated, so a restaurant with no
    // child sites simply has no Villages block.
    order: [
      'contact', 'facts', 'quick', 'about', 'special', 'offerings', 'adMid',
      'villages', 'hot', 'trending', 'events', 'reach', 'location', 'gallery',
      'adFoot', 'reviews',
    ],
  },
  civic: {
    contactBar: false,
    heroRating: false,
    ads: false,
    offerings: false,
    bottomBar: 'civic',
    // "Utilitarian and trust-first": hours, what to bring, how to get there.
    // Reviews stay last so users keep the ability to rate/comment a civic site.
    order: ['facts', 'about', 'special', 'reach', 'location', 'gallery', 'reviews'],
  },
};

export const detailPolicy = kind => POLICY[kind] || POLICY.discovery;

// ── Marketplace booking_type presentation ─────────────────────────────────────
// booking_type is informational (v1 is enquiry-only, see docs/app-api-integration).
// It only decides the *presentation*: the pill, which attribute keys surface in
// the booking box, and the CTA wording. i18n keys, resolved by the screen.
const BOOKING = {
  date_range: {
    pillKey: 'MARKETPLACE.BT_DATE_RANGE',
    ctaKey: 'MARKETPLACE.CTA_AVAILABILITY',
    boxKeys: ['check_in', 'check_out', 'checkin', 'checkout', 'min_nights', 'max_guests'],
  },
  slot: {
    pillKey: 'MARKETPLACE.BT_SLOT',
    ctaKey: 'MARKETPLACE.CTA_SLOT',
    boxKeys: ['slots', 'slot', 'timings', 'duration', 'batch_size', 'min_age'],
  },
  quantity: {
    pillKey: 'MARKETPLACE.BT_QUANTITY',
    ctaKey: 'MARKETPLACE.CTA_ORDER',
    boxKeys: ['stock', 'min_order', 'min_quantity', 'grade', 'weight'],
  },
  none: {
    pillKey: 'MARKETPLACE.BT_NONE',
    ctaKey: 'MARKETPLACE.CTA_ENQUIRE',
    boxKeys: [],
  },
};

export const bookingMeta = bookingType => BOOKING[norm(bookingType)] || BOOKING.none;

// ── Category display group ────────────────────────────────────────────────────
/**
 * The hero badge reads "🛕 Temple · Kokan View" in the mockup: the leaf category
 * plus its parent group. getSite returns both rows (leaf + parent) in
 * `categories`, so pick the leaf (has parent_id) and the root (no parent_id).
 */
export const categoryLabels = categories => {
  const cats = (Array.isArray(categories) ? categories : []).filter(Boolean);
  if (cats.length === 0) return {leaf: null, group: null};
  const leaf = cats.find(c => c?.parent_id) || cats[0];
  const group = cats.find(c => !c?.parent_id && c?.id !== leaf?.id) || null;
  return {
    leaf: leaf?.name || null,
    group: group && group.name !== leaf?.name ? group.name : null,
  };
};
