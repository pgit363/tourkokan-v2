/**
 * Step 4 of 4 — look it over, then make the plan.
 *
 * The checkout of the stepper: every answer gathered so far laid out on one
 * screen — the towns, the interests, how many days, and the places in the
 * order step 3 left them — with the one button that turns it into an
 * itinerary. Nothing new is asked here; it exists so the traveller commits to
 * something they can see rather than to a form they half-remember filling.
 *
 * It does not generate. The button hands the trip id to the itinerary screen,
 * which is the single place a plan is ever made — so the generating UI, the
 * refusals and the "nothing was charged" reassurance live in one screen
 * instead of two. That screen reads the cart in `sort_order`, which is the
 * order shown here, so the review is honest about what the plan will follow.
 *
 * Town and interest NAMES come from the form options (`town_site_ids` and
 * `category_codes` are ids on the trip). They are loaded here too, not assumed
 * from step 1, so a trip reopened fresh still reads as words rather than ids.
 */
import React, {useCallback, useEffect, useMemo} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import PropTypes from 'prop-types';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {
  EXPRESS_STEPS,
  StepFooter,
  StepHeader,
  TOTAL_STEPS,
} from '../Components/Trip/StepChrome';
import STRING from '../Services/Constants/STRINGS';
import {useTripCart, useTripForm, categoryNames} from '../Services/trip';

// ── Pieces ──────────────────────────────────────────────────────────────────

/** A titled block with an optional "Change" that walks back to its own step. */
const Block = ({label, onChange, children}) => {
  const {t} = useTranslation();

  return (
    <View style={s.block}>
      <View style={s.blockHead}>
        <GlobalText text={label.toUpperCase()} style={s.blockLabel} />
        {!!onChange && (
          <TouchableOpacity
            onPress={onChange}
            accessibilityRole="button"
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <GlobalText text={t('TRIP.STEP4_CHANGE')} style={s.change} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
};

Block.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  children: PropTypes.node,
};

/** One place in the final order — a number and a name, nothing to tap. */
const PlaceRow = ({place, index}) => {
  const {t} = useTranslation();

  return (
    <View style={s.place}>
      <View style={s.position}>
        <GlobalText text={String(index + 1)} style={s.positionTxt} />
      </View>
      <View style={s.placeBody}>
        <GlobalText text={place.name} style={s.placeName} />
        {/* A place they pasted has no categories to show, and saying nothing
            about it would read as a row that failed to load. */}
        {place.custom ? (
          <GlobalText style={s.placeCats} text={t('TRIP.OWN_PLACE_SHORT')} />
        ) : (
          !!(place.categories || []).length && (
            <GlobalText
              style={s.placeCats}
              text={categoryNames(place).slice(0, 2).join(' · ')}
            />
          )
        )}
      </View>
    </View>
  );
};

PlaceRow.propTypes = {
  place: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
};

// ── Screen ──────────────────────────────────────────────────────────────────

const TripReviewScreen = ({navigation, route}) => {
  /**
   * True when step 1 handed the choosing to the model. There are no picked
   * places to show, the flow was two steps rather than four, and the plan is
   * made from the saved filters instead of the cart.
   */
  const express = !!route?.params?.express;
  const {t} = useTranslation();
  const {cart, refresh, update} = useTripCart();
  const {options, load} = useTripForm();

  // Names for the ids on the trip. Loaded here, not carried from step 1, so a
  // resumed trip reads as words. Free — the same question-set the form opens on.
  useEffect(() => {
    load(navigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The order and the count must be current: step 3 may have changed both.
  useFocusEffect(
    useCallback(() => {
      refresh(undefined, navigation);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const filters = cart.filters || {};
  const places = cart.places || [];
  const days = cart.days || 2;

  const townNames = useMemo(() => {
    const ids = (filters.town_site_ids || []).map(Number);
    const byId = new Map((options?.towns || []).map(tw => [tw.site_id, tw.name]));

    return ids.map(id => byId.get(id)).filter(Boolean);
  }, [filters.town_site_ids, options]);

  const interestNames = useMemo(() => {
    const codes = filters.category_codes || [];
    const byCode = new Map(
      (options?.interests || []).map(it => [it.code, it.name]),
    );

    return codes.map(code => byCode.get(code) || code);
  }, [filters.category_codes, options]);

  const setDays = delta => {
    // ai_configs max_days, not a hardcoded 14: the backend trims anything
    // over it when it plans, so offering more was offering something the
    // server would quietly take away.
    const next = Math.min(options?.days?.max ?? 7, Math.max(1, days + delta));

    if (next !== cart.days) {
      update({days: next}, navigation);
    }
  };

  const minimum = cart.minimum || 3;
  const needed = express ? 0 : Math.max(0, minimum - places.length);
  const ready = express
    ? (filters.town_site_ids || []).length > 0
    : cart.canPlan && needed === 0;

  /** The footer line: a reason to wait, or the reassurance that it is free. */
  const verdict = () => {
    if (needed > 0) {
      return t('TRIP.STEP3_TOO_FEW', {needed});
    }
    if (cart.credits != null) {
      return t('TRIP.PLANS_LEFT', {count: cart.credits});
    }

    return t('TRIP.FREE_FOREVER');
  };

  return (
    <View style={s.screen}>
      <SystemBars style="light" />

      <StepHeader
        step={express ? EXPRESS_STEPS : TOTAL_STEPS}
        total={express ? EXPRESS_STEPS : TOTAL_STEPS}
        title={t('TRIP.STEP4_TITLE')}
        caption={t('TRIP.STEP4_CAPTION')}
        backLabel={t('TRIP.BACK')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={s.body}>
        {/* Towns and interests were answered together in step 1. */}
        <Block
          label={t('TRIP.WHERE_LABEL')}
          onChange={() => navigation.navigate(STRING.SCREEN.TRIP_WHERE)}>
          <View style={s.tags}>
            {townNames.length ? (
              townNames.map(name => (
                <View key={name} style={s.tag}>
                  <GlobalText text={name} style={s.tagTxt} />
                </View>
              ))
            ) : (
              <GlobalText text="—" style={s.muted} />
            )}
          </View>
        </Block>

        <Block
          label={t('TRIP.INTERESTS_LABEL')}
          onChange={() => navigation.navigate(STRING.SCREEN.TRIP_WHERE)}>
          <View style={s.tags}>
            {interestNames.length ? (
              interestNames.map(name => (
                <View key={name} style={[s.tag, s.tagSoft]}>
                  <GlobalText text={name} style={s.tagSoftTxt} />
                </View>
              ))
            ) : (
              <GlobalText text={t('TRIP.STEP4_ANY_INTEREST')} style={s.muted} />
            )}
          </View>
        </Block>

        {/* How many days to spread the plan over. Nothing asked it until now. */}
        <Block label={t('TRIP.HOW_MANY_DAYS')}>
          <View style={s.daysRow}>
            {/*
              A count, not an ordinal: `DAY_N` would read "Day 2" under a
              label asking how many, which is a different fact.
            */}
            <GlobalText
              text={`${days} ${days === 1 ? t('TRIP.ONE_DAY') : t('TRIP.DAYS_WORD')}`}
              style={s.daysValue}
            />
            <View style={s.stepper}>
              <TouchableOpacity
                style={s.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="−"
                onPress={() => setDays(-1)}>
                <GlobalText text="−" style={s.stepTxt} />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.stepBtn}
                accessibilityRole="button"
                accessibilityLabel="+"
                onPress={() => setDays(1)}>
                <GlobalText text="+" style={s.stepTxt} />
              </TouchableOpacity>
            </View>
          </View>
        </Block>

        {express ? (
          <Block label={t('TRIP.STEP4_PLACES_AI')}>
            <GlobalText text={t('TRIP.STEP4_AI_PLACES')} style={s.muted} />
          </Block>
        ) : (
          <Block
            label={t('TRIP.STEP4_PLACES')}
            onChange={() => navigation.navigate(STRING.SCREEN.TRIP_ARRANGE)}>
            {places.map((p, i) => (
              <PlaceRow key={String(p.id)} place={p} index={i} />
            ))}
            {/* A place they ticked that has since been unapproved, removed,
                retagged as a bus stop or lost its coordinates. It is gone
                from the list either way; the point is to say so rather than
                let the traveller wonder what happened to it. */}
            {cart.unavailable > 0 && (
              <View style={s.dropped}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#8A6A12"
                />
                <GlobalText
                  style={s.droppedTxt}
                  text={t('TRIP.PLACES_UNAVAILABLE', {count: cart.unavailable})}
                />
              </View>
            )}
          </Block>
        )}

        {/* The "price" of the checkout — which is that there is none. */}
        <View style={s.free}>
          <View style={s.freeIcon}>
            <Ionicons name="sparkles-outline" size={18} color={C.oceanDeep} />
          </View>
          <View style={s.freeBody}>
            <GlobalText text={t('TRIP.STEP4_FREE_TITLE')} style={s.freeTitle} />
            <GlobalText text={t('TRIP.STEP4_FREE_BODY')} style={s.freetxt} />
          </View>
        </View>
      </ScrollView>

      <StepFooter
        label={t('TRIP.STEP4_NEXT')}
        verdict={verdict()}
        ready={ready}
        onPress={() =>
          navigation.navigate(
            STRING.SCREEN.ITINERARY,
            express
              ? {filters, fresh: true}
              : {tripId: cart.tripId, fresh: true},
          )
        }
      />
    </View>
  );
};

TripReviewScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object,
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},
  body: {padding: 16, paddingBottom: 8},

  block: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    padding: 14,
    marginBottom: 12,
  },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  blockLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: C.textLight,
  },
  change: {fontSize: 13, fontWeight: '700', color: C.oceanMid},
  muted: {fontSize: 13.5, color: C.textLight},

  tags: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  tag: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: C.oceanMid,
  },
  tagTxt: {fontSize: 13.5, fontWeight: '700', color: C.white},
  tagSoft: {backgroundColor: 'rgba(27,107,123,0.1)'},
  tagSoftTxt: {fontSize: 13.5, fontWeight: '700', color: C.oceanMid},

  daysRow: {flexDirection: 'row', alignItems: 'center'},
  daysValue: {flex: 1, fontSize: 15, fontWeight: '700', color: C.textDark, textAlign: 'left'},
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

  place: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7},
  position: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27,107,123,0.1)',
  },
  positionTxt: {fontSize: 12.5, fontWeight: '800', color: C.oceanMid},
  placeBody: {flex: 1, minWidth: 0},
  placeName: {fontSize: 14.5, fontWeight: '700', color: C.textDark, textAlign: 'left'},
  dropped: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FDF6E3',
  },
  droppedTxt: {
    flex: 1,
    fontSize: 12,
    color: '#6B5614',
    lineHeight: 17,
    textAlign: 'left',
  },

  placeCats: {fontSize: 12, color: C.textLight, marginTop: 1, textAlign: 'left'},

  free: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(27,107,123,0.07)',
    borderRadius: 16,
    padding: 14,
    marginTop: 2,
  },
  freeIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: C.oceanFoam,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeBody: {flex: 1, minWidth: 0},
  freeTitle: {fontSize: 14.5, fontWeight: '800', color: C.oceanDeep, textAlign: 'left'},
  freetxt: {fontSize: 12.5, color: C.textMid, marginTop: 3, lineHeight: 18, textAlign: 'left'},
});

export default TripReviewScreen;
