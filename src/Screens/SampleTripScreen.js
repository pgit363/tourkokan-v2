/**
 * The sample trip — what a guest sees before spending anything.
 *
 * Deliberately NOT a real generated itinerary, and deliberately not fetched.
 * Three reasons it is bundled instead:
 *
 *   It must work for someone with no account, no credits and no signal, which
 *   is exactly the person deciding whether this is worth signing up for.
 *
 *   Its stops are generic on purpose — "Malvani thali for lunch", not a named
 *   restaurant with a phone number. Handing a real vendor's contact to an
 *   anonymous browser gives away the thing the product sells, and a named
 *   business would go stale the moment it closed.
 *
 *   A canned example cannot fail. Showing a generation error to someone who
 *   has not yet decided to trust us is the worst possible first impression.
 *
 * So the honest framing is "an example we prepared", said on the screen, and
 * every stop admits what the real thing would add.
 */
import React, {useState} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {backPage, navigateTo} from '../Services/CommonMethods';

/**
 * The example itself. Times and notes are i18n keys, so the sample reads in
 * Marathi for a Marathi speaker — the audience most likely to be deciding on
 * trust rather than features.
 */
const SAMPLE_DAYS = [
  {
    day: 1,
    themeKey: 'SAMPLE_D1_THEME',
    stops: [
      {at: '8:30 am', nameKey: 'SAMPLE_S1', noteKey: 'SAMPLE_S1_NOTE'},
      {
        at: '9:45 am',
        nameKey: 'SAMPLE_S2',
        noteKey: 'SAMPLE_S2_NOTE',
        legBefore: {bus: 'ST 9:05', mins: 35},
      },
      {
        at: '1:00 pm',
        nameKey: 'SAMPLE_S3',
        noteKey: 'SAMPLE_S3_NOTE',
        legBefore: {walkMins: 10},
      },
    ],
    more: 2,
  },
  {
    day: 2,
    themeKey: 'SAMPLE_D2_THEME',
    stops: [
      {at: '9:00 am', nameKey: 'SAMPLE_S4', noteKey: 'SAMPLE_S4_NOTE'},
    ],
    more: 3,
  },
];

const Leg = ({leg, t}) => (
  <View style={s.leg}>
    <Ionicons
      name={leg.bus ? 'bus-outline' : 'walk-outline'}
      size={14}
      color={C.textLight}
    />
    <GlobalText
      style={s.legTxt}
      text={
        leg.bus
          ? `${leg.bus} · ${t('TRIP.BUS_DURATION', {mins: leg.mins})}`
          : t('TRIP.SAMPLE_WALK', {mins: leg.walkMins})
      }
    />
  </View>
);

const SampleTripScreen = ({navigation}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [day, setDay] = useState(0);

  const current = SAMPLE_DAYS[day];

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
            <GlobalText text={t('TRIP.SAMPLE_TRIP_NAME')} style={s.headerTitle} />
            {/* Said up front: this is not their trip, and not a real one. */}
            <GlobalText text={t('TRIP.SAMPLE_SUB')} style={s.headerSub} />
          </View>
        </View>

        <View style={s.tabs}>
          {SAMPLE_DAYS.map((d, i) => (
            <TouchableOpacity
              key={d.day}
              accessibilityRole="tab"
              accessibilityState={{selected: i === day}}
              style={[s.tab, i === day && s.tabOn]}
              onPress={() => setDay(i)}
              activeOpacity={0.85}>
              <GlobalText
                text={t('TRIP.DAY_N', {n: d.day})}
                style={[s.tabTxt, i === day && s.tabTxtOn]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.body, {paddingBottom: insets.bottom + 110}]}
        showsVerticalScrollIndicator={false}>
        <GlobalText text={t(`TRIP.${current.themeKey}`)} style={s.theme} />

        {current.stops.map((stop, i) => (
          <View key={stop.nameKey}>
            {!!stop.legBefore && <Leg leg={stop.legBefore} t={t} />}
            <View style={s.stop}>
              <View style={s.timeCol}>
                <GlobalText text={stop.at} style={s.time} />
              </View>
              <View style={s.rule} />
              <View style={s.stopBody}>
                <GlobalText text={t(`TRIP.${stop.nameKey}`)} style={s.stopName} />
                <GlobalText text={t(`TRIP.${stop.noteKey}`)} style={s.stopNote} />
              </View>
            </View>
          </View>
        ))}

        {/* The teaser is honest about being one: the rest exists in a real trip. */}
        <View style={s.more}>
          <Ionicons name="ellipsis-horizontal" size={16} color={C.textLight} />
          <GlobalText
            text={t('TRIP.SAMPLE_MORE', {count: current.more})}
            style={s.moreTxt}
          />
        </View>

        <GlobalText text={t('TRIP.SAMPLE_FOOT')} style={s.foot} />
      </ScrollView>

      <View style={[s.ctaWrap, {paddingBottom: insets.bottom + 14}]}>
        <TouchableOpacity
          style={s.cta}
          onPress={() => navigateTo(navigation, t('SCREEN.PLAN_TRIP'))}
          activeOpacity={0.9}>
          <Ionicons name="sparkles-outline" size={16} color={C.white} />
          <GlobalText text={t('TRIP.SAMPLE_CTA')} style={s.ctaText} />
        </TouchableOpacity>
      </View>
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
  headerTitle: {fontSize: 19, fontWeight: '700', color: C.white},
  headerSub: {fontSize: 12.5, color: C.oceanFoam, opacity: 0.9, marginTop: 1},
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

  tabs: {flexDirection: 'row', gap: 8, marginTop: 14},
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  tabOn: {backgroundColor: C.white},
  tabTxt: {fontSize: 12.5, fontWeight: '700', color: C.white},
  tabTxtOn: {color: C.oceanDeep},

  body: {paddingHorizontal: 18, paddingTop: 16},
  theme: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 14,
  },

  stop: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  timeCol: {width: 62, paddingTop: 1},
  time: {fontSize: 12.5, fontWeight: '700', color: C.oceanMid, textAlign: 'left'},
  rule: {width: 2, alignSelf: 'stretch', backgroundColor: C.line, borderRadius: 1},
  stopBody: {flex: 1, paddingBottom: 16},
  stopName: {fontSize: 15, fontWeight: '700', color: C.textDark, textAlign: 'left'},
  stopNote: {
    fontSize: 12.5,
    color: C.textMid,
    marginTop: 3,
    lineHeight: 18,
    textAlign: 'left',
  },

  leg: {flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 72, paddingBottom: 10},
  legTxt: {fontSize: 11.5, color: C.textLight},

  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 72,
    marginTop: 2,
  },
  moreTxt: {fontSize: 12.5, color: C.textLight, fontStyle: 'italic'},

  foot: {
    fontSize: 12.5,
    color: C.textMid,
    lineHeight: 19,
    marginTop: 22,
    paddingHorizontal: 4,
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

export default SampleTripScreen;
