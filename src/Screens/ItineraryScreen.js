/**
 * The finished trip, day by day.
 *
 * One screen holds the whole arrival: it generates on mount, shows progress
 * while it waits, then the plan — or a refusal with the one action that fixes
 * it. Splitting those into separate screens would mean a back stack where
 * "back" from a failure lands on a spinner.
 *
 * Every fact rendered here came from our own rows. The model chose the order
 * and wrote the notes; names, phone numbers and bus times were attached by the
 * server afterwards, so nothing on this screen is something a model said.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {useTripPlanner} from '../Services/trip';

// ── Pieces ──────────────────────────────────────────────────────────────────

const Stop = ({stop, picked}) => {
  const {t} = useTranslation();
  const site = stop.site || {};

  return (
    <View style={s.stop}>
      <View style={s.time}>
        <GlobalText text={stop.arrive || '—'} style={s.timeTxt} />
      </View>
      <View style={s.rule} />

      <View style={s.stopBody}>
        <View style={s.stopTitleRow}>
          <GlobalText text={site.name} style={s.stopName} />
          {picked && (
            <View style={s.yours}>
              <GlobalText text={t('TRIP.YOURS')} style={s.yoursTxt} />
            </View>
          )}
          {!!site.verified && (
            <Ionicons name="shield-checkmark" size={13} color={C.oceanMid} />
          )}
        </View>
        {!!stop.note && <GlobalText text={stop.note} style={s.stopNote} />}
      </View>

      {/* The live number from the row, so a traveller can ring ahead. */}
      {!!site.phone && (
        <TouchableOpacity
          style={s.call}
          accessibilityRole="button"
          accessibilityLabel={t('TRIP.CONTACTS')}
          onPress={() => Linking.openURL(`tel:${site.phone}`)}>
          <Ionicons name="call-outline" size={17} color={C.oceanMid} />
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Travel between two stops. A bus line is only drawn when the server found a
 * real service in route_stops — otherwise it says road, rather than implying a
 * connection that does not run.
 */
const Leg = ({leg}) => {
  const {t} = useTranslation();
  const bus = leg.bus && leg.bus.length ? leg.bus[0] : null;

  return (
    <View style={s.leg}>
      <Ionicons
        name={bus ? 'bus-outline' : 'car-outline'}
        size={16}
        color={bus ? C.oceanMid : C.textLight}
      />
      <GlobalText
        style={[s.legTxt, !!bus && s.legTxtBus]}
        text={
          bus
            ? t('TRIP.BUS_LEG', {depart: bus.depart, route: bus.route_no})
            : t('TRIP.BY_ROAD', {km: leg.distance_km})
        }
      />
    </View>
  );
};

const Generating = () => {
  const {t} = useTranslation();

  const steps = [
    {key: 'STEP_PLACES', done: true},
    {key: 'STEP_BUSES', done: true},
    {key: 'STEP_DAYS', active: true},
    {key: 'STEP_CONTACTS'},
  ];

  return (
    <View style={s.center}>
      <View style={s.bigIcon}>
        <Ionicons name="paper-plane-outline" size={42} color={C.oceanFoam} />
      </View>
      <GlobalText
        text={t('TRIP.GENERATING_TITLE')}
        style={s.centerTitleLight}
      />
      <GlobalText text={t('TRIP.GENERATING_BODY')} style={s.centerBodyLight} />

      <View style={s.steps}>
        {steps.map(step => (
          <View key={step.key} style={s.step}>
            {step.done ? (
              <View style={s.stepDone}>
                <Ionicons name="checkmark" size={14} color={C.oceanDeep} />
              </View>
            ) : step.active ? (
              <ActivityIndicator size="small" color={C.oceanFoam} />
            ) : (
              <View style={s.stepTodo} />
            )}
            <GlobalText
              text={t(`TRIP.${step.key}`)}
              style={[s.stepTxt, !step.done && !step.active && s.stepTxtOff]}
            />
          </View>
        ))}
      </View>

      <GlobalText text={t('TRIP.NOTHING_CHARGED')} style={s.reassure} />
    </View>
  );
};

/** One refusal, one action that fixes it. */
const Problem = ({reason, onRetry, onEdit, navigation}) => {
  const {t} = useTranslation();

  const copy = {
    // Logged in but unverified. SCREEN.EMAIL takes the address and sends the
    // code; it is registered inside the logged-in group, which is where a
    // traveller seeing this already is.
    verification_required: {
      icon: 'shield-outline',
      title: t('TRIP.VERIFY_TITLE'),
      body: t('TRIP.VERIFY_BODY'),
      cta: t('TRIP.VERIFY_CTA'),
      action: () => navigation.navigate(t('SCREEN.EMAIL')),
    },
    insufficient_credits: {
      icon: 'time-outline',
      title: t('TRIP.QUOTA_TITLE'),
      body: t('TRIP.QUOTA_BODY'),
      cta: t('TRIP.EDIT_PLACES'),
      action: onEdit,
    },
    cart_too_small: {
      icon: 'add-circle-outline',
      title: t('TRIP.EMPTY_TITLE'),
      body: t('TRIP.NEED_MORE', {count: 3}),
      cta: t('TRIP.ADD_MORE'),
      action: onEdit,
    },
    network: {
      icon: 'cloud-offline-outline',
      title: t('TRIP.NETWORK_TITLE'),
      body: t('TRIP.NETWORK_BODY'),
      cta: t('TRIP.TRY_AGAIN'),
      action: onRetry,
    },
  }[reason] || {
    // Everything the pipeline refuses for its own reasons — a thin day, too
    // few days, a dropped pick. The credit has already been returned.
    icon: 'alert-circle-outline',
    title: t('TRIP.FAILED_TITLE'),
    body: t('TRIP.FAILED_BODY'),
    hint: t('TRIP.FAILED_HELP'),
    cta: t('TRIP.TRY_AGAIN'),
    action: onRetry,
  };

  return (
    <View style={s.center}>
      <View style={s.bigIconLight}>
        <Ionicons name={copy.icon} size={42} color={C.oceanDeep} />
      </View>
      <GlobalText text={copy.title} style={s.centerTitle} />
      <GlobalText text={copy.body} style={s.centerBody} />
      {!!copy.hint && <GlobalText text={copy.hint} style={s.hint} />}

      <TouchableOpacity
        style={s.primaryBtn}
        accessibilityRole="button"
        onPress={copy.action}>
        <GlobalText text={copy.cta} style={s.primaryTxt} />
      </TouchableOpacity>

      <TouchableOpacity
        style={s.linkBtn}
        accessibilityRole="button"
        onPress={onEdit}>
        <GlobalText text={t('TRIP.BACK')} style={s.linkTxt} />
      </TouchableOpacity>
    </View>
  );
};

// ── Screen ──────────────────────────────────────────────────────────────────

const ItineraryScreen = ({navigation, route}) => {
  const {t} = useTranslation();
  const {
    itinerary,
    itineraryTripId,
    generating,
    error,
    credits,
    picked,
    generate,
  } = useTripPlanner();

  const tripId = route?.params?.tripId;
  const [day, setDay] = useState(0);

  /** Ids the traveller ticked themselves, to badge inside the plan. */
  const pickedIds = useMemo(
    () => new Set((picked || []).map(p => p.id)),
    [picked],
  );

  /** The plan in state belongs to this trip, not an earlier one. */
  const mine = !!itinerary && (!tripId || itineraryTripId === tripId);

  useEffect(() => {
    // Only on arrival, and only when there is nothing to show for this trip.
    // Re-planning is the explicit Try again action, never a re-render.
    if (!mine && !generating && !error) {
      generate(tripId, navigation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = useCallback(
    () => generate(tripId, navigation),
    [generate, tripId, navigation],
  );
  const edit = useCallback(() => navigation.goBack(), [navigation]);

  if (generating) {
    return (
      <View style={[s.screen, s.screenDark]}>
        <SystemBars style="light" />
        <Generating />
      </View>
    );
  }

  if (error || !mine) {
    return (
      <View style={s.screen}>
        <SystemBars style="dark" />
        <Problem
          reason={error}
          onRetry={retry}
          onEdit={edit}
          navigation={navigation}
        />
      </View>
    );
  }

  const days = itinerary.days || [];
  const current = days[day] || days[0] || {stops: [], legs: []};
  const legs = current.legs || [];

  return (
    <View style={s.screen}>
      <SystemBars style="light" />

      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity
            style={s.back}
            accessibilityRole="button"
            accessibilityLabel={t('TRIP.BACK')}
            onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={C.white} />
          </TouchableOpacity>
          <View style={s.headerText}>
            <GlobalText
              text={itinerary.trip?.title || t('TRIP.MY_TRIP')}
              style={s.headerTitle}
            />
            {credits != null && (
              <GlobalText
                text={t('TRIP.PLANS_LEFT', {count: credits})}
                style={s.headerMeta}
              />
            )}
          </View>
        </View>

        <View style={s.tabs}>
          {days.map((d, i) => (
            <TouchableOpacity
              key={d.day}
              accessibilityRole="tab"
              accessibilityState={{selected: i === day}}
              style={[s.tab, i === day && s.tabOn]}
              onPress={() => setDay(i)}>
              <GlobalText
                text={t('TRIP.DAY_N', {n: d.day})}
                style={[s.tabTxt, i === day && s.tabTxtOn]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <View style={s.dayHead}>
          {!!current.theme && (
            <GlobalText text={current.theme} style={s.theme} />
          )}
          <GlobalText
            text={t('TRIP.STOPS_COUNT', {count: (current.stops || []).length})}
            style={s.dayCount}
          />
        </View>

        {(current.stops || []).map((stop, i) => (
          <View key={`${stop.site?.id}-${i}`}>
            <Stop stop={stop} picked={pickedIds.has(stop.site?.id)} />
            {!!legs[i] && <Leg leg={legs[i]} />}
          </View>
        ))}

        {(itinerary.warnings || []).map(w => (
          <View key={w} style={s.warning}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color="#8A6A12"
            />
            <GlobalText text={w} style={s.warningTxt} />
          </View>
        ))}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.footerBtn}
          accessibilityRole="button"
          onPress={() => navigation.goBack()}>
          <GlobalText text={t('TRIP.SAVE_TRIP')} style={s.footerTxt} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},
  screenDark: {backgroundColor: C.oceanDeep},

  header: {backgroundColor: C.oceanDeep, paddingTop: 14, paddingHorizontal: 16},
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerText: {flex: 1, minWidth: 0},
  headerTitle: {fontSize: 17, fontWeight: '800', color: C.white},
  headerMeta: {fontSize: 11.5, color: C.oceanFoam},

  tabs: {flexDirection: 'row', gap: 6},
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tabOn: {backgroundColor: C.cream},
  tabTxt: {fontSize: 14, fontWeight: '600', color: C.oceanFoam},
  tabTxtOn: {color: C.oceanDeep, fontWeight: '800'},

  body: {padding: 16, paddingBottom: 8},
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  theme: {flex: 1, fontSize: 13, fontWeight: '700', color: C.oceanMid},
  dayCount: {fontSize: 12, color: C.textLight},

  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    padding: 13,
  },
  time: {width: 44, alignItems: 'center'},
  timeTxt: {fontSize: 13, fontWeight: '800', color: C.textDark},
  rule: {alignSelf: 'stretch', width: 1, backgroundColor: C.line},
  stopBody: {flex: 1, minWidth: 0},
  stopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  stopName: {fontSize: 15, fontWeight: '700', color: C.textDark},
  yours: {
    backgroundColor: 'rgba(27,107,123,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  yoursTxt: {fontSize: 10, fontWeight: '800', color: C.oceanMid},
  stopNote: {fontSize: 12, color: C.textLight, marginTop: 3, lineHeight: 17},
  call: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27,107,123,0.08)',
  },

  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    paddingLeft: 20,
  },
  legTxt: {fontSize: 12.5, fontWeight: '600', color: C.textLight},
  legTxtBus: {color: C.oceanMid},

  warning: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: C.sandPale,
    borderRadius: 14,
    padding: 13,
    marginTop: 12,
  },
  warningTxt: {flex: 1, fontSize: 12.5, color: '#6B5614', lineHeight: 18},

  footer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  footerBtn: {
    height: 50,
    borderRadius: 999,
    backgroundColor: C.oceanMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTxt: {fontSize: 15, fontWeight: '700', color: C.white},

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  bigIcon: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: 'rgba(184,228,234,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  bigIconLight: {
    width: 104,
    height: 104,
    borderRadius: 999,
    backgroundColor: C.oceanFoam,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  centerTitleLight: {
    fontSize: 23,
    fontWeight: '800',
    color: C.white,
    textAlign: 'center',
    marginBottom: 9,
  },
  centerBodyLight: {
    fontSize: 14.5,
    lineHeight: 22,
    color: C.oceanFoam,
    textAlign: 'center',
    marginBottom: 36,
  },
  centerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: C.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  centerBody: {
    fontSize: 15,
    lineHeight: 23,
    color: C.textMid,
    textAlign: 'center',
    marginBottom: 20,
  },
  hint: {
    fontSize: 13.5,
    color: C.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },

  steps: {alignSelf: 'stretch', gap: 15},
  step: {flexDirection: 'row', alignItems: 'center', gap: 13},
  stepDone: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: C.oceanFoam,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTodo: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(184,228,234,0.3)',
  },
  stepTxt: {fontSize: 14.5, fontWeight: '600', color: C.white},
  stepTxtOff: {color: 'rgba(184,228,234,0.6)'},
  reassure: {
    fontSize: 12,
    color: 'rgba(184,228,234,0.65)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 38,
  },

  primaryBtn: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 999,
    backgroundColor: C.oceanMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTxt: {fontSize: 16, fontWeight: '700', color: C.white},
  linkBtn: {marginTop: 14, padding: 8},
  linkTxt: {fontSize: 14.5, fontWeight: '600', color: C.oceanMid},
});

export default ItineraryScreen;
