/**
 * VendorCTA — Home banner that invites travellers to list their business.
 *
 * Module M1 of the vendor-onboarding plan (docs/vendor-onboarding-plan.md).
 * Purely additive: reuses the existing become-vendor flow in ProfileView.
 *
 * Visibility: hidden for users who are already vendors (read from the cached
 * landing response's user.roles). Shown to everyone else, guests included —
 * tapping opens BecomeVendorScreen, which handles the requestRole call and the
 * missing-contact prompt (M2).
 *
 * `compact` (M7): a slim vendor-acquisition strip for contextual placements —
 * site detail pages ("Own a business here?") rather than the Home banner.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {getFromStorage} from '../../Services/Api/CommonServices';
import STRING from '../../Services/Constants/STRINGS';

const C = {
  purple: '#7A3E9D',
  purpleDeep: '#5E2E82',
  white: '#FFFFFF',
  sand: '#E4B23E',
};

const VendorCTA = ({navigation, compact = false}) => {
  const {t} = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await getFromStorage(STRING.STORAGE.LANDING_RESPONSE);
        const roles = raw ? JSON.parse(raw)?.user?.roles || [] : [];
        const isVendor = Array.isArray(roles) && roles.some(r => r?.code === 'vendor');
        if (alive) setShow(!isVendor);
      } catch {
        // On any read/parse failure, still show the CTA — ProfileView guards
        // the actual state, so a false-positive is harmless.
        if (alive) setShow(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!show) return null;

  if (compact) {
    return (
      <TouchableOpacity
        style={s.stripWrap}
        activeOpacity={0.9}
        onPress={() => navigation.navigate(STRING.SCREEN.BECOME_VENDOR)}>
        <LinearGradient
          colors={[C.purple, C.purpleDeep]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={s.strip}>
          <Ionicons name="storefront-outline" size={20} color={C.white} />
          <View style={s.stripBody}>
            <Text style={s.stripTitle}>{t('VENDOR.OWN_STRIP_TITLE')}</Text>
            <Text style={s.stripDesc} numberOfLines={2}>{t('VENDOR.OWN_STRIP_DESC')}</Text>
          </View>
          <View style={s.stripBtn}>
            <Text style={s.stripBtnTxt}>{t('VENDOR.OWN_STRIP_CTA')}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate(STRING.SCREEN.BECOME_VENDOR)}>
        <LinearGradient
          colors={[C.purple, C.purpleDeep]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={s.card}>
          <View style={s.freeBadge}>
            <Text style={s.freeText}>{t('VENDOR.CTA_TAG')}</Text>
          </View>

          <Text style={s.kicker}>{t('VENDOR.CTA_KICKER')}</Text>
          <Text style={s.title}>{t('VENDOR.CTA_TITLE')}</Text>
          <Text style={s.desc}>{t('VENDOR.CTA_DESC')}</Text>

          <View style={s.action}>
            <Text style={s.actionText}>{t('VENDOR.CTA_ACTION')}</Text>
            <Ionicons name="arrow-forward" size={16} color={C.purple} />
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
  freeText: {fontSize: 10, fontWeight: '800', color: '#3A2A00', textTransform: 'uppercase'},
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
  },
  title: {fontSize: 19, fontWeight: '800', color: C.white, marginTop: 4, maxWidth: '82%'},
  desc: {fontSize: 12.5, color: 'rgba(255,255,255,0.92)', marginTop: 4, maxWidth: '90%', lineHeight: 18},
  action: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.white,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginTop: 12,
  },
  actionText: {fontSize: 13, fontWeight: '800', color: C.purple},

  // compact strip (M7)
  stripWrap: {marginTop: 18},
  strip: {flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 14, padding: 13},
  stripBody: {flex: 1},
  stripTitle: {fontSize: 13.5, fontWeight: '800', color: C.white},
  stripDesc: {fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 1},
  stripBtn: {backgroundColor: C.white, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 7},
  stripBtnTxt: {fontSize: 11.5, fontWeight: '800', color: C.purple},
});

export default VendorCTA;
