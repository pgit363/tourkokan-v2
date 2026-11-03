/**
 * One stop, in full.
 *
 * Everything here arrived with the itinerary — the server attached the site
 * row to each stop at generation time. So this screen fetches nothing: it is
 * the stop the traveller already has, given room to breathe.
 *
 * That also decides what it does NOT show. The design sketches "Move to Day 2"
 * and "Remove stop", but a generated itinerary has no edit endpoint — the cart
 * operations work on drafts, not on a plan that has been produced. Rendering
 * those buttons would mean two controls that cannot do anything, so they are
 * left out until the server can honour them.
 *
 * Opening hours and a street address are likewise absent from the site row, so
 * the design's "Open today" line has nothing truthful behind it yet.
 */
import React from 'react';
import {Linking, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {categoryNames} from '../Services/trip';
import GlobalText from '../Components/Customs/Text';
import {C} from '../Components/Marketplace/theme';
import {backPage} from '../Services/CommonMethods';

/** A phone row only renders when there is a real number on the row. */
const ActionBtn = ({icon, label, tint, onPress}) => (
  <TouchableOpacity style={[s.action, {borderColor: tint}]} onPress={onPress} activeOpacity={0.85}>
    <Ionicons name={icon} size={16} color={tint} />
    <GlobalText text={label} style={[s.actionText, {color: tint}]} />
  </TouchableOpacity>
);

const TripStopDetailScreen = ({navigation, route}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const stop = route?.params?.stop || {};
  const dayNumber = route?.params?.day;
  const site = stop.site || {};

  const categories = categoryNames(site);
  const when = [
    dayNumber ? t('TRIP.DAY_N', {n: dayNumber}) : null,
    stop.arrive || null,
  ]
    .filter(Boolean)
    .join(' · ');

  const maps =
    site.latitude && site.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`
      : null;

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
          <GlobalText text={t('TRIP.STOP_DETAIL')} style={s.headerTitle} />
        </View>
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.body, {paddingBottom: insets.bottom + 28}]}
        showsVerticalScrollIndicator={false}>
        {!!when && <GlobalText text={when} style={s.when} />}

        <View style={s.titleRow}>
          <GlobalText text={site.name || '—'} style={s.title} />
          {!!site.verified && (
            <Ionicons name="shield-checkmark" size={16} color={C.oceanMid} />
          )}
        </View>

        {categories.length > 0 && (
          <GlobalText text={categories.join(' · ')} style={s.cats} />
        )}
        {!!site.verified && (
          <GlobalText text={t('TRIP.VERIFIED_PLACE')} style={s.verifiedNote} />
        )}

        {/* The model wrote this line; everything else on the screen is a row. */}
        {!!stop.note && (
          <View style={s.card}>
            <GlobalText text={t('TRIP.WHY_HERE')} style={s.cardLabel} />
            <GlobalText text={stop.note} style={s.why} />
          </View>
        )}

        <View style={s.actions}>
          {!!site.phone && (
            <ActionBtn
              icon="call-outline"
              label={t('TRIP.CALL')}
              tint={C.oceanMid}
              onPress={() => Linking.openURL(`tel:${site.phone}`)}
            />
          )}
          {!!site.whatsapp && (
            <ActionBtn
              icon="logo-whatsapp"
              label={t('TRIP.WHATSAPP')}
              tint={C.wa}
              onPress={() =>
                Linking.openURL(
                  `whatsapp://send?phone=${String(site.whatsapp).replace(/[^0-9]/g, '')}`,
                )
              }
            />
          )}
          {!!maps && (
            <ActionBtn
              icon="map-outline"
              label={t('TRIP.OPEN_IN_MAPS')}
              tint={C.textMid}
              onPress={() => Linking.openURL(maps)}
            />
          )}
        </View>

        {!site.phone && !site.whatsapp && (
          <GlobalText text={t('TRIP.NO_CONTACT')} style={s.noContact} />
        )}
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
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
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

  body: {paddingHorizontal: 18, paddingTop: 16},
  when: {
    fontSize: 11.5,
    fontWeight: '700',
    color: C.oceanMid,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'left',
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6},
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: C.textDark,
    lineHeight: 30,
    textAlign: 'left',
  },
  cats: {fontSize: 13.5, color: C.textMid, marginTop: 4, textAlign: 'left'},
  verifiedNote: {
    fontSize: 11.5,
    color: C.oceanMid,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'left',
  },

  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 14,
    marginTop: 18,
  },
  cardLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
    textAlign: 'left',
  },
  why: {fontSize: 14, color: C.textDark, lineHeight: 21, textAlign: 'left'},

  actions: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20},
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: C.white,
  },
  actionText: {fontSize: 13.5, fontWeight: '700'},
  noContact: {
    fontSize: 12.5,
    color: C.textLight,
    marginTop: 16,
    lineHeight: 18,
    textAlign: 'left',
  },
});

export default TripStopDetailScreen;
