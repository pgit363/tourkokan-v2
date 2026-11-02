/**
 * A map marker that says what it is.
 *
 * A row of identical red pins tells a traveller nothing — they have to tap
 * each one to find out whether it is a beach or a fort. So each marker carries
 * a glyph for its category and a short name.
 *
 * The name is shortened by dropping the category word when the name already
 * ends in it: "Tarkarli Beach" under a beach glyph becomes "Tarkarli", which
 * is both shorter and no less clear. Names that do not follow that pattern are
 * truncated instead.
 *
 * `tracksViewChanges` is turned off after the first paint. A custom marker
 * view on Android re-renders on every frame while it is true, and with sixty
 * markers that is the difference between a map you can pan and one you cannot.
 */
import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Marker} from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import GlobalText from '../Customs/Text';
import {C} from '../Marketplace/theme';

/**
 * Category code → a glyph, and the words this dataset puts at the end of such
 * a name. Temples are written both ways here ("… Temple" and "… Mandir").
 */
const KINDS = {
  beach: {icon: 'sunny-outline', words: ['beach']},
  fort: {icon: 'business-outline', words: ['fort', 'gad', 'killa']},
  temple: {icon: 'flower-outline', words: ['temple', 'mandir']},
  waterfall: {icon: 'water-outline', words: ['waterfall', 'falls']},
  dams: {icon: 'water-outline', words: ['dam']},
  river: {icon: 'water-outline', words: ['river']},
  lake: {icon: 'water-outline', words: ['lake']},
  garden_park: {icon: 'leaf-outline', words: ['garden', 'park']},
  hotel_rooms: {icon: 'bed-outline', words: ['hotel', 'rooms']},
  resort: {icon: 'bed-outline', words: ['resort']},
  playground: {icon: 'football-outline', words: ['playground', 'ground']},
  cave: {icon: 'triangle-outline', words: ['cave']},
  market: {icon: 'basket-outline', words: ['market']},
};

const FALLBACK = {icon: 'location-outline', words: []};

const MAX_LABEL = 17;

const kindOf = place => {
  for (const c of place.categories || []) {
    if (KINDS[c.code]) {
      return KINDS[c.code];
    }
  }

  return FALLBACK;
};

/**
 * A name short enough to read on a pin.
 *
 * Places here are named to a pattern — "Shri Dev Vimaleshwar Temple, Wada" —
 * and the parts that identify the place are in the middle. Trimming from both
 * ends beats truncating, which would have given "Shri Dev Vimale…" and told
 * the traveller nothing. The glyph already says it is a temple.
 *
 * Nothing is dropped if what remains would be too short to mean anything, so
 * a name like "Vetalgad" or "Beach" survives whole.
 */
export const shortName = (name, words = []) => {
  let out = (name || '').trim();

  const keep = candidate => {
    const trimmed = candidate.replace(/[\s,&.-]+$/, '').trim();

    if (trimmed.length >= 3) {
      out = trimmed;
    }
  };

  // "Vengurla Beach (Ubhadanda)" — the qualifier is for a list, not a pin.
  keep(out.replace(/\s*\([^)]*\)\s*$/, ''));
  // "…, Malvan" — the town is already the screen's own heading.
  keep(out.replace(/,[^,]*$/, ''));
  // Honorifics, then the divine prefix they usually precede.
  keep(out.replace(/^(shri|shree|sri|saint|st\.?)\s+/i, ''));
  keep(out.replace(/^(dev|devi)\s+/i, ''));

  // The category word, which the glyph is already showing.
  for (const word of words) {
    keep(out.replace(new RegExp(`\\s+${word}s?$`, 'i'), ''));
  }

  return out.length > MAX_LABEL ? `${out.slice(0, MAX_LABEL - 1)}…` : out;
};

const PlaceMarker = ({place, selected, inTrip, onPress}) => {
  const [tracking, setTracking] = useState(true);

  // One extra frame to let the label lay out, then stop redrawing it.
  useEffect(() => {
    const timer = setTimeout(() => setTracking(false), 600);

    return () => clearTimeout(timer);
  }, []);

  const lat = parseFloat(place.latitude);
  const lng = parseFloat(place.longitude);

  // A non-numeric coordinate renders a marker at (0,0), out in the Atlantic.
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const kind = kindOf(place);

  return (
    <Marker
      coordinate={{latitude: lat, longitude: lng}}
      tracksViewChanges={tracking}
      // Still set, so the platform's own callout and screen readers have the
      // full name even though the label on the map is shortened.
      title={place.name}
      onPress={e => {
        // Stop the tap reaching the map, which would clear the selection it
        // has just made.
        e.stopPropagation?.();
        onPress(place);
      }}>
      <View
        style={[s.pin, inTrip && s.pinOn, selected && s.pinSelected]}
        accessible
        accessibilityLabel={place.name}>
        <Ionicons
          name={inTrip ? 'checkmark' : kind.icon}
          size={13}
          color={inTrip ? C.oceanDeep : C.white}
        />
        <GlobalText
          style={[s.label, inTrip && s.labelOn]}
          text={shortName(place.name, kind.words)}
        />
      </View>
      <View style={[s.tail, inTrip && s.tailOn, selected && s.tailSelected]} />
    </Marker>
  );
};

PlaceMarker.propTypes = {
  place: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  inTrip: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
};

const s = StyleSheet.create({
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: C.oceanMid,
    borderWidth: 1.5,
    borderColor: C.white,
  },
  pinOn: {backgroundColor: C.oceanFoam, borderColor: C.oceanDeep},
  pinSelected: {backgroundColor: C.sandMid},
  label: {fontSize: 10.5, fontWeight: '700', color: C.white},
  labelOn: {color: C.oceanDeep},
  tail: {
    alignSelf: 'center',
    width: 2,
    height: 6,
    backgroundColor: C.oceanMid,
  },
  tailOn: {backgroundColor: C.oceanDeep},
  tailSelected: {backgroundColor: C.sandMid},
});

export default PlaceMarker;
