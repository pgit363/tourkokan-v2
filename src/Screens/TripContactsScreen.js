/**
 * Every number on the trip, on one screen.
 *
 * The itinerary already carries a phone and whatsapp on each stop's site row,
 * so this screen is a re-cut of data the traveller is holding — not a fetch.
 * Its value is the re-cut itself: on the road you want "who do I ring about
 * tonight", not to scroll a day looking for the one stop with a number.
 *
 * Stops with no number are still listed, labelled as public places. Dropping
 * them would leave a traveller wondering whether a beach was missing or just
 * unreachable, and the honest answer is that nobody runs a beach.
 */
import React, {useMemo} from 'react';
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

const digits = v => String(v || '').replace(/[^0-9]/g, '');

const ContactRow = ({stop, t}) => {
  const site = stop.site || {};
  const has = !!site.phone || !!site.whatsapp;

  return (
    <View style={s.row}>
      <View style={s.rowText}>
        <GlobalText text={site.name || '—'} style={s.name} numberOfLines={2} />
        <GlobalText
          style={s.sub}
          numberOfLines={1}
          text={
            has
              ? categoryNames(site).join(' · ') ||
                stop.arrive ||
                ''
              : t('TRIP.NO_CONTACT')
          }
        />
      </View>

      {!!site.phone && (
        <TouchableOpacity
          style={s.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={t('TRIP.CALL')}
          onPress={() => Linking.openURL(`tel:${site.phone}`)}
          activeOpacity={0.8}>
          <Ionicons name="call-outline" size={17} color={C.oceanMid} />
        </TouchableOpacity>
      )}
      {!!site.whatsapp && (
        <TouchableOpacity
          style={[s.iconBtn, s.waBtn]}
          accessibilityRole="button"
          accessibilityLabel={t('TRIP.WHATSAPP')}
          onPress={() => Linking.openURL(`whatsapp://send?phone=${digits(site.whatsapp)}`)}
          activeOpacity={0.8}>
          <Ionicons name="logo-whatsapp" size={17} color={C.wa} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const TripContactsScreen = ({navigation, route}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  // Stabilised: `route.params.days || []` creates a fresh array each render,
  // which would re-run the memo below every time and defeat its purpose.
  const days = useMemo(() => route?.params?.days || [], [route?.params?.days]);

  const anyNumber = useMemo(
    () =>
      days.some(d =>
        (d.stops || []).some(st => st.site?.phone || st.site?.whatsapp),
      ),
    [days],
  );

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
            <GlobalText text={t('TRIP.CONTACTS_TITLE')} style={s.headerTitle} />
            <GlobalText text={t('TRIP.CONTACTS_SUB')} style={s.headerSub} />
          </View>
        </View>
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[s.body, {paddingBottom: insets.bottom + 28}]}
        showsVerticalScrollIndicator={false}>
        {!anyNumber && (
          <GlobalText text={t('TRIP.CONTACTS_EMPTY')} style={s.empty} />
        )}

        {days.map((d, i) => (
          <View key={d.day ?? i} style={s.dayBlock}>
            <GlobalText
              text={t('TRIP.DAY_N', {n: d.day ?? i + 1})}
              style={s.dayLabel}
            />
            <View style={s.card}>
              {(d.stops || []).map((st, j) => (
                <View key={st.site?.id ?? j}>
                  {j > 0 && <View style={s.sep} />}
                  <ContactRow stop={st} t={t} />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Said plainly because a vendor number on screen invites the worry. */}
        <GlobalText text={t('TRIP.CONTACTS_PRIVACY')} style={s.privacy} />
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
    fontSize: 19,
    fontWeight: '700',
    color: C.white,
    textAlign: 'left',
  },
  headerSub: {
    fontSize: 12.5,
    color: C.oceanFoam,
    opacity: 0.9,
    marginTop: 1,
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

  body: {paddingHorizontal: 16, paddingTop: 16},
  empty: {fontSize: 13.5, color: C.textMid, lineHeight: 20, marginBottom: 14},

  dayBlock: {marginBottom: 18},
  dayLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
    marginLeft: 2,
    textAlign: 'left',
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 13,
  },
  sep: {height: 1, backgroundColor: C.line},

  row: {flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 12},
  rowText: {flex: 1},
  name: {fontSize: 14.5, fontWeight: '700', color: C.textDark, textAlign: 'left'},
  sub: {fontSize: 12, color: C.textLight, marginTop: 2, textAlign: 'left'},
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(27,107,123,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
  },
  waBtn: {borderColor: 'rgba(37,211,102,0.45)'},

  privacy: {
    fontSize: 11.5,
    color: C.textLight,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 10,
  },
});

export default TripContactsScreen;
