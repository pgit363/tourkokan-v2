/**
 * Tick a place into the trip, or take it out again.
 *
 * One component because `useInTrip` is keyed on a site id: calling it in a
 * parent that renders a list would give one subscription for the whole list
 * and a stale `inTrip` on every row but one.
 *
 * The spinner is not decoration. `toggle` ignores a tap while a request is in
 * flight, so without a visible pending state a slow reply reads as a dead
 * button and the traveller taps again into silence — which is exactly what
 * the map screen's verification turned up.
 *
 * `compact` is the round icon-only form for a list row; the default is the
 * labelled pill the map card uses.
 */
import React from 'react';
import {ActivityIndicator, StyleSheet, TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import PropTypes from 'prop-types';
import GlobalText from '../Customs/Text';
import {C} from '../Marketplace/theme';
import {useInTrip} from '../../Services/trip';

const AddToTripButton = ({siteId, navigation, compact = false}) => {
  const {t} = useTranslation();
  const {inTrip, pending, toggle} = useInTrip(siteId);

  const icon = inTrip ? 'checkmark' : 'add';
  const tint = inTrip ? C.oceanDeep : C.white;

  return (
    <TouchableOpacity
      style={[
        compact ? s.round : s.pill,
        inTrip && s.on,
        pending && s.waiting,
      ]}
      onPress={() => toggle(navigation)}
      disabled={pending}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{selected: inTrip, disabled: pending}}
      accessibilityLabel={
        inTrip ? t('TRIP.MAP_IN_TRIP') : t('TRIP.MAP_ADD_TO_TRIP')
      }>
      {pending ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        <Ionicons name={icon} size={compact ? 18 : 16} color={tint} />
      )}
      {!compact && (
        <GlobalText
          style={[s.label, inTrip && s.labelOn]}
          text={inTrip ? t('TRIP.MAP_IN_TRIP') : t('TRIP.MAP_ADD_TO_TRIP')}
        />
      )}
    </TouchableOpacity>
  );
};

AddToTripButton.propTypes = {
  siteId: PropTypes.number,
  navigation: PropTypes.object.isRequired,
  compact: PropTypes.bool,
};

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: C.oceanMid,
  },
  round: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.oceanMid,
  },
  on: {backgroundColor: C.oceanFoam},
  waiting: {opacity: 0.7},
  label: {fontSize: 13.5, fontWeight: '700', color: C.white},
  labelOn: {color: C.oceanDeep},
});

export default AddToTripButton;
