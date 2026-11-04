/**
 * Step 1 — the whole brief, and how the places get chosen.
 *
 * There used to be two forms behind two buttons on the home card, asking
 * almost the same questions and differing only in what happened next. Two
 * doors to one room: whichever you picked, you could not see what the other
 * one did. They are one form now, and the difference between them is a
 * question on it — pick the places yourself, or let the model do it.
 *
 * That choice decides the length of the flow, not its shape. Picking your own
 * runs four steps (here, pick, arrange, review); letting the model choose
 * runs two (here, review). Both review before anything is generated, because
 * generating is what spends a credit.
 *
 * The answers are saved onto the trip rather than carried in route params or
 * Redux, because `planFromCart` reads them off the trip. That also makes the
 * flow resumable: come back tomorrow and the towns are still ticked.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SystemBars} from 'react-native-edge-to-edge';
import {useTranslation} from 'react-i18next';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {
  Chip,
  Choice,
  EXPRESS_STEPS,
  Section,
  StepFooter,
  StepHeader,
  TOTAL_STEPS,
} from '../Components/Trip/StepChrome';
import STRING from '../Services/Constants/STRINGS';
import {useTripCart, useTripForm} from '../Services/trip';

/** How long to wait after a tap before asking the server what it would give. */
const QUOTE_DELAY = 450;

const TripWhereScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {options, loading, quote, quoting, load, ask} = useTripForm();
  const {cart, refresh, update} = useTripCart();

  const [towns, setTowns] = useState([]);
  const [interests, setInterests] = useState([]);
  const [days, setDays] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [tripType, setTripType] = useState(null);
  const [stay, setStay] = useState('suggest');
  // Null until they say. The whole question is optional, and a trip planned
  // without it is the trip we were already planning.
  const [arrivalMode, setArrivalMode] = useState(null);
  const [arrivalPoint, setArrivalPoint] = useState(null);
  const [arrivalAt, setArrivalAt] = useState('');
  /**
   * 'pick' walks the map and the list; 'ai' hands the choosing over. Defaults
   * to picking, because that is the thing the extra screens exist for — the
   * express route is the shortcut, not the main road.
   */
  const [mode, setMode] = useState('pick');
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  // Only true once the cart has been read, so the prefill below runs on real
  // answers and not on the empty cart the hook starts with.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    load(navigation);
    // Creates the draft trip if there is not one, which is what gives us a
    // trip_id to save the answers against.
    refresh(undefined, navigation).then(() => setRestored(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Walking back into step 1 should find the answers still ticked.
  useEffect(() => {
    if (!restored) {
      return;
    }

    const saved = cart.filters || {};
    setTowns(current => (current.length ? current : saved.town_site_ids || []));
    setInterests(current =>
      current.length ? current : saved.category_codes || [],
    );
    setDays(cart.days || saved.days || 2);
    setAdults(saved.group?.adults ?? 2);
    setChildren(saved.group?.children ?? 0);
    setTripType(saved.trip_type ?? null);
    if (saved.stay) {
      setStay(saved.stay);
    }
    if (saved.arrival?.mode) {
      setArrivalMode(saved.arrival.mode);
      setArrivalPoint(saved.arrival.site_id || null);
      setArrivalAt(saved.arrival.at || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored]);

  const maxTowns = options?.max_towns ?? 3;
  // The backend caps the quote and the plan at ai_configs max_days, so a
  // stepper that let someone pick 14 was offering a trip the server would
  // trim without saying so. PlanTripScreen was the only screen that read
  // this; it has gone, and the rule came here.
  const maxDays = options?.days?.max ?? 7;

  const pointsForMode = useMemo(
    () =>
      (options?.arrival?.points || []).filter(p =>
        (p.modes || []).includes(arrivalMode),
      ),
    [options?.arrival?.points, arrivalMode],
  );

  const filters = useMemo(() => {
    const base = {
      town_site_ids: towns,
      category_codes: interests,
      days,
      stay,
      radius_km: options?.radius_km ?? 40,
      // Who is going. Sent always, because two adults is a real answer and
      // not a missing one — the server paces the days from it.
      group: {adults, children},
    };

    if (tripType) {
      base.trip_type = tripType;
    }

    // Omitted entirely rather than sent half-filled: the server wants a point
    // for everything except driving, so an incomplete answer would be a
    // validation error on every keystroke.
    if (arrivalMode === 'own_vehicle') {
      base.arrival = {mode: arrivalMode, at: arrivalAt || null};
    } else if (arrivalMode && arrivalPoint) {
      base.arrival = {
        mode: arrivalMode,
        site_id: arrivalPoint,
        at: arrivalAt || null,
      };
    }

    return base;
  }, [
    towns,
    interests,
    days,
    adults,
    children,
    tripType,
    stay,
    arrivalMode,
    arrivalPoint,
    arrivalAt,
    options?.radius_km,
  ]);

  /**
   * Ask what the filters would give, shortly after they stop tapping. The
   * answer is what step 2 will show them, so it is worth knowing here that
   * the area is thin before they walk into an empty list.
   */
  useEffect(() => {
    if (towns.length === 0) {
      return undefined;
    }

    const timer = setTimeout(() => ask(filters, navigation), QUOTE_DELAY);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const toggleTown = useCallback(
    id =>
      setTowns(current => {
        if (current.includes(id)) {
          return current.filter(x => x !== id);
        }

        // At the cap the newest choice replaces the oldest, rather than the
        // tap doing nothing — a dead tap reads as a broken screen.
        return current.length >= maxTowns
          ? [...current.slice(1), id]
          : [...current, id];
      }),
    [maxTowns],
  );

  const toggleInterest = useCallback(
    code =>
      setInterests(current =>
        current.includes(code)
          ? current.filter(x => x !== code)
          : [...current, code],
      ),
    [],
  );

  const ready = towns.length > 0;
  const total = mode === 'ai' ? EXPRESS_STEPS : TOTAL_STEPS;

  const next = useCallback(async () => {
    setSaving(true);
    setSaveFailed(false);
    // `days` goes as its own field as well as inside the filters: the
    // planner reads the column, the prompt reads the filters, and they must
    // not drift apart.
    const ok = await update({days, filters}, navigation);
    setSaving(false);

    if (ok) {
      navigation.navigate(
        mode === 'ai' ? STRING.SCREEN.TRIP_REVIEW : STRING.SCREEN.TRIP_PICK,
        mode === 'ai' ? {express: true} : undefined,
      );
      return;
    }

    // Said out loud. Without this the save fails, the screen does not move
    // and nothing explains why — the traveller taps a button that looks
    // alive and gets silence, which is the one thing a footer must never do.
    setSaveFailed(true);
  }, [update, days, filters, mode, navigation]);

  /** What the footer says about the current answers. */
  const verdict = () => {
    if (saveFailed) {
      return t('TRIP.SAVE_FAILED');
    }
    if (towns.length === 0) {
      return t('TRIP.PICK_A_TOWN');
    }
    if (quoting || !quote) {
      return t('TRIP.CHECKING');
    }
    if (quote.candidates > 0) {
      return t('TRIP.STEP1_FOUND', {count: quote.candidates});
    }

    return t('TRIP.STEP1_NOTHING');
  };

  if (loading && !options) {
    return (
      <View style={[s.screen, s.centered]}>
        <SystemBars style="dark" />
        <ActivityIndicator color={C.oceanMid} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <SystemBars style="light" />

      <StepHeader
        step={1}
        total={total}
        title={t('TRIP.STEP1_TITLE')}
        caption={t('TRIP.STEP_OF', {step: 1, total})}
        backLabel={t('TRIP.BACK')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={s.body}>
        <Section
          label={t('TRIP.WHERE_LABEL')}
          hint={t('TRIP.WHERE_HINT', {count: maxTowns})}>
          <View style={s.chips}>
            {(options?.towns || []).map(town => (
              <Chip
                key={town.site_id}
                label={town.name}
                on={towns.includes(town.site_id)}
                onPress={() => toggleTown(town.site_id)}
              />
            ))}
          </View>
          {(options?.towns || []).length === 0 && (
            <GlobalText text={t('TRIP.NO_TOWNS')} style={s.hint} />
          )}
        </Section>

        <Section
          label={t('TRIP.INTERESTS_LABEL')}
          hint={t('TRIP.STEP1_INTERESTS_HINT')}>
          <View style={s.chips}>
            {(options?.interests || []).map(interest => (
              <Chip
                key={interest.code}
                label={interest.name}
                meta={String(interest.places)}
                on={interests.includes(interest.code)}
                onPress={() => toggleInterest(interest.code)}
              />
            ))}
          </View>
        </Section>

        <Section label={t('TRIP.HOW_LONG_LABEL')}>
          <View style={s.daysRow}>
            <GlobalText
              style={s.daysValue}
              text={`${days} ${days === 1 ? t('TRIP.ONE_DAY') : t('TRIP.DAYS_WORD')}`}
            />
            <View style={s.stepper}>
              <TouchableOpacity
                style={s.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="−"
                disabled={days <= 1}
                onPress={() => setDays(d => Math.max(1, d - 1))}>
                <GlobalText text="−" style={s.stepTxt} />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="+"
                disabled={days >= maxDays}
                onPress={() => setDays(d => Math.min(maxDays, d + 1))}>
                <GlobalText text="+" style={s.stepTxt} />
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        {/* Who is going. Placed after the length because the two together
            are what set the pace of each day, and defaulted to two adults so
            a traveller who ignores it is answering it correctly. */}
        <Section label={t('TRIP.WHO_LABEL')} hint={t('TRIP.WHO_HINT')}>
          <View style={s.daysRow}>
            <GlobalText
              style={s.daysValue}
              text={
                adults === 1
                  ? t('TRIP.ONE_ADULT')
                  : t('TRIP.N_ADULTS', {count: adults})
              }
            />
            <View style={s.stepper}>
              <TouchableOpacity
                style={s.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="−"
                disabled={adults <= 1}
                onPress={() => setAdults(a => Math.max(1, a - 1))}>
                <GlobalText text="−" style={s.stepTxt} />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="+"
                disabled={adults >= 30}
                onPress={() => setAdults(a => Math.min(30, a + 1))}>
                <GlobalText text="+" style={s.stepTxt} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.daysRow}>
            <GlobalText
              style={s.daysValue}
              text={
                children === 1
                  ? t('TRIP.ONE_CHILD')
                  : t('TRIP.N_CHILDREN', {count: children})
              }
            />
            <View style={s.stepper}>
              <TouchableOpacity
                style={s.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="−"
                disabled={children <= 0}
                onPress={() => setChildren(c => Math.max(0, c - 1))}>
                <GlobalText text="−" style={s.stepTxt} />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="+"
                disabled={children >= 20}
                onPress={() => setChildren(c => Math.min(20, c + 1))}>
                <GlobalText text="+" style={s.stepTxt} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Served by the backend, never shipped in the app: a type added
              in config must not need a release to appear. */}
          {!!(options?.group?.types || []).length && (
            <View style={s.chips}>
              {options.group.types.map(ty => (
                <Chip
                  key={ty.code}
                  label={t(`TRIP.TYPE_${ty.code.toUpperCase()}`, ty.name)}
                  on={tripType === ty.code}
                  onPress={() =>
                    setTripType(tripType === ty.code ? null : ty.code)
                  }
                />
              ))}
            </View>
          )}
        </Section>

        <Section label={t('TRIP.STAY_LABEL')}>
          <Choice
            value={stay}
            onChange={setStay}
            options={[
              {
                value: 'suggest',
                icon: 'bed-outline',
                label: t('TRIP.STAY_SUGGEST'),
                hint: t('TRIP.STAY_SUGGEST_HINT'),
              },
              {
                value: 'booked',
                icon: 'checkmark-circle-outline',
                label: t('TRIP.STAY_BOOKED'),
                hint: t('TRIP.STAY_BOOKED_HINT'),
              },
            ]}
          />
          {stay === 'booked' && (
            <View style={s.note}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color="#8A6A12"
              />
              <GlobalText text={t('TRIP.STAY_PICK_LATER')} style={s.noteTxt} />
            </View>
          )}
        </Section>

        <Section label={t('TRIP.ARRIVAL_LABEL')} hint={t('TRIP.ARRIVAL_HINT')}>
          <View style={s.chips}>
            {(options?.arrival?.modes || []).map(m => (
              <Chip
                key={m.code}
                label={m.label}
                on={arrivalMode === m.code}
                onPress={() => {
                  // Changing mode invalidates the point: a railway station is
                  // not somewhere a flight lands.
                  setArrivalMode(cur => (cur === m.code ? null : m.code));
                  setArrivalPoint(null);
                }}
              />
            ))}
          </View>

          {arrivalMode && arrivalMode !== 'own_vehicle' ? (
            pointsForMode.length === 0 ? (
              <GlobalText text={t('TRIP.ARRIVAL_NO_POINTS')} style={s.hint} />
            ) : (
              <View style={[s.chips, s.chipsSpaced]}>
                {pointsForMode.map(point => (
                  <Chip
                    key={point.site_id}
                    label={point.name}
                    on={arrivalPoint === point.site_id}
                    onPress={() =>
                      setArrivalPoint(cur =>
                        cur === point.site_id ? null : point.site_id,
                      )
                    }
                  />
                ))}
              </View>
            )
          ) : null}

          {arrivalMode ? (
            <View style={s.timeRow}>
              <GlobalText text={t('TRIP.ARRIVAL_AT')} style={s.timeLabel} />
              <TextInput
                style={s.timeInput}
                value={arrivalAt}
                onChangeText={setArrivalAt}
                placeholder="13:40"
                placeholderTextColor={C.textLight}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          ) : null}

          {quote?.arrival?.onward ? (
            <View style={s.connection}>
              <Ionicons name="bus" size={17} color={C.oceanMid} />
              <GlobalText
                style={s.connectionTxt}
                text={t('TRIP.ARRIVAL_ONWARD', {
                  depart: quote.arrival.onward.depart,
                  route: quote.arrival.onward.route_no,
                  start: quote.arrival.earliest_start,
                })}
              />
            </View>
          ) : null}

          {/* The other answer. Only the good news was shown here, so a
              traveller landing somewhere no bus serves was told nothing at
              all — and then wondered why the first day looked thin. */}
          {quote?.arrival && !quote.arrival.onward && arrivalPoint ? (
            <View style={s.note}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color="#8A6A12"
              />
              <GlobalText text={t('TRIP.ARRIVAL_NO_BUS')} style={s.noteTxt} />
            </View>
          ) : null}
        </Section>

        {/*
          The question that used to be two buttons on the home card. Both
          answers are on screen with what they do, so the extra screens are
          something a traveller can see and choose rather than a door they
          had to know about.
        */}
        <Section label={t('TRIP.MODE_LABEL')}>
          <Choice
            value={mode}
            onChange={setMode}
            options={[
              {
                value: 'pick',
                icon: 'map-outline',
                label: t('TRIP.MODE_PICK'),
                hint: t('TRIP.MODE_PICK_HINT'),
              },
              {
                value: 'ai',
                icon: 'sparkles-outline',
                label: t('TRIP.MODE_AI'),
                hint: t('TRIP.MODE_AI_HINT'),
              },
            ]}
          />
        </Section>
      </ScrollView>

      <StepFooter
        label={mode === 'ai' ? t('TRIP.STEP1_NEXT_AI') : t('TRIP.STEP1_NEXT')}
        verdict={verdict()}
        ready={ready}
        busy={saving}
        onPress={next}
      />
    </View>
  );
};

const s = StyleSheet.create({
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  daysValue: {fontSize: 15, fontWeight: '700', color: C.textDark},
  stepper: {flexDirection: 'row', gap: 10},
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTxt: {fontSize: 19, fontWeight: '700', color: C.oceanMid},

  chipsSpaced: {marginTop: 10},
  timeRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12},
  timeLabel: {fontSize: 13, color: C.textMid, textAlign: 'left'},
  timeInput: {
    minWidth: 86,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    color: C.textDark,
    fontSize: 14,
  },
  connection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(27,107,123,0.08)',
  },
  note: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#FDF6E3',
  },
  noteTxt: {
    flex: 1,
    fontSize: 12.5,
    color: '#6B5614',
    lineHeight: 18,
    textAlign: 'left',
  },

  connectionTxt: {flex: 1, fontSize: 12.5, color: C.textMid, textAlign: 'left'},

  screen: {flex: 1, backgroundColor: C.cream},
  centered: {alignItems: 'center', justifyContent: 'center'},
  body: {padding: 16, paddingBottom: 8},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  hint: {fontSize: 12.5, color: C.textLight},
});

export default TripWhereScreen;
