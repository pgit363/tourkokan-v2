/**
 * Marketplace · Vendor profile — vendorProfile: business identity, its live
 * outlets, and the catalog across all outlets. Never shows owner PII.
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SystemBars} from 'react-native-edge-to-edge';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import ProductCard from '../../Components/Marketplace/ProductCard';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import {localised} from '../../Services/marketplace';
import {vendorProfile} from '../../Services/Api/MarketplaceServices';
import {backPage, navigateTo} from '../../Services/CommonMethods';

const Stat = ({value, label}) => (
  <View style={s.stat}>
    <Text style={s.statVal}>{value}</Text>
    <Text style={s.statLab}>{label}</Text>
  </View>
);

const VendorProfileScreen = ({navigation, route}) => {
  useMarketBack(navigation);
  const {t, i18n} = useTranslation();
  const lang = i18n.language;
  const id = route.params?.id;
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await vendorProfile({id}, navigation);
      if (mounted && res?.data?.success) setData(res.data.data);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id, navigation]);

  if (loading) {
    return (
      <View style={s.center}>
        <SystemBars style="dark" />
        <ActivityIndicator color={C.oceanMid} />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={s.center}>
        <SystemBars style="dark" />
        <Text style={s.muted}>{t('MARKETPLACE.BUSINESS_UNAVAILABLE')}</Text>
        <TouchableOpacity onPress={() => backPage(navigation)}>
          <Text style={s.back}>{t('MARKETPLACE.GO_BACK')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = data.business_name || localised(data, 'name', lang);
  const outlets = data.outlets || data.sites || [];
  const catalog =
    data.products?.data || data.products || data.catalog || data.catalog?.data || [];

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[C.oceanDeep, C.forestMid]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[s.head, {paddingTop: insets.top + 8}]}>
          <TouchableOpacity
            onPress={() => backPage(navigation)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={s.headRow}>
            <View style={s.bigLogo}>
              <Text style={s.bigLogoTxt}>
                {(name || '?').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={s.vName}>{name}</Text>
              {!!data.tag_line && <Text style={s.vTag}>{data.tag_line}</Text>}
            </View>
          </View>
          <View style={s.statRow}>
            <Stat value={outlets.length || data.outlet_count || 0} label={t('MARKETPLACE.OUTLETS')} />
            <Stat value={catalog.length || data.product_count || 0} label={t('MARKETPLACE.LISTINGS')} />
            {data.rating_avg_rate != null && (
              <Stat value={Number(data.rating_avg_rate).toFixed(1)} label={t('MARKETPLACE.RATING')} />
            )}
          </View>
        </LinearGradient>

        <View style={s.body}>
          {outlets.length > 0 && (
            <>
              <Text style={s.sLabel}>{t('MARKETPLACE.OUTLETS')}</Text>
              {outlets.map((o, i) => (
                <View key={o.id || i} style={s.outlet}>
                  <View style={s.oIcon}>
                    <Ionicons name="storefront-outline" size={18} color={C.oceanMid} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={s.oName} numberOfLines={1}>
                      {localised(o, 'name', lang) || o.name}
                    </Text>
                    {(o.pin_code || o.rating_avg_rate != null) && (
                      <Text style={s.muted}>
                        {o.pin_code ? t('MARKETPLACE.PIN', {code: o.pin_code}) : ''}
                        {o.rating_avg_rate != null
                          ? `  ★ ${Number(o.rating_avg_rate).toFixed(1)}`
                          : ''}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          {catalog.length > 0 && (
            <>
              <Text style={s.sLabel}>{t('MARKETPLACE.CATALOG')}</Text>
              <View style={{gap: 12}}>
                {catalog.map((p, i) => (
                  <ProductCard
                    key={p.id || i}
                    product={p}
                    onPress={prod =>
                      navigateTo(navigation, t('SCREEN.PRODUCT_DETAIL'), {
                        id: prod.id,
                      })
                    }
                  />
                ))}
              </View>
            </>
          )}

          <View style={{height: 24}} />
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream, gap: 10},
  muted: {fontSize: 11, color: C.textLight},
  back: {color: C.oceanMid, fontWeight: '700'},
  head: {paddingHorizontal: 15, paddingBottom: 18},
  headRow: {flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8},
  bigLogo: {
    width: 56,
    height: 56,
    borderRadius: 15,
    backgroundColor: C.sandMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigLogoTxt: {color: '#fff', fontWeight: '800', fontSize: 20},
  vName: {color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3},
  vTag: {color: 'rgba(255,255,255,0.82)', fontSize: 11.5, marginTop: 2},
  statRow: {flexDirection: 'row', gap: 8, marginTop: 13},
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 11,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statVal: {color: '#fff', fontSize: 15, fontWeight: '800'},
  statLab: {color: 'rgba(255,255,255,0.78)', fontSize: 8.5, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1},
  body: {padding: 15},
  sLabel: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: C.sandMid,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 6,
  },
  outlet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    padding: 10,
    marginBottom: 9,
  },
  oIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(27,107,123,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oName: {fontSize: 12.5, fontWeight: '800', color: C.textDark},
});

export default VendorProfileScreen;
