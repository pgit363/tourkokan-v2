/**
 * Saved trips.
 *
 * The gap this closes: before it, a traveller could generate an itinerary and
 * then have no way back to it. The server has stored every generated trip all
 * along — nothing could list them.
 *
 * Rows are summaries built server-side (stop count, first few stop names), not
 * trimmed-down itineraries. Rendering a list from full itineraries would mean
 * downloading every trip to show a few lines of each.
 *
 * Opening a row fetches the stored itinerary and hands it to the itinerary
 * screen in the same shape generation returns, so a reopened trip and a fresh
 * one render through one path rather than two that drift apart.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {myTrips, getSavedTrip} from '../Services/Api/TripServices';
import {backPage, navigateTo} from '../Services/CommonMethods';
import {createLogger} from '../Services/Logger';

const log = createLogger('MyTrips');

/**
 * "Made yesterday" rather than a date.
 *
 * A saved trip is recent or it is not; the exact day it was generated is never
 * what the traveller is scanning for. Beyond a fortnight the weeks count stops
 * helping, so it falls back to the date.
 */
const madeWhen = (iso, t) => {
  if (!iso) return '';
  const then = new Date(iso);
  if (isNaN(then)) return '';
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return t('TRIP.MADE_TODAY');
  if (days === 1) return t('TRIP.MADE_YESTERDAY');
  if (days < 14) return t('TRIP.MADE_DAYS', {count: days});
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return t('TRIP.MADE_WEEKS', {count: weeks});
  return then.toLocaleDateString();
};

const TripRow = ({trip, onOpen, opening, t}) => (
  <TouchableOpacity
    style={s.card}
    onPress={() => onOpen(trip)}
    activeOpacity={0.85}
    disabled={opening}>
    <View style={s.cardTop}>
      <View style={s.cardTitleWrap}>
        <GlobalText text={trip.title} style={s.cardTitle} numberOfLines={2} />
      </View>
      {/* Stored on the device by the itinerary screen, so it opens on the road. */}
      <View style={s.offlineChip}>
        <Ionicons name="cloud-done-outline" size={11} color={C.forestMid} />
        <GlobalText text={t('TRIP.OFFLINE_BADGE')} style={s.offlineChipText} />
      </View>
    </View>

    <GlobalText
      style={s.cardMeta}
      numberOfLines={1}
      // Joined with a middot, NOT a comma: real site names contain commas
      // ("Shri Dev Rameshwar Temple, Rameshwar Wadi"), so a comma join turns
      // three places into what reads as five.
      text={[
        t('TRIP.STOPS_COUNT', {count: trip.stop_count}),
        ...(trip.stop_names || []),
      ]
        .filter(Boolean)
        .join(' · ')}
    />

    <View style={s.cardFoot}>
      <GlobalText text={madeWhen(trip.created_at, t)} style={s.cardWhen} />
      {opening ? (
        <ActivityIndicator size="small" color={C.oceanMid} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={C.oceanMid} />
      )}
    </View>
  </TouchableOpacity>
);

const MyTripsScreen = ({navigation}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const [trips, setTrips] = useState([]);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    const res = await myTrips(navigation);
    const data = res?.data;
    if (data?.success) {
      setTrips(data.data?.trips || []);
      setCredits(data.data?.credits ?? null);
    } else {
      // comnPost resolves on failure too, so an unsuccessful body is the
      // error path — there is no rejection to catch.
      setError(data?.message || t('ALERT.WENT_WRONG'));
    }
    isRefresh ? setRefreshing(false) : setLoading(false);
  }, [navigation, t]);

  // Refetch on focus: a trip generated after this screen first mounted would
  // otherwise be missing from a list the traveller just navigated back to.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const open = useCallback(
    async trip => {
      setOpeningId(trip.id);
      const res = await getSavedTrip(trip.id, navigation);
      const data = res?.data;
      setOpeningId(null);
      if (data?.success) {
        navigateTo(navigation, t('SCREEN.ITINERARY'), {
          saved: data.data,
        });
      } else {
        log.warn('[myTrips] could not open trip', trip.id);
        setError(data?.message || t('TRIP.TRIP_GONE'));
      }
    },
    [navigation, t],
  );

  const empty = (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name="map-outline" size={30} color={C.oceanMid} />
      </View>
      <GlobalText text={t('TRIP.MY_TRIPS_EMPTY_TITLE')} style={s.emptyTitle} />
      <GlobalText text={t('TRIP.MY_TRIPS_EMPTY_BODY')} style={s.emptyBody} />
    </View>
  );

  return (
    <View style={s.root}>
      <SystemBars style="light" />

      <LinearGradient
        colors={[C.oceanDeep, '#1A3320']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => backPage(navigation)}
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <View style={s.headerTextWrap}>
            <GlobalText text={t('TRIP.MY_TRIPS')} style={s.headerTitle} />
            <GlobalText text={t('TRIP.MY_TRIPS_SUB')} style={s.headerSub} />
          </View>
        </View>
        {credits != null && (
          <View style={s.creditChip}>
            <GlobalText
              text={t('TRIP.PLANS_LEFT', {count: credits})}
              style={s.creditChipText}
            />
          </View>
        )}
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.oceanMid} />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={item => String(item.id)}
          renderItem={({item}) => (
            <TripRow
              trip={item}
              onOpen={open}
              opening={openingId === item.id}
              t={t}
            />
          )}
          contentContainerStyle={[
            s.listContent,
            {paddingBottom: insets.bottom + 120},
            trips.length === 0 && s.listEmpty,
          ]}
          ListEmptyComponent={empty}
          ListHeaderComponent={
            error ? (
              <View style={s.errorBar}>
                <Ionicons name="alert-circle-outline" size={15} color="#B23A2E" />
                <GlobalText text={error} style={s.errorText} />
              </View>
            ) : null
          }
          ListFooterComponent={
            trips.length > 0 ? (
              <GlobalText text={t('TRIP.OFFLINE_NOTE')} style={s.footNote} />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={C.oceanMid}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={[s.ctaWrap, {paddingBottom: insets.bottom + 14}]}>
        <TouchableOpacity
          style={s.cta}
          onPress={() => navigateTo(navigation, t('SCREEN.TRIP_WHERE'))}
          activeOpacity={0.9}>
          <Ionicons name="sparkles-outline" size={16} color={C.white} />
          <GlobalText text={t('TRIP.PLAN_NEW')} style={s.ctaText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},

  header: {paddingHorizontal: 20, paddingBottom: 44, position: 'relative', overflow: 'hidden'},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextWrap: {flex: 1},
  headerTitle: {fontSize: 22, fontWeight: '700', color: C.white, letterSpacing: 0.2},
  headerSub: {fontSize: 12.5, color: C.oceanFoam, opacity: 0.9, marginTop: 2},
  creditChip: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  creditChipText: {fontSize: 11.5, fontWeight: '700', color: C.white},
  headerCurve: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 24,
    backgroundColor: C.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  listContent: {paddingHorizontal: 16, paddingTop: 14},
  listEmpty: {flexGrow: 1, justifyContent: 'center'},

  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  cardTitleWrap: {flex: 1},
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textDark,
    lineHeight: 21,
    textAlign: 'left',
  },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(46,92,58,0.10)',
    flexShrink: 0,
  },
  offlineChipText: {fontSize: 10, fontWeight: '700', color: C.forestMid},
  cardMeta: {fontSize: 12.5, color: C.textMid, marginTop: 7, textAlign: 'left'},
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  cardWhen: {fontSize: 11.5, color: C.textLight},

  empty: {alignItems: 'center', paddingHorizontal: 34},
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(27,107,123,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {fontSize: 17, fontWeight: '700', color: C.textDark, textAlign: 'center'},
  emptyBody: {
    fontSize: 13.5,
    color: C.textMid,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },

  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(178,58,46,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(178,58,46,0.22)',
    marginBottom: 12,
  },
  errorText: {flex: 1, fontSize: 12.5, color: '#B23A2E'},

  footNote: {
    fontSize: 11.5,
    color: C.textLight,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },

  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.cream,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  cta: {
    height: 50,
    borderRadius: 14,
    backgroundColor: C.oceanMid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {fontSize: 15, fontWeight: '700', color: C.white},
});

export default MyTripsScreen;
