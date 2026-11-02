/**
 * Step 1 of 4 — where will you be, and what do you like.
 *
 * The same two questions the one-page form opens with, which is why this is a
 * split rather than a rewrite: the chips, the live counts and the free quote
 * all behave as they already did. What changes is what happens next — instead
 * of handing every choice to the model, the answers are saved onto the trip
 * and the traveller goes on to pick their own places.
 *
 * Saved to the server rather than carried in route params or Redux, because
 * `planFromCart` reads them off the trip. That also makes the flow resumable:
 * come back to this step tomorrow and the towns are still ticked.
 *
 * The one-page form stays as the express route for anyone who would rather
 * the model chose everything.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, View} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useTranslation} from 'react-i18next';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {Chip, Section, StepFooter, StepHeader} from '../Components/Trip/StepChrome';
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
  const [saving, setSaving] = useState(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored]);

  const maxTowns = options?.max_towns ?? 3;

  const filters = useMemo(
    () => ({
      town_site_ids: towns,
      category_codes: interests,
      days: cart.days || 2,
      radius_km: options?.radius_km ?? 40,
    }),
    [towns, interests, cart.days, options?.radius_km],
  );

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

  const next = useCallback(async () => {
    setSaving(true);
    // Saved before moving on, so step 2 reads the towns off the trip rather
    // than being handed them and having to pass them on again.
    const ok = await update({filters}, navigation);
    setSaving(false);

    if (ok) {
      navigation.navigate(STRING.SCREEN.TRIP_PICK);
    }
  }, [update, filters, navigation]);

  /** What the footer says about the current answers. */
  const verdict = () => {
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
        title={t('TRIP.STEP1_TITLE')}
        caption={t('TRIP.STEP_OF', {step: 1, total: 4})}
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
      </ScrollView>

      <StepFooter
        label={t('TRIP.STEP1_NEXT')}
        verdict={verdict()}
        ready={ready}
        busy={saving}
        onPress={next}
      />
    </View>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},
  centered: {alignItems: 'center', justifyContent: 'center'},
  body: {padding: 16, paddingBottom: 8},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  hint: {fontSize: 12.5, color: C.textLight},
});

export default TripWhereScreen;
