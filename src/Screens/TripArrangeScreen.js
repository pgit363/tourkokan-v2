/**
 * Step 3 of 4 — put the places in the order you want to see them.
 *
 * The order matters: `planFromCart` reads the cart in `sort_order` and the
 * model is told that sequence, so this is the traveller saying "start at the
 * fort, finish at the beach" rather than leaving it to be guessed.
 *
 * Up and down arrows rather than drag. Dragging needs another native
 * dependency interacting with gesture-handler and reanimated on this app's
 * paper architecture, and arrows cannot break — the list component can be
 * swapped for a draggable one later without touching anything below it.
 *
 * The move is applied locally first so the list answers the tap immediately,
 * then `reorder` replaces it with the server's own view. A rejected move
 * therefore snaps back to the truth on its own.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import PropTypes from 'prop-types';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {StepFooter, StepHeader} from '../Components/Trip/StepChrome';
import STRING from '../Services/Constants/STRINGS';
import {useInTrip, useTripCart, categoryNames} from '../Services/trip';

// ── Pieces ──────────────────────────────────────────────────────────────────

const ArrangeRow = ({
  place,
  index,
  total,
  navigation,
  onUp,
  onDown,
  disabled,
}) => {
  const {t} = useTranslation();
  const {pending, toggle} = useInTrip(place.id);

  const first = index === 0;
  const last = index === total - 1;

  return (
    <View style={s.row}>
      <View style={s.position}>
        <GlobalText text={String(index + 1)} style={s.positionTxt} />
      </View>

      <View style={s.body}>
        <GlobalText text={place.name} style={s.name} />
        {!!(place.categories || []).length && (
          <GlobalText
            style={s.cats}
            text={categoryNames(place).slice(0, 2).join(' · ')}
          />
        )}
      </View>

      <View style={s.moves}>
        <TouchableOpacity
          style={[s.move, (first || disabled) && s.moveOff]}
          disabled={first || disabled}
          onPress={() => onUp(index)}
          accessibilityRole="button"
          accessibilityLabel={t('TRIP.STEP3_UP', {place: place.name})}>
          <Ionicons
            name="chevron-up"
            size={18}
            color={first || disabled ? C.textLight : C.oceanMid}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.move, (last || disabled) && s.moveOff]}
          disabled={last || disabled}
          onPress={() => onDown(index)}
          accessibilityRole="button"
          accessibilityLabel={t('TRIP.STEP3_DOWN', {place: place.name})}>
          <Ionicons
            name="chevron-down"
            size={18}
            color={last || disabled ? C.textLight : C.oceanMid}
          />
        </TouchableOpacity>
      </View>

      {/* Taking a place out here rather than walking back to step 2. */}
      <TouchableOpacity
        style={s.remove}
        disabled={pending}
        onPress={() => toggle(navigation)}
        accessibilityRole="button"
        accessibilityLabel={t('TRIP.REMOVE')}>
        {pending ? (
          <ActivityIndicator size="small" color={C.textLight} />
        ) : (
          <Ionicons name="close" size={17} color={C.textLight} />
        )}
      </TouchableOpacity>
    </View>
  );
};

ArrangeRow.propTypes = {
  place: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  navigation: PropTypes.object.isRequired,
  onUp: PropTypes.func.isRequired,
  onDown: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

// ── Screen ──────────────────────────────────────────────────────────────────

const TripArrangeScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {cart, refresh, reorder} = useTripCart();

  /**
   * The order on screen. Held locally so a tap moves the row at once, and
   * replaced by the server's view whenever the cart arrives — which is what
   * makes a rejected move snap back rather than linger.
   */
  const [order, setOrder] = useState([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh(undefined, navigation);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    setOrder(cart.places || []);
  }, [cart.places]);

  const swap = useCallback(
    (from, to) => {
      if (to < 0 || to >= order.length || saving) {
        return;
      }

      const next = [...order];
      [next[from], next[to]] = [next[to], next[from]];
      setOrder(next);
      setSaving(true);

      reorder(
        next.map(p => p.id),
        navigation,
      ).finally(() => setSaving(false));
    },
    [order, saving, reorder, navigation],
  );

  const minimum = cart.minimum || 3;
  const needed = Math.max(0, minimum - order.length);
  const ready = needed === 0;

  const verdict = () => {
    if (needed > 0) {
      return t('TRIP.STEP3_TOO_FEW', {needed});
    }

    return t('TRIP.STEP3_HINT');
  };

  return (
    <View style={s.screen}>
      <SystemBars style="light" />

      <StepHeader
        step={3}
        title={t('TRIP.STEP3_TITLE')}
        caption={t('TRIP.STEP3_CAPTION', {count: order.length})}
        backLabel={t('TRIP.BACK')}
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={order}
        keyExtractor={p => String(p.id)}
        contentContainerStyle={s.list}
        renderItem={({item, index}) => (
          <ArrangeRow
            place={item}
            index={index}
            total={order.length}
            navigation={navigation}
            disabled={saving}
            onUp={i => swap(i, i - 1)}
            onDown={i => swap(i, i + 1)}
          />
        )}
        ListEmptyComponent={
          <GlobalText style={s.empty} text={t('TRIP.STEP3_EMPTY')} />
        }
      />

      <StepFooter
        label={t('TRIP.STEP3_NEXT')}
        verdict={verdict()}
        ready={ready}
        onPress={() => navigation.navigate(STRING.SCREEN.TRIP_REVIEW)}
      />
    </View>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},
  list: {padding: 16, gap: 8},

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  position: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27,107,123,0.1)',
  },
  positionTxt: {fontSize: 13, fontWeight: '800', color: C.oceanMid},
  body: {flex: 1, minWidth: 0},
  // GlobalText centres by default; these fill a flex:1 column, so say left.
  name: {fontSize: 15, fontWeight: '700', color: C.textDark, textAlign: 'left'},
  cats: {fontSize: 12, color: C.textLight, marginTop: 2, textAlign: 'left'},

  moves: {gap: 2},
  move: {
    width: 34,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27,107,123,0.08)',
  },
  moveOff: {backgroundColor: 'transparent'},

  remove: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    fontSize: 13,
    color: C.textLight,
    textAlign: 'center',
    paddingVertical: 30,
  },
});

export default TripArrangeScreen;
