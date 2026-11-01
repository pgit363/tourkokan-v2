/**
 * Plan a trip — the form, for a traveller who has not ticked anything.
 *
 * Four questions in one scroll: where, what, how long, and where you are
 * sleeping. Nothing here is a hardcoded list; the towns and the interests are
 * served by `questionSet`, because only the database knows which interests
 * have places behind them, and offering one that does not would mean the
 * refusal arrives after the traveller has chosen.
 *
 * The bar at the bottom is the point of the screen. It asks the server what
 * the current filters would give — free, no model call — so "not enough to see
 * for four days" appears while an interest can still be added, rather than
 * after a plan has been spent.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
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
import {useTripForm} from '../Services/trip';

/** How long to wait after a tap before asking the server what it would give. */
const QUOTE_DELAY = 450;

// ── Pieces ──────────────────────────────────────────────────────────────────

const Section = ({label, hint, children}) => (
  <View style={s.section}>
    <GlobalText text={label.toUpperCase()} style={s.sectionLabel} />
    {!!hint && <GlobalText text={hint} style={s.sectionHint} />}
    {children}
  </View>
);

const Chip = ({label, meta, on, onPress}) => (
  <TouchableOpacity
    style={[s.chip, on && s.chipOn]}
    accessibilityRole="button"
    accessibilityState={{selected: on}}
    onPress={onPress}>
    <GlobalText text={label} style={[s.chipTxt, on && s.chipTxtOn]} />
    {!!meta && (
      <GlobalText text={meta} style={[s.chipMeta, on && s.chipMetaOn]} />
    )}
  </TouchableOpacity>
);

/** Two mutually exclusive answers, side by side. */
const Choice = ({options, value, onChange}) => (
  <View style={s.choice}>
    {options.map(option => {
      const on = option.value === value;

      return (
        <TouchableOpacity
          key={option.value}
          style={[s.choiceBtn, on && s.choiceBtnOn]}
          accessibilityRole="radio"
          accessibilityState={{selected: on}}
          onPress={() => onChange(option.value)}>
          <Ionicons
            name={option.icon}
            size={19}
            color={on ? C.oceanMid : C.textLight}
          />
          <GlobalText
            text={option.label}
            style={[s.choiceTxt, on && s.choiceTxtOn]}
          />
          {!!option.hint && (
            <GlobalText text={option.hint} style={s.choiceHint} />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

// ── Screen ──────────────────────────────────────────────────────────────────

const PlanTripScreen = ({navigation}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {options, loading, quote, quoting, load, ask} = useTripForm();

  const [towns, setTowns] = useState([]);
  const [interests, setInterests] = useState([]);
  const [days, setDays] = useState(2);
  const [stay, setStay] = useState('suggest');

  useEffect(() => {
    load(navigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxDays = options?.days?.max ?? 7;
  const maxTowns = options?.max_towns ?? 3;

  const filters = useMemo(
    () => ({
      town_site_ids: towns,
      category_codes: interests,
      days,
      stay,
      radius_km: options?.radius_km ?? 40,
    }),
    [towns, interests, days, stay, options?.radius_km],
  );

  /**
   * Ask again shortly after the traveller stops tapping. A quote per tap would
   * be a request per chip while they make up their mind, and the answer to the
   * half-built filter set is not one they need.
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

        // At the cap, the newest choice replaces the oldest rather than being
        // silently dropped — a tap that does nothing reads as a broken screen.
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

  const step = useCallback(
    by => setDays(d => Math.max(1, Math.min(maxDays, d + by))),
    [maxDays],
  );

  const ready = towns.length > 0 && quote?.can_plan === true;

  /** What the bar under the button says about the current filters. */
  const verdict = () => {
    if (towns.length === 0) {
      return t('TRIP.PICK_A_TOWN');
    }
    if (quoting || !quote) {
      return t('TRIP.CHECKING');
    }
    if (quote.can_plan) {
      return t('TRIP.PLACES_FOUND', {count: quote.candidates});
    }
    if (quote.reason === 'not_enough_places') {
      return t('TRIP.THIN_FOR_DAYS', {
        count: quote.candidates,
        needed: quote.needed,
      });
    }

    return t('TRIP.CANNOT_PLAN');
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

      <View style={[s.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={s.back}
          accessibilityRole="button"
          accessibilityLabel={t('TRIP.BACK')}
          onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <GlobalText text={t('TRIP.PLAN_A_TRIP')} style={s.headerTitle} />
          {options?.credits != null && (
            <GlobalText
              text={t('TRIP.PLANS_LEFT', {count: options.credits})}
              style={s.headerMeta}
            />
          )}
        </View>
      </View>

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
            <GlobalText text={t('TRIP.NO_TOWNS')} style={s.sectionHint} />
          )}
        </Section>

        <Section
          label={t('TRIP.INTERESTS_LABEL')}
          hint={t('TRIP.INTERESTS_HINT')}>
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
          <View style={s.stepper}>
            <TouchableOpacity
              style={s.stepBtn}
              accessibilityRole="button"
              accessibilityLabel="-"
              disabled={days <= 1}
              onPress={() => step(-1)}>
              <GlobalText text="−" style={s.stepTxt} />
            </TouchableOpacity>
            <View style={s.stepValueBox}>
              <GlobalText text={String(days)} style={s.stepValue} />
              <GlobalText
                text={days === 1 ? t('TRIP.ONE_DAY') : t('TRIP.DAYS_WORD')}
                style={s.stepUnit}
              />
            </View>
            <TouchableOpacity
              style={s.stepBtn}
              accessibilityRole="button"
              accessibilityLabel="+"
              disabled={days >= maxDays}
              onPress={() => step(1)}>
              <GlobalText text="+" style={s.stepTxt} />
            </TouchableOpacity>
          </View>
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
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.primaryBtn, !ready && s.primaryBtnOff]}
          accessibilityRole="button"
          accessibilityState={{disabled: !ready}}
          disabled={!ready}
          onPress={() =>
            navigateTo(navigation, t('SCREEN.ITINERARY'), {filters})
          }>
          <GlobalText text={t('TRIP.PLAN_MY_TRIP')} style={s.primaryTxt} />
        </TouchableOpacity>
        <View style={s.verdict}>
          {quoting && <ActivityIndicator size="small" color={C.textLight} />}
          <GlobalText text={verdict()} style={s.verdictTxt} />
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},
  centered: {alignItems: 'center', justifyContent: 'center'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.oceanDeep,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
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

  body: {padding: 16, paddingBottom: 8},

  section: {marginBottom: 26},
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: C.textLight,
    marginBottom: 4,
  },
  sectionHint: {fontSize: 12.5, color: C.textLight, marginBottom: 11},

  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  chipOn: {borderColor: C.oceanMid, backgroundColor: 'rgba(27,107,123,0.08)'},
  chipTxt: {fontSize: 14, fontWeight: '600', color: C.textDark},
  chipTxtOn: {color: C.oceanMid, fontWeight: '700'},
  chipMeta: {fontSize: 11, color: C.textLight},
  chipMetaOn: {color: C.oceanMid},

  stepper: {flexDirection: 'row', alignItems: 'center', gap: 16},
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTxt: {fontSize: 22, fontWeight: '700', color: C.oceanMid},
  stepValueBox: {alignItems: 'center', minWidth: 64},
  stepValue: {fontSize: 26, fontWeight: '800', color: C.textDark},
  stepUnit: {fontSize: 12, color: C.textLight},

  choice: {flexDirection: 'row', gap: 10},
  choiceBtn: {
    flex: 1,
    gap: 5,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  choiceBtnOn: {
    borderColor: C.oceanMid,
    backgroundColor: 'rgba(27,107,123,0.06)',
  },
  choiceTxt: {fontSize: 14.5, fontWeight: '700', color: C.textDark},
  choiceTxtOn: {color: C.oceanMid},
  choiceHint: {fontSize: 11.5, color: C.textLight, lineHeight: 16},

  note: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: C.sandPale,
    borderRadius: 14,
    padding: 13,
    marginTop: 12,
  },
  noteTxt: {flex: 1, fontSize: 12.5, color: '#6B5614', lineHeight: 18},

  footer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: C.oceanMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnOff: {backgroundColor: C.textLight, opacity: 0.4},
  primaryTxt: {fontSize: 16, fontWeight: '700', color: C.white},
  verdict: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
  },
  verdictTxt: {fontSize: 12.5, color: C.textLight, textAlign: 'center'},
});

export default PlanTripScreen;
