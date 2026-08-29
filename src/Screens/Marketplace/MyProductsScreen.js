/**
 * Sell · My products — myProducts, any status, filterable by tab.
 */
import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import CachedImage from '../../Components/Customs/CachedImage';
import StatusPill from '../../Components/Marketplace/StatusPill';
import MarketHeader from '../../Components/Marketplace/MarketHeader';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import {productCoverUri, productPrice, localised} from '../../Services/marketplace';
import {myProducts, mySites} from '../../Services/Api/MarketplaceServices';
import {navigateTo} from '../../Services/CommonMethods';
import CategoryArt from '../../Components/Common/CategoryArt';

const money = n => (n == null ? '' : '₹' + Number(n).toLocaleString('en-IN'));

const TABS = [
  {key: '', tkey: 'ALL'},
  {key: 'approved', tkey: 'STATUS_LIVE'},
  {key: 'pending', tkey: 'STATUS_PENDING'},
  {key: 'draft', tkey: 'STATUS_DRAFT'},
  {key: 'rejected', tkey: 'STATUS_REJECTED'},
];

const MyProductsScreen = ({navigation}) => {
  useMarketBack(navigation);
  const {t, i18n} = useTranslation();
  const [tab, setTab] = useState('');
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (status, site) => {
      setLoading(true);
      const res = await myProducts(
        {status: status || undefined, site_id: site || undefined, page: 1},
        navigation,
      );
      if (res?.data?.success) {
        setRows(res.data.data?.data ?? res.data.data ?? []);
      } else {
        setRows([]);
      }
      setLoading(false);
    },
    [navigation],
  );

  useFocusEffect(
    useCallback(() => {
      load(tab, siteId);
      mySites(navigation).then(r => {
        if (r?.data?.success) setSites(r.data.data?.data ?? r.data.data ?? []);
      });
    }, [load, tab, siteId, navigation]),
  );

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <MarketHeader navigation={navigation} title={t('MARKETPLACE.MY_PRODUCTS')} />

      {sites.length > 1 && (
        <FlatList
          data={[{id: '', name: t('MARKETPLACE.ALL_SITES')}, ...sites]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={x => String(x.id)}
          style={s.siteRow}
          contentContainerStyle={{paddingHorizontal: 12, gap: 7, alignItems: 'center'}}
          renderItem={({item}) => {
            const on = String(siteId) === String(item.id);
            return (
              <TouchableOpacity
                style={[s.siteChip, on && s.siteChipOn]}
                onPress={() => setSiteId(item.id)}>
                <Text
                  style={[s.siteChipTxt, on && s.siteChipTxtOn]}
                  numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={s.tabs}>
        {TABS.map(x => (
          <TouchableOpacity
            key={x.key || 'all'}
            style={[s.tab, tab === x.key && s.tabOn]}
            onPress={() => setTab(x.key)}
            activeOpacity={0.8}>
            <Text style={[s.tabTxt, tab === x.key && s.tabTxtOn]}>{t('MARKETPLACE.' + x.tkey)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} color={C.oceanMid} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, i) => `${item.id}_${i}`}
          contentContainerStyle={s.list}
          renderItem={({item}) => {
            const cover = productCoverUri(item);
            return (
              <TouchableOpacity
                style={s.row}
                activeOpacity={0.85}
                onPress={() =>
                  navigateTo(navigation, t('SCREEN.MANAGE_PRODUCT'), {id: item.id})
                }>
                {cover ? (
                  <CachedImage source={{uri: cover}} style={s.img} resizeMode="cover" />
                ) : (
                  <CategoryArt
                    bookingType={item.product_category?.booking_type}
                    style={s.img}
                  />
                )}
                <View style={{flex: 1, minWidth: 0}}>
                  <Text style={s.name} numberOfLines={1}>
                    {localised(item, 'name', i18n.language)}
                  </Text>
                  <Text style={s.meta} numberOfLines={1}>
                    {item.product_category?.name}
                    {item.views_count != null ? ` · ${t('MARKETPLACE.VIEWS_COUNT', {count: item.views_count})}` : ''}
                    {item.leads_count != null ? ` · ${t('MARKETPLACE.LEADS_COUNT', {count: item.leads_count})}` : ''}
                  </Text>
                  <Text style={s.price}>{money(productPrice(item))}</Text>
                </View>
                <StatusPill status={item.status} />
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={{height: 9}} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={s.emptyTxt}>{t('MARKETPLACE.NOTHING_HERE')}</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.9}
        onPress={() => navigateTo(navigation, t('SCREEN.ADD_PRODUCT'))}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={s.fabTxt}>{t('MARKETPLACE.ADD_PRODUCT')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  siteRow: {flexGrow: 0, paddingTop: 11, paddingBottom: 2},
  siteChip: {paddingHorizontal: 13, paddingVertical: 6, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line},
  siteChipOn: {backgroundColor: C.oceanMid, borderColor: C.oceanMid},
  siteChipTxt: {fontSize: 11.5, fontWeight: '700', color: C.textMid, maxWidth: 150},
  siteChipTxtOn: {color: '#fff'},
  tabs: {flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.cream},
  tab: {paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8},
  tabOn: {backgroundColor: '#fff', borderWidth: 1, borderColor: C.line},
  tabTxt: {fontSize: 11.5, fontWeight: '700', color: C.textLight},
  tabTxtOn: {color: C.oceanMid},
  list: {paddingHorizontal: 15, paddingBottom: 90},
  row: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    padding: 9,
  },
  img: {width: 52, height: 52, borderRadius: 10, backgroundColor: '#e8f5f7'},
  name: {fontSize: 12.5, fontWeight: '800', color: C.textDark},
  meta: {fontSize: 10.5, color: C.textLight, marginTop: 3},
  price: {fontSize: 12.5, fontWeight: '800', color: C.oceanMid, marginTop: 3},
  empty: {alignItems: 'center', paddingTop: 70},
  emptyIcon: {fontSize: 40, marginBottom: 12},
  emptyTxt: {fontSize: 14, fontWeight: '700', color: C.textLight},
  fab: {
    position: 'absolute',
    right: 15,
    bottom: 18,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: C.sandMid,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    elevation: 4,
  },
  fabTxt: {color: '#fff', fontWeight: '800', fontSize: 13.5},
});

export default MyProductsScreen;
