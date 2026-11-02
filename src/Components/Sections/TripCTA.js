/**
 * TripCTA — the Home banner that starts a trip.
 *
 * The planner is the reason a traveller opens this app, so it cannot live in
 * the drawer: nothing in the drawer is found by someone who has not already
 * been told it is there. This sits directly under the search bar, above the
 * vendor banner, because travellers outnumber vendors on this screen.
 *
 * It has two faces. With an empty cart it invites a plan; with places in it,
 * the cart becomes the primary action and tells them how many more they need
 * — the same count the cart screen shows, from the same server field, so the
 * two can never disagree.
 *
 * Built like VendorCTA on purpose: same gradient card, same action pill, so
 * the two read as siblings rather than as two different products.
 */
import React, {useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import STRING from '../../Services/Constants/STRINGS';
import {useTripCart} from '../../Services/trip';

const C = {
  ocean: '#1B6B7B',
  oceanDeep: '#0D3D4A',
  foam: '#B8E4EA',
  white: '#FFFFFF',
  sand: '#C4972A',
};

const TripCTA = ({navigation}) => {
  const {t} = useTranslation();
  const {cart, refresh} = useTripCart();

  // The cart is shared state that another screen may have changed, so it is
  // re-read on focus rather than once on mount.
  useFocusEffect(
    useCallback(() => {
      refresh(undefined, navigation);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const count = cart.count || 0;
  const remaining = Math.max(0, (cart.minimum || 3) - count);
  const hasCart = count > 0;

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate(STRING.SCREEN.TRIP_WHERE)}>
        <LinearGradient
          colors={[C.ocean, C.oceanDeep]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={s.card}>
          <View style={s.freeBadge}>
            <Text style={s.freeText}>{t('TRIP.CTA_TAG')}</Text>
          </View>

          <Text style={s.kicker}>{t('TRIP.CTA_KICKER')}</Text>
          <Text style={s.title}>
            {hasCart ? t('TRIP.CTA_TITLE_CART') : t('TRIP.CTA_TITLE')}
          </Text>
          <Text style={s.desc}>
            {hasCart
              ? remaining > 0
                ? t('TRIP.CTA_DESC_MORE', {count: count, needed: remaining})
                : t('TRIP.CTA_DESC_READY', {count: count})
              : t('TRIP.CTA_DESC')}
          </Text>

          {/*
            One button. There were two, and they led to two forms that asked
            almost the same questions — the difference between them is now a
            question inside the one form, where it can be seen and changed
            rather than being a fork you commit to from the home screen.
          */}
          <View style={s.row}>
            <View style={s.action}>
              <Ionicons
                name={hasCart ? 'bookmark' : 'compass-outline'}
                size={15}
                color={C.ocean}
              />
              <Text style={s.actionText}>
                {hasCart ? t('TRIP.CTA_CONTINUE') : t('TRIP.CTA_ACTION')}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {paddingHorizontal: 20, marginTop: 8, marginBottom: 4},
  card: {borderRadius: 18, padding: 16, overflow: 'hidden'},
  freeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: C.sand,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  freeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3A2A00',
    textTransform: 'uppercase',
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: C.white,
    marginTop: 4,
    maxWidth: '82%',
  },
  desc: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 4,
    maxWidth: '90%',
    lineHeight: 18,
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12},
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.white,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  actionText: {fontSize: 13, fontWeight: '800', color: C.ocean},
  ghost: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostText: {fontSize: 12.5, fontWeight: '700', color: C.white},
});

export default TripCTA;
