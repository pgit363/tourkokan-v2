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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {navigateTo} from '../Services/CommonMethods';
import {useTripPlanner} from '../Services/trip';

// ── Pieces ──────────────────────────────────────────────────────────────────

/**
 * How the traveller got here, as the first row of day one.
 *
 * The bus is named only when one actually runs after they land — the server
 * resolves that from the duty sheets and sends null otherwise, and saying
 * nothing is better than implying a connection they would wait hours for.
 */
const Arrival = ({arrival}) => {
  const {t} = useTranslation();
  const bus = arrival.onward;

  return (
    <View style={s.arrival}>
      <Ionicons name="enter-outline" size={18} color={C.oceanMid} />
      <View style={s.arrivalBody}>
        <GlobalText
          style={s.arrivalTitle}
          text={
            arrival.from
              ? t('TRIP.ARRIVE_AT_PLACE', {place: arrival.from, at: arrival.at || ''})
              : t('TRIP.ARRIVE_BY_ROAD')
          }
        />
        {bus ? (
          <GlobalText
            style={s.arrivalBus}
            text={t('TRIP.BUS_LEG', {depart: bus.depart, route: bus.route_no})}
          />
        ) : null}
      </View>
    </View>
  );
};


const Stop = ({stop, picked, onOpen}) => {
  const {t} = useTranslation();
  const site = stop.site || {};

  return (
    <TouchableOpacity
      style={s.stop}
      onPress={onOpen}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={site.name}>
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
    </TouchableOpacity>
  );
};

/**
 * Travel between two stops. A bus line is only drawn when the server found a
 * real service in route_stops — otherwise it says road, rather than implying a
 * connection that does not run.
 */
const Leg = ({leg, onOpen}) => {
  const {t} = useTranslation();
  const bus = leg.bus && leg.bus.length ? leg.bus[0] : null;

  return (
    <TouchableOpacity
      style={s.leg}
      onPress={onOpen}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={t('TRIP.TRAVEL_OPTIONS')}>
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
      <Ionicons name="chevron-forward" size={13} color={C.textLight} />
    </TouchableOpacity>
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
const Problem = ({reason, retryAfter, onRetry, onEdit, navigation}) => {
  const {t} = useTranslation();

  /**
   * Retry-After in whole minutes, rounded up — "1 minute" is honest for 40
   * seconds in a way "0 minutes" is not. Null when the server sent no header,
   * and then the screen simply omits the countdown rather than inventing one.
   */
  const waitMins =
    retryAfter != null && retryAfter > 0 ? Math.ceil(retryAfter / 60) : null;

  const copy = {
    // 429 from Laravel's throttle, which answers before the controller runs.
    // The reassurance is the point: a traveller who has just been refused
    // assumes it cost them something, and it did not.
    rate_limited: {
      icon: 'time-outline',
      title: t('TRIP.RATE_TITLE'),
      body:
        t('TRIP.RATE_BODY') +
        (waitMins ? `\n\n${t('TRIP.BUS_DURATION', {mins: waitMins})}` : ''),
      cta: t('TRIP.RATE_CTA'),
      action: () => navigation.navigate(t('SCREEN.MY_TRIPS')),
      hint: t('TRIP.RATE_NOTE'),
    },
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
  const insets = useSafeAreaInsets();
  const {
    itinerary,
    itineraryTripId,
    generating,
    error,
    retryAfter,
    credits,
    picked,
    generate,
  } = useTripPlanner();

  const tripId = route?.params?.tripId;
  // The form's filters, when the traveller came that way instead of the cart.
  const filters = route?.params?.filters;
  /**
   * A trip reopened from the saved list: `{trip_id, itinerary, credits}`,
   * already generated and already paid for. It arrives whole, so this screen
   * renders it instead of asking the server for a plan — generating again
   * would spend a second credit to recreate something we already have.
   */
  const saved = route?.params?.saved;
  const [day, setDay] = useState(0);

  /**
   * Ids the traveller ticked themselves, to badge inside the plan. Only the
   * cart path has any: badging from the cart on a form-planned trip would mark
   * places as "yours" that the traveller never chose for this trip.
   */
  const pickedIds = useMemo(
    () => new Set(tripId ? (picked || []).map(p => p.id) : []),
    [picked, tripId],
  );

  /** True once this screen has asked for a plan of its own. */
  const [asked, setAsked] = useState(false);

  /**
   * Does the plan sitting in state answer *this* screen's request?
   *
   * The cart path can tell by the trip id. The form path has no id until the
   * plan comes back, so it has to have asked — otherwise a traveller who
   * planned a cart earlier would arrive from the form and be shown that older
   * trip instead of the one they just described.
   */
  const mine =
    !!saved ||
    (!!itinerary && (filters ? asked : !tripId || itineraryTripId === tripId));

  /** What this screen draws: a reopened trip wins over whatever is in state. */
  const shown = saved?.itinerary || itinerary;

  const run = useCallback(() => {
    setAsked(true);
    generate({tripId, filters}, navigation);
  }, [generate, tripId, filters, navigation]);

  useEffect(() => {
    // Arriving here IS the request, so a refusal left in state by a previous
    // visit must not stand in for this one. Checking `error` here meant a
    // traveller who fixed the problem — verified their email, freed up a
    // place — came back and was shown the old refusal without anything being
    // asked. `generate` clears the error and ignores a call while one is
    // already in flight, so running unconditionally is safe.
    if (!mine) {
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const edit = useCallback(() => navigation.goBack(), [navigation]);

  // A reopened trip is already whole; a generation still in flight from an
  // earlier screen must not replace it with a spinner.
  if (generating && !saved) {
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
          retryAfter={retryAfter}
          onRetry={run}
          onEdit={edit}
          navigation={navigation}
        />
      </View>
    );
  }

  const days = shown.days || [];
  const current = days[day] || days[0] || {stops: [], legs: []};
  const legs = current.legs || [];

  return (
    <View style={s.screen}>
      <SystemBars style="light" />

      <View style={[s.header, {paddingTop: insets.top + 8}]}>
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
              text={shown.trip?.title || t('TRIP.MY_TRIP')}
              style={s.headerTitle}
            />
            {credits != null && (
              <GlobalText
                text={t('TRIP.PLANS_LEFT', {count: credits})}
                style={s.headerMeta}
              />
            )}
          </View>
          {/* Every number on the trip in one place — what you want on the
              road, rather than scrolling a day to find the one stop that
              takes bookings. */}
          <TouchableOpacity
            style={s.headerAction}
            accessibilityRole="button"
            accessibilityLabel={t('TRIP.CONTACTS_TITLE')}
            onPress={() =>
              navigateTo(navigation, t('SCREEN.TRIP_CONTACTS'), {days})
            }
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="call-outline" size={18} color={C.white} />
          </TouchableOpacity>
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

        {day === 0 && shown.arrival ? (
          <Arrival arrival={shown.arrival} />
        ) : null}

        {(current.stops || []).map((stop, i) => (
          <View key={`${stop.site?.id}-${i}`}>
            <Stop
              stop={stop}
              picked={pickedIds.has(stop.site?.id)}
              onOpen={() =>
                navigateTo(navigation, t('SCREEN.STOP_DETAIL_TRIP'), {
                  stop,
                  day: current.day,
                })
              }
            />
            {!!legs[i] && (
              <Leg
                leg={legs[i]}
                onOpen={() =>
                  navigateTo(navigation, t('SCREEN.TRIP_LEG'), {
                    leg: legs[i],
                    day: current.day,
                    fromName: stop.site?.name,
                    toName: current.stops?.[i + 1]?.site?.name,
                  })
                }
              />
            )}
          </View>
        ))}

        {(shown.warnings || []).map(w => (
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
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
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

  arrival: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(27,107,123,0.08)',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },
  arrivalBody: {flex: 1},
  arrivalTitle: {fontSize: 13.5, fontWeight: '700', color: C.oceanDeep},
  arrivalBus: {fontSize: 12, color: C.oceanMid, marginTop: 2},

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
