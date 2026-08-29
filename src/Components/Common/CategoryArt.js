/**
 * CategoryArt — the themed stand-in shown wherever a site or product has no
 * photo of its own.
 *
 * It replaces the bundled stock photos that used to fill that gap. Those had
 * three problems: one shared photo repeated across every card in a list (a wall
 * of identical bricks), photos that read as the *place itself* when they were
 * only decoration, and CC-BY / CC-BY-SA credits the app never surfaced.
 *
 * This draws instead: the category's own accent gradient plus its icon, so a
 * Temple tile is saffron, a Beach tile aqua, a Govt office navy — and every
 * card in a row is visibly a different thing. Vector art, so it is crisp at a
 * 44dp row thumb and at a 400dp hero, costs no bundle weight, and any category
 * the resolver has never seen still gets a coherent tile.
 */
import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {themeForCategories, productTheme, tint} from '../../Services/categoryTheme';

// Icon per category `code`. Names verified against the installed
// MaterialCommunityIcons glyphmap — an unknown name renders blank, so keep new
// entries checked against node_modules/react-native-vector-icons/glyphmaps/.
const BY_CODE = {
  // Destinations
  city: 'city-variant-outline',
  district: 'city-variant-outline',
  village: 'home-group',
  // Attractions
  temple: 'hands-pray',
  cultural_site: 'palette',
  fort: 'castle',
  beach: 'beach',
  waterfall: 'waterfall',
  dams: 'water',
  garden_park: 'tree',
  cave: 'image-filter-hdr',
  scenic_route: 'road-variant',
  // Food
  restaurant: 'silverware-fork-knife',
  cafe: 'coffee',
  bakery: 'bread-slice',
  // Stays
  hotel: 'bed',
  hotel_rooms: 'bed',
  lodge: 'bed',
  resort: 'home-city',
  farm_house: 'home-city',
  // Tour & travel
  tour_operator: 'compass-outline',
  travel_agency: 'airplane',
  boat_operator: 'sail-boat',
  taxi_service: 'taxi',
  vehicle_rental: 'car',
  // Activities
  playground: 'soccer',
  water_sport: 'diving-snorkel',
  // Shopping & services
  fish_market: 'fish',
  farm_produce: 'fruit-cherries',
  handicraft_shop: 'palette',
  // Civic
  school: 'school',
  college: 'school',
  tahsil_office: 'bank',
  grampanchayat: 'bank',
  panchayat_samiti: 'bank',
  zilla_parishad: 'bank',
  municipal_council: 'bank',
  police_station: 'police-badge',
  post_office: 'email',
  hospital: 'hospital-building',
  bank_branch: 'bank',
};

// Last-resort keyword pass, mirroring themeForCategories' own fallback so a
// category the map has never seen still gets a meaningful icon rather than a pin.
const BY_KEYWORD = [
  [/temple|mandir|math\b/, 'hands-pray'],
  [/church/, 'church'],
  [/mosque|masjid|dargah/, 'mosque'],
  [/fort|killa|durg/, 'castle'],
  [/beach|sea|kinara/, 'beach'],
  [/waterfall|falls|dhabdhaba/, 'waterfall'],
  [/dam|lake|river|backwater/, 'water'],
  [/village|gaon|wadi/, 'home-group'],
  [/city|town|taluka|district/, 'city-variant-outline'],
  [/hotel|lodge|resort|stay|homestay|accomo/, 'bed'],
  [/restaurant|food|cafe|dhaba|hotel_food|thali/, 'silverware-fork-knife'],
  [/tour|travel|guide|taxi|rental|transport/, 'compass-outline'],
  [/boat|ferry|jetty/, 'sail-boat'],
  [/school|college|vidyalaya|educat|library/, 'school'],
  [/office|govt|government|tahsil|panchayat|revenue|municipal|nagar|zilla/, 'bank'],
  [/police|station/, 'police-badge'],
  [/hospital|clinic|health|medical/, 'hospital-building'],
  [/market|shop|store|bazaar/, 'store'],
  [/garden|park|udyan/, 'tree'],
  [/cave|hill|mountain|ghat|point/, 'image-filter-hdr'],
];

const BY_GROUP = {
  destination: 'map-marker',
  kokan_view: 'image-filter-hdr',
  tourist_interest: 'palette',
  accomodation: 'bed',
  accommodation: 'bed',
  food: 'silverware-fork-knife',
  tour_travel: 'compass-outline',
  local_service: 'hammer-wrench',
  sport_activity: 'soccer',
  shopping: 'shopping',
  government: 'bank',
  education: 'school',
};

// Marketplace products are themed by booking_type, never by site category.
const BY_BOOKING = {
  date_range: 'bed',
  slot: 'diving-snorkel',
  quantity: 'fruit-cherries',
  none: 'silverware',
};

const norm = s => String(s || '').toLowerCase().trim();

/** Icon name for a site's categories, mirroring the resolver's leaf→group order. */
export const categoryIconName = categories => {
  const cats = Array.isArray(categories) ? categories : [];
  for (const c of cats) {
    if (BY_CODE[norm(c?.code)]) return BY_CODE[norm(c?.code)];
  }
  for (const c of cats) {
    if (BY_GROUP[norm(c?.code)]) return BY_GROUP[norm(c?.code)];
  }
  const hay = cats.map(c => `${norm(c?.name)} ${norm(c?.code)}`).join(' ');
  for (const [re, icon] of BY_KEYWORD) {
    if (re.test(hay)) return icon;
  }
  return 'map-marker';
};

/**
 * props:
 *   categories   site categories → theme + icon (place/vendor/civic)
 *   bookingType  marketplace product → productTheme + icon (use instead of categories)
 *   style        sizing/rounding, as you would style an <Image>
 *   iconName     override the resolved icon
 */
const CategoryArt = ({categories, bookingType, style, iconName}) => {
  const [box, setBox] = useState(null);

  const theme = bookingType != null
    ? productTheme(bookingType)
    : themeForCategories(categories);
  const name = iconName
    || (bookingType != null ? BY_BOOKING[norm(bookingType)] || 'store' : categoryIconName(categories));

  // Scale the icon to whatever box we were given — one component serves a 44dp
  // row thumb and a 400dp hero.
  const side = box ? Math.min(box.w, box.h) : 0;
  const iconSize = Math.max(13, Math.min(Math.round(side * 0.42), 96));
  // Decorative motif, sized off the box so it reads the same at every scale.
  const blob = Math.round(side * 1.15);

  return (
    <View
      style={[styles.root, {backgroundColor: theme.deep}, style]}
      onLayout={e => {
        const {width: w, height: h} = e.nativeEvent.layout;
        if (w > 0 && h > 0 && (box?.w !== w || box?.h !== h)) setBox({w, h});
      }}>
      <LinearGradient
        colors={[theme.accent, theme.deep]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      {side > 56 && (
        <View
          pointerEvents="none"
          style={[
            styles.blob,
            {
              width: blob, height: blob, borderRadius: blob / 2,
              right: -blob * 0.42, top: -blob * 0.34,
              backgroundColor: tint('#FFFFFF', 0.09),
            },
          ]}
        />
      )}
      {side > 0 && (
        <Icon name={name} size={iconSize} color="rgba(255,255,255,0.92)" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  blob: {position: 'absolute'},
});

export default CategoryArt;
