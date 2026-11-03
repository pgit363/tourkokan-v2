/**
 * Step 2 of 4 — pick the places you want to go.
 *
 * The list comes from `trip/places`, which runs the planner's own candidate
 * query, so nothing offered here can be refused later. The towns and
 * interests come off the trip rather than from route params: step 1 saved
 * them, which is what makes the flow resumable.
 *
 * List and map are two views of one set. The map is not a different search —
 * switching does not refetch, it draws the same places as markers, so a count
 * cannot differ between the two.
 *
 * "Add your own place" sits under the list rather than beside the map
 * toggle: a place missing from the list is noticed while reading the list, and
 * the footer renders on the empty and no-match states too, which is exactly
 * when the traveller most needs somewhere else to go.
 *
 * The bar above the button is the point of the screen. `min_cart_places` is
 * an `ai_configs` row, so it is read from the server and never hardcoded, and
 * it is stated as progress — "1 of 3 minimum, add 2 more" — rather than left
 * for the traveller to discover as a refusal when they try to continue.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useFocusEffect} from '@react-navigation/native';
import MapView from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import PropTypes from 'prop-types';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import AddToTripButton from '../Components/Trip/AddToTripButton';
import PlaceMarker from '../Components/Trip/PlaceMarker';
import {StepFooter, StepHeader} from '../Components/Trip/StepChrome';
import STRING from '../Services/Constants/STRINGS';
import {navigateTo} from '../Services/CommonMethods';
import {useInTrip, useTripCart, useTripPlaces, categoryNames} from '../Services/trip';

/** Sindhudurg, for the map's opening frame when a place has no coordinates. */
const FALLBACK_REGION = {
  latitude: 16.1,
  longitude: 73.55,
  latitudeDelta: 0.9,
  longitudeDelta: 0.9,
};

// ── Pieces ──────────────────────────────────────────────────────────────────

/**
 * One row. Its own component so `useInTrip` is keyed per place — see
 * AddToTripButton for why that matters in a list.
 */
const PickRow = ({place, navigation}) => {
  const {inTrip} = useInTrip(place.id);

  const cats = categoryNames(place).slice(0, 2).join(' · ');

  return (
    <View style={[s.row, inTrip && s.rowOn]}>
      <View
        style={[s.thumb, {backgroundColor: place.image ? C.oceanFoam : C.sandPale}]}
      />
      <View style={s.rowBody}>
        <View style={s.rowTitle}>
          <GlobalText text={place.name} style={s.rowName} />
          {!!place.verified && (
            <Ionicons name="shield-checkmark" size={13} color={C.oceanMid} />
          )}
        </View>
        {!!cats && <GlobalText text={cats} style={s.rowCats} />}
      </View>
      <AddToTripButton siteId={place.id} navigation={navigation} compact />
    </View>
  );
};

PickRow.propTypes = {
  place: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
};

/** The tapped marker's place, with the one action the map exists for. */
const MarkerCard = ({place, navigation, onClose}) => {
  const {t} = useTranslation();

  if (!place) {
    return null;
  }

  return (
    <View style={s.card}>
      <TouchableOpacity
        style={s.cardClose}
        onPress={onClose}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        accessibilityRole="button"
        accessibilityLabel={t('TRIP.BACK')}>
        <Ionicons name="close" size={16} color={C.textLight} />
      </TouchableOpacity>
      <GlobalText text={place.name} style={s.cardName} />
      <AddToTripButton siteId={place.id} navigation={navigation} />
    </View>
  );
};

MarkerCard.propTypes = {
  place: PropTypes.object,
  navigation: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

// ── Screen ──────────────────────────────────────────────────────────────────

const TripPickScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {cart, refresh} = useTripCart();
  const {places, towns, loading, truncated, minimum, fetch} = useTripPlaces();

  const [search, setSearch] = useState('');
  const [onMap, setOnMap] = useState(false);
  const [selected, setSelected] = useState(null);

  const filters = cart.filters || {};

  useEffect(() => {
    fetch(filters, navigation);
    // Fetched once for the step-1 answers. Ticking a place changes the cart,
    // not the list, so there is nothing here to refetch on every toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.town_site_ids?.join(','), filters.category_codes?.join(',')]);

  // The count must be right after a place is ticked on the map screen too.
  useFocusEffect(
    useCallback(() => {
      refresh(undefined, navigation);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return places;
    }

    // Filtered here rather than refetched: the server already sent everything
    // in range, and a request per keystroke would be slower and no more
    // accurate.
    return places.filter(
      p =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.mr_name || '').toLowerCase().includes(term),
    );
  }, [places, search]);

  // One set for every marker, rather than a useInTrip subscription per pin.
  const inCart = useMemo(
    () => new Set((cart.places || []).map(p => p.id)),
    [cart.places],
  );

  const picked = cart.count || 0;
  const needed = Math.max(0, (minimum || 3) - picked);
  const ready = needed === 0;

  const region = useMemo(() => {
    const first = places.find(p => p.latitude && p.longitude);

    return first
      ? {
          latitude: Number(first.latitude),
          longitude: Number(first.longitude),
          latitudeDelta: 0.35,
          longitudeDelta: 0.35,
        }
      : FALLBACK_REGION;
  }, [places]);

  /** Progress, not a refusal. Always says where they are against the minimum. */
  const verdict = () => {
    if (loading) {
      return t('TRIP.CHECKING');
    }
    if (needed > 0) {
      return t('TRIP.STEP2_PROGRESS', {count: picked, minimum, needed});
    }

    return t('TRIP.STEP2_READY', {count: picked});
  };

  return (
    <View style={s.screen}>
      <SystemBars style="light" />

      <StepHeader
        step={2}
        title={t('TRIP.STEP2_TITLE')}
        caption={
          towns.length
            ? t('TRIP.STEP2_IN', {towns: towns.join(', ')})
            : t('TRIP.STEP_OF', {step: 2, total: 4})
        }
        backLabel={t('TRIP.BACK')}
        onBack={() => navigation.goBack()}
      />

      <View style={s.tools}>
        <View style={s.searchBox}>
          <Ionicons name="search" size={17} color={C.textLight} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t('TRIP.STEP2_SEARCH')}
            placeholderTextColor={C.textLight}
          />
          {!!search && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              accessibilityRole="button">
              <Ionicons name="close-circle" size={17} color={C.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[s.toggle, onMap && s.toggleOn]}
          onPress={() => {
            setOnMap(v => !v);
            setSelected(null);
          }}
          accessibilityRole="button"
          accessibilityState={{selected: onMap}}
          accessibilityLabel={t(onMap ? 'TRIP.STEP2_LIST' : 'TRIP.STEP2_MAP')}>
          <Ionicons
            name={onMap ? 'list' : 'map-outline'}
            size={19}
            color={onMap ? C.white : C.oceanMid}
          />
        </TouchableOpacity>
      </View>

      {loading && places.length === 0 ? (
        <View style={s.centered}>
          <ActivityIndicator color={C.oceanMid} />
        </View>
      ) : onMap ? (
        <View style={s.mapWrap}>
          <MapView
            style={s.map}
            initialRegion={region}
            // Pinch is on by default; the +/- buttons (Android) are not, and a
            // dense beach cluster is easier to pull apart with a tap than a
            // pinch on a phone held one-handed.
            zoomEnabled
            zoomControlEnabled
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}>
            {visible.map(p => (
              <PlaceMarker
                key={p.id}
                place={p}
                selected={selected?.id === p.id}
                inTrip={inCart.has(p.id)}
                onPress={setSelected}
              />
            ))}
          </MapView>
          <MarkerCard
            place={selected}
            navigation={navigation}
            onClose={() => setSelected(null)}
          />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={p => String(p.id)}
          renderItem={({item}) => (
            <PickRow place={item} navigation={navigation} />
          )}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <GlobalText
              style={s.empty}
              text={search ? t('TRIP.STEP2_NO_MATCH') : t('TRIP.STEP2_EMPTY')}
            />
          }
          ListFooterComponent={
            <>
              {truncated && !search && (
                <GlobalText style={s.empty} text={t('TRIP.STEP2_TRUNCATED')} />
              )}
              {/* The same control, in the same words, as step 3 and the cart:
                  one affordance the traveller learns once. */}
              <TouchableOpacity
                style={s.addOwn}
                accessibilityRole="button"
                onPress={() =>
                  navigateTo(navigation, t('SCREEN.ADD_FROM_LINK'), {
                    tripId: cart.tripId,
                  })
                }>
                <Ionicons name="link-outline" size={17} color={C.oceanMid} />
                <GlobalText
                  text={t('TRIP.ADD_OWN_TITLE')}
                  style={s.addOwnTxt}
                />
              </TouchableOpacity>
            </>
          }
        />
      )}

      <StepFooter
        label={t('TRIP.STEP2_NEXT')}
        verdict={verdict()}
        ready={ready}
        onPress={() => navigation.navigate(STRING.SCREEN.TRIP_ARRANGE)}
      />
    </View>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},

  tools: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  searchInput: {flex: 1, fontSize: 14.5, color: C.textDark, padding: 0},
  toggle: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOn: {backgroundColor: C.oceanMid, borderColor: C.oceanMid},

  list: {paddingHorizontal: 16, paddingBottom: 8, gap: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  rowOn: {borderColor: C.oceanMid, backgroundColor: 'rgba(27,107,123,0.05)'},
  thumb: {width: 46, height: 46, borderRadius: 10},
  rowBody: {flex: 1, minWidth: 0},
  rowTitle: {flexDirection: 'row', alignItems: 'center', gap: 6},
  rowName: {fontSize: 15, fontWeight: '700', color: C.textDark},
  // GlobalText centres by default, and this one fills the row's flex:1 column.
  rowCats: {fontSize: 12, color: C.textLight, marginTop: 2, textAlign: 'left'},
  empty: {
    fontSize: 13,
    color: C.textLight,
    textAlign: 'center',
    paddingVertical: 26,
  },
  addOwn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.oceanMid,
  },
  addOwnTxt: {fontSize: 15, fontWeight: '600', color: C.oceanMid},

  mapWrap: {flex: 1},
  map: {flex: 1},
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: C.white,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 3},
  },
  cardClose: {position: 'absolute', top: 10, right: 10, zIndex: 2},
  cardName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: C.textDark,
    paddingRight: 24,
  },
});

export default TripPickScreen;
