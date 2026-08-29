/**
 * Marketplace · Vendors — listVendors, one card per owner (not per outlet).
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useTranslation} from 'react-i18next';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import MarketHeader from '../../Components/Marketplace/MarketHeader';
import {localised} from '../../Services/marketplace';
import {listVendors} from '../../Services/Api/MarketplaceServices';
import {navigateTo} from '../../Services/CommonMethods';

const VendorCard = ({vendor, lang, t, onPress}) => {
  const name = vendor.business_name || localised(vendor, 'name', lang);
  return (
    <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={() => onPress(vendor)}>
      <View style={s.logo}>
        <Text style={s.logoTxt}>{(name || '?').slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={{flex: 1, minWidth: 0}}>
        <Text style={s.name} numberOfLines={1}>{name}</Text>
        {!!vendor.tag_line && (
          <Text style={s.tag} numberOfLines={1}>{vendor.tag_line}</Text>
        )}
        <View style={s.meta}>
          {vendor.outlet_count != null && (
            <Text style={s.metaChip}>{t('MARKETPLACE.OUTLETS_COUNT', {count: vendor.outlet_count})}</Text>
          )}
          {vendor.product_count != null && (
            <Text style={s.metaChip}>{t('MARKETPLACE.LISTINGS_COUNT', {count: vendor.product_count})}</Text>
          )}
        </View>
      </View>
      {vendor.distance_km != null && (
        <Text style={s.dist}>{t('MARKETPLACE.KM_AWAY', {km: Number(vendor.distance_km).toFixed(1)})}</Text>
      )}
    </TouchableOpacity>
  );
};

const VendorListScreen = ({navigation}) => {
  useMarketBack(navigation);
  const {t, i18n} = useTranslation();
  const [vendors, setVendors] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(
    async (pageArg = 1, append = false) => {
      if (!append) setLoading(true);
      const res = await listVendors({page: pageArg}, navigation);
      const body = res?.data;
      if (body?.success) {
        const rows = body.data?.data ?? body.data ?? [];
        setVendors(prev => (append ? [...prev, ...rows] : rows));
        setPage(body.data?.current_page ?? pageArg);
        setLastPage(body.data?.last_page ?? pageArg);
      } else if (!append) {
        setVendors([]);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [navigation],
  );

  useEffect(() => {
    fetch(1);
  }, [fetch]);

  const openVendor = vendor =>
    navigateTo(navigation, t('SCREEN.VENDOR_PROFILE'), {id: vendor.id});

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <MarketHeader navigation={navigation} title={t('MARKETPLACE.LOCAL_BUSINESSES')} />

      {loading && vendors.length === 0 ? (
        <ActivityIndicator style={{marginTop: 40}} color={C.oceanMid} />
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(v, i) => `${v.id}_${i}`}
          contentContainerStyle={s.list}
          renderItem={({item}) => (
            <VendorCard vendor={item} lang={i18n.language} t={t} onPress={openVendor} />
          )}
          ItemSeparatorComponent={() => <View style={{height: 10}} />}
          onEndReached={() => !loading && page < lastPage && fetch(page + 1, true)}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetch(1);
              }}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🏪</Text>
              <Text style={s.emptyTxt}>{t('MARKETPLACE.NO_BUSINESSES')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  list: {padding: 15},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 15,
    padding: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 13,
    backgroundColor: C.sandMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTxt: {color: '#fff', fontWeight: '800', fontSize: 17},
  name: {fontSize: 13.5, fontWeight: '800', color: C.textDark},
  tag: {fontSize: 10.5, color: C.textLight, marginTop: 2},
  meta: {flexDirection: 'row', gap: 6, marginTop: 6},
  metaChip: {
    fontSize: 9.5,
    fontWeight: '700',
    color: C.oceanMid,
    backgroundColor: 'rgba(27,107,123,0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  dist: {fontSize: 10.5, fontWeight: '800', color: C.oceanMid},
  empty: {alignItems: 'center', paddingTop: 70},
  emptyIcon: {fontSize: 40, marginBottom: 12},
  emptyTxt: {fontSize: 14, fontWeight: '700', color: C.textLight},
});

export default VendorListScreen;
