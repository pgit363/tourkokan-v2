/**
 * My trip — the places a traveller ticked while browsing.
 *
 * Useful with no AI involved: a saved, ordered list of places grouped into a
 * trip. The Plan button is bound to `can_plan` from the server rather than a
 * count compared here, because the minimum lives in `ai_configs` and an admin
 * can change it without an app release.
 *
 * Plan hands the trip id to the itinerary screen, which does the generating.
 * Below the minimum it stays disabled with an explanation rather than hidden,
 * so the shape of the screen never changes under the traveller.
 */
import React, {useCallback} from 'react';
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
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {navigateTo} from '../Services/CommonMethods';
import {useTripCart, useInTrip} from '../Services/trip';

const Row = ({place, navigation}) => {
  const {t} = useTranslation();
  const {pending, toggle} = useInTrip(place.id);

  return (
    <View style={s.row}>
      {place.image ? (
        <View style={s.thumb}>
          <View style={[s.thumbFill, {backgroundColor: C.oceanFoam}]} />
        </View>
      ) : (
        <View style={[s.thumb, {backgroundColor: C.sandPale}]} />
      )}

      <View style={s.rowBody}>
        <GlobalText text={place.name} style={s.rowTitle} numberOfLines={1} />
        <GlobalText
          text={place.categories?.map(c => c.name).join(' · ') || ''}
          style={s.rowMeta}
          numberOfLines={1}
        />
      </View>

      <TouchableOpacity
        style={s.remove}
        accessibilityRole="button"
        accessibilityLabel={t('TRIP.REMOVE')}
        disabled={pending}
        onPress={() => toggle(navigation)}>
        {pending ? (
          <ActivityIndicator size="small" color={C.textLight} />
        ) : (
          <Ionicons name="close" size={18} color="#B23A2E" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const TripCartScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {cart, refresh, update} = useTripCart();

  useFocusEffect(
    useCallback(() => {
      refresh(undefined, navigation);
      // refresh is stable per tripId; re-running on every render would loop.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigation]),
  );

  const setDays = delta => {
    const next = Math.min(14, Math.max(1, (cart.days || 1) + delta));
    if (next !== cart.days) {
      update({days: next}, navigation);
    }
  };

  const remaining = Math.max(0, (cart.minimum || 3) - (cart.count || 0));

  const empty = (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name="location-outline" size={44} color={C.oceanDeep} />
      </View>
      <GlobalText text={t('TRIP.EMPTY_TITLE')} style={s.emptyTitle} />
      <GlobalText text={t('TRIP.EMPTY_BODY')} style={s.emptyBody} />
      <TouchableOpacity
        style={s.primaryBtn}
        accessibilityRole="button"
        onPress={() => navigation.goBack()}>
        <GlobalText text={t('TRIP.START_EXPLORING')} style={s.primaryTxt} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.screen}>
      <SystemBars style="dark" />

      <View style={s.header}>
        <TouchableOpacity
          style={s.back}
          accessibilityRole="button"
          accessibilityLabel={t('TRIP.BACK')}
          onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.textDark} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <GlobalText text={t('TRIP.MY_TRIP')} style={s.headerTitle} />
          <GlobalText
            text={
              cart.count === 1
                ? t('TRIP.ONE_PLACE_ADDED')
                : t('TRIP.PLACES_ADDED', {count: cart.count})
            }
            style={s.headerMeta}
          />
        </View>
      </View>

      {cart.loading && cart.count === 0 ? (
        <ActivityIndicator style={s.loader} color={C.oceanMid} />
      ) : (
        <FlatList
          data={cart.places}
          keyExtractor={p => String(p.id)}
          renderItem={({item}) => <Row place={item} navigation={navigation} />}
          contentContainerStyle={
            cart.count === 0 ? s.listEmpty : s.listContent
          }
          ListHeaderComponent={
            cart.count > 0 ? (
              <GlobalText
                text={t('TRIP.PLACES_YOU_PICKED').toUpperCase()}
                style={s.sectionLabel}
              />
            ) : null
          }
          ListEmptyComponent={empty}
          ListFooterComponent={
            cart.count > 0 ? (
              <TouchableOpacity
                style={s.addMore}
                accessibilityRole="button"
                onPress={() => navigation.goBack()}>
                <Ionicons name="add" size={17} color={C.oceanMid} />
                <GlobalText text={t('TRIP.ADD_MORE')} style={s.addMoreTxt} />
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {cart.count > 0 && (
        <View style={s.footer}>
          <View style={s.daysRow}>
            <GlobalText text={t('TRIP.HOW_MANY_DAYS')} style={s.daysLabel} />
            <View style={s.stepper}>
              <TouchableOpacity
                style={s.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="-"
                onPress={() => setDays(-1)}>
                <GlobalText text="−" style={s.stepTxt} />
              </TouchableOpacity>
              <GlobalText text={String(cart.days || 1)} style={s.stepValue} />
              <TouchableOpacity
                style={s.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="+"
                onPress={() => setDays(1)}>
                <GlobalText text="+" style={s.stepTxt} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.primaryBtn, !cart.canPlan && s.primaryBtnOff]}
            accessibilityRole="button"
            accessibilityState={{disabled: !cart.canPlan}}
            disabled={!cart.canPlan}
            onPress={() =>
              navigateTo(navigation, t('SCREEN.ITINERARY'), {
                tripId: cart.tripId,
              })
            }>
            <GlobalText text={t('TRIP.PLAN_MY_TRIP')} style={s.primaryTxt} />
          </TouchableOpacity>

          <GlobalText
            style={s.footerNote}
            text={
              cart.canPlan
                ? t('TRIP.FREE_FOREVER')
                : remaining === 1
                ? t('TRIP.ONE_MORE')
                : t('TRIP.N_MORE', {count: remaining})
            }
          />
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cream,
  },
  headerText: {flex: 1},
  headerTitle: {fontSize: 18, fontWeight: '700', color: C.textDark},
  headerMeta: {fontSize: 12, color: C.textLight},

  loader: {marginTop: 40},
  listContent: {padding: 16, gap: 10},
  listEmpty: {flexGrow: 1},

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textLight,
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    padding: 12,
  },
  thumb: {width: 44, height: 44, borderRadius: 10, overflow: 'hidden'},
  thumbFill: {flex: 1},
  rowBody: {flex: 1, minWidth: 0},
  rowTitle: {fontSize: 14, fontWeight: '700', color: C.textDark},
  rowMeta: {fontSize: 11, color: C.textLight, marginTop: 1},
  remove: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},

  addMore: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(27,107,123,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  addMoreTxt: {fontSize: 14, fontWeight: '700', color: C.oceanMid},

  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28},
  emptyIcon: {
    width: 112,
    height: 112,
    borderRadius: 999,
    backgroundColor: C.oceanFoam,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: C.textDark,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: C.textMid,
    textAlign: 'center',
    marginBottom: 28,
  },

  footer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.line,
    gap: 12,
  },
  daysRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  daysLabel: {flex: 1, fontSize: 14, fontWeight: '600', color: C.textMid},
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.cream,
    borderRadius: 999,
    padding: 4,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTxt: {fontSize: 18, fontWeight: '700', color: C.textDark},
  stepValue: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: C.textDark,
  },

  primaryBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: C.oceanMid,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnOff: {backgroundColor: 'rgba(27,107,123,0.25)'},
  primaryTxt: {fontSize: 16, fontWeight: '700', color: C.white},
  footerNote: {textAlign: 'center', fontSize: 12, color: C.textLight},
});

export default TripCartScreen;
