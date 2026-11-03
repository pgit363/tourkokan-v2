/**
 * Getting from one stop to the next.
 *
 * The itinerary already carries a `legs` array per day, each resolved by the
 * server from MSRTC route_stops. The day view has room for one line per leg;
 * this screen is where the rest of the options live.
 *
 * WHAT IS DELIBERATELY ABSENT
 *
 * The design shows a fare and a change-count per option. Neither exists: the
 * routes table holds 1,389 routes and 32,400 stops with no fare column, and
 * the resolver returns direct services only — it never computes a connection,
 * so it has no number of changes to report. Printing "₹30" would be inventing
 * a figure a traveller would hand over at a depot, so the fare line says where
 * the gap is instead of filling it.
 *
 * Duration IS shown, because it is derived from depart and arrive, which are
 * real columns — not guessed.
 */
import React from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {backPage} from '../Services/CommonMethods';

/** Minutes between two "HH:MM" strings, rolling past midnight. */
const minutesBetween = (a, b) => {
  const parse = v => {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(v || ''));
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const from = parse(a);
  const to = parse(b);
  if (from == null || to == null) return null;
  const diff = to - from;
  return diff >= 0 ? diff : diff + 24 * 60;
};

const BusOption = ({bus, best, t}) => {
  const mins = minutesBetween(bus.depart, bus.arrive);

  return (
    <View style={[s.card, best && s.cardBest]}>
      <View style={s.cardHead}>
        <GlobalText
          style={s.route}
          numberOfLines={1}
          text={[bus.route_no, bus.route_name].filter(Boolean).join(' · ')}
        />
        {best && (
          <View style={s.bestChip}>
            <GlobalText text={t('TRIP.BUS_BEST')} style={s.bestChipText} />
          </View>
        )}
      </View>

      <View style={s.times}>
        <View style={s.timeCol}>
          <GlobalText text={bus.depart || '—'} style={s.time} />
        </View>
        <View style={s.timeLine}>
          <View style={s.dot} />
          <View style={s.dash} />
          {mins != null && (
            <GlobalText text={t('TRIP.BUS_DURATION', {mins})} style={s.dur} />
          )}
          <View style={s.dash} />
          <View style={s.dot} />
        </View>
        <View style={[s.timeCol, {alignItems: 'flex-end'}]}>
          <GlobalText text={bus.arrive || '—'} style={s.time} />
        </View>
      </View>

      <GlobalText
        style={s.runs}
        text={
          bus.working_days
            ? t('TRIP.BUS_RUNS_ON', {days: bus.working_days})
            : t('TRIP.BUS_RUNS_DAILY')
        }
      />
    </View>
  );
};

const TripLegScreen = ({navigation, route}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const leg = route?.params?.leg || {};
  const fromName = route?.params?.fromName || '';
  const toName = route?.params?.toName || '';
  const dayNumber = route?.params?.day;

  const buses = leg.bus || [];

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
          <View style={{flex: 1}}>
            <GlobalText
              style={s.headerTitle}
              numberOfLines={1}
              text={fromName && toName ? `${fromName} → ${toName}` : t('TRIP.TRAVEL_OPTIONS')}
            />
            {!!dayNumber && (
              <GlobalText text={t('TRIP.DAY_N', {n: dayNumber})} style={s.headerSub} />
            )}
          </View>
        </View>
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.body, {paddingBottom: insets.bottom + 28}]}
        showsVerticalScrollIndicator={false}>
        {buses.length > 0 ? (
          <>
            <GlobalText text={t('TRIP.ST_BUS_OPTIONS')} style={s.sectionLabel} />
            {buses.map((bus, i) => (
              <BusOption key={`${bus.route_no}-${i}`} bus={bus} best={i === 0} t={t} />
            ))}
            <GlobalText text={t('TRIP.BUS_DISCLAIMER')} style={s.note} />
            <GlobalText text={t('TRIP.FARE_UNKNOWN')} style={s.note} />
          </>
        ) : (
          <View style={s.card}>
            <GlobalText text={t('TRIP.NO_BUS_TITLE')} style={s.noBusTitle} />
            <GlobalText text={t('TRIP.NO_BUS_BODY')} style={s.noBusBody} />
          </View>
        )}

        {/* Always offered: it is the fallback when no bus runs, and the
            alternative when the only bus is hours away. */}
        <View style={[s.card, s.roadCard]}>
          <View style={s.roadRow}>
            <Ionicons name="car-outline" size={18} color={C.textMid} />
            <View style={{flex: 1}}>
              <GlobalText text={t('TRIP.BY_ROAD_OPTION')} style={s.roadTitle} />
              <GlobalText
                style={s.roadSub}
                text={
                  leg.distance_km != null
                    ? `${t('TRIP.BY_ROAD', {km: leg.distance_km})} · ${t('TRIP.BY_ROAD_FARE')}`
                    : t('TRIP.BY_ROAD_FARE')
                }
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  header: {paddingHorizontal: 20, paddingBottom: 40, position: 'relative', overflow: 'hidden'},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    textAlign: 'left',
  },
  headerSub: {
    fontSize: 12,
    color: C.oceanFoam,
    opacity: 0.9,
    marginTop: 1,
    textAlign: 'left',
  },
  headerCurve: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 22,
    backgroundColor: C.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  body: {paddingHorizontal: 16, paddingTop: 16},
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 9,
    marginLeft: 2,
    textAlign: 'left',
  },

  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 14,
    marginBottom: 11,
  },
  cardBest: {borderColor: 'rgba(27,107,123,0.45)', borderWidth: 1.5},
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: 8},
  route: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: C.textDark,
    textAlign: 'left',
  },
  bestChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(27,107,123,0.12)',
  },
  bestChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.oceanMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  times: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12},
  timeCol: {minWidth: 48},
  time: {fontSize: 17, fontWeight: '700', color: C.textDark},
  timeLine: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5},
  dot: {width: 7, height: 7, borderRadius: 4, backgroundColor: C.oceanMid},
  dash: {flex: 1, height: 1.5, backgroundColor: 'rgba(27,107,123,0.3)'},
  dur: {fontSize: 11, color: C.oceanMid, fontWeight: '600'},

  runs: {fontSize: 11.5, color: C.textLight, marginTop: 10, textAlign: 'left'},

  noBusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textDark,
    textAlign: 'left',
  },
  noBusBody: {
    fontSize: 13,
    color: C.textMid,
    marginTop: 5,
    lineHeight: 19,
    textAlign: 'left',
  },

  roadCard: {backgroundColor: 'rgba(0,0,0,0.02)'},
  roadRow: {flexDirection: 'row', alignItems: 'center', gap: 11},
  roadTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textDark,
    textAlign: 'left',
  },
  roadSub: {fontSize: 12, color: C.textLight, marginTop: 2, textAlign: 'left'},

  note: {
    fontSize: 11.5,
    color: C.textLight,
    lineHeight: 17,
    marginTop: 2,
    marginBottom: 10,
    textAlign: 'left',
  },
});

export default TripLegScreen;
