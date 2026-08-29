/**
 * Marketplace · My enquiries — buyer's history of listings they contacted
 * (myEnquiries; mirror of vendor-side myLeads). Rows carry `available`:
 * false → paused/deleted product, render greyed out and inert (guard for
 * `product == null`, hard-deleted listings). Channel filter chips re-request.
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
import ProductCard from '../../Components/Marketplace/ProductCard';
import MarketHeader from '../../Components/Marketplace/MarketHeader';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import {myEnquiries} from '../../Services/Api/MarketplaceServices';
import {navigateTo} from '../../Services/CommonMethods';

const CHANNEL_ICON = {
  call: 'call',
  whatsapp: 'logo-whatsapp',
  directions: 'navigate',
  enquiry: 'chatbubble-ellipses',
};
const CHANNEL_TONE = {
  call: C.oceanMid,
  whatsapp: C.wa,
  directions: C.sandMid,
  enquiry: C.forestMid,
};
const TABS = [
  {key: '', tkey: 'ALL'},
  {key: 'call', tkey: 'LEAD_CALL'},
  {key: 'whatsapp', tkey: 'LEAD_WHATSAPP'},
  {key: 'directions', tkey: 'LEAD_DIRECTIONS'},
  {key: 'enquiry', tkey: 'LEAD_ENQUIRY'},
];

const MyEnquiriesScreen = ({navigation}) => {
  useMarketBack(navigation);
  const {t} = useTranslation();
  const [tab, setTab] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async lead_type => {
      setLoading(true);
      const res = await myEnquiries(
        {lead_type: lead_type || undefined, page: 1},
        navigation,
      );
      if (res?.data?.success) setRows(res.data.data?.data ?? res.data.data ?? []);
      else setRows([]);
      setLoading(false);
    },
    [navigation],
  );

  useFocusEffect(
    useCallback(() => {
      load(tab);
    }, [load, tab]),
  );

  const openProduct = product =>
    navigateTo(navigation, t('SCREEN.PRODUCT_DETAIL'), {id: product.id});

  const shortDate = iso =>
    iso ? String(iso).slice(0, 10) : '';

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <MarketHeader navigation={navigation} title={t('MARKETPLACE.MY_ENQUIRIES')} />

      <View style={s.tabs}>
        {TABS.map(x => (
          <TouchableOpacity
            key={x.key || 'all'}
            style={[s.tab, tab === x.key && s.tabOn]}
            onPress={() => setTab(x.key)}
            activeOpacity={0.8}>
            <Text style={[s.tabTxt, tab === x.key && s.tabTxtOn]}>
              {t('MARKETPLACE.' + x.tkey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} color={C.oceanMid} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, i) => `${item.id ?? i}_${i}`}
          contentContainerStyle={s.list}
          renderItem={({item}) => {
            const chType = item.lead_type || 'enquiry';
            const icon = CHANNEL_ICON[chType] || 'chatbubble-ellipses';
            const tone = CHANNEL_TONE[chType] || C.oceanMid;

            const meta = (
              <View style={s.metaRow}>
                <View style={[s.chBadge, {backgroundColor: tone}]}>
                  <Ionicons name={icon} size={11} color="#fff" />
                  <Text style={s.chTxt}>
                    {t('MARKETPLACE.LEAD_' + chType.toUpperCase(), {
                      defaultValue: chType,
                    })}
                  </Text>
                </View>
                {!!item.created_at && (
                  <Text style={s.time}>{shortDate(item.created_at)}</Text>
                )}
              </View>
            );

            // Backend contract: available:false → paused/deleted; product may
            // be null when hard-deleted. Guard so we never crash on missing
            // fields; render a tombstone row instead.
            if (item.available === false || !item.product) {
              return (
                <View style={s.wrap}>
                  {meta}
                  <View style={s.gone}>
                    <Ionicons name="close-circle-outline" size={18} color={C.textLight} />
                    <Text style={s.goneTxt}>
                      {item.product?.name || t('MARKETPLACE.LISTING_UNAVAILABLE')}
                    </Text>
                  </View>
                </View>
              );
            }

            return (
              <View style={s.wrap}>
                {meta}
                <ProductCard product={item.product} onPress={openProduct} />
                {!!item.message && (
                  <Text style={s.msg} numberOfLines={2}>
                    "{item.message}"
                  </Text>
                )}
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{height: 15}} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📨</Text>
              <Text style={s.emptyTxt}>{t('MARKETPLACE.NO_ENQUIRIES_SENT')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  tabs: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.cream,
  },
  tab: {paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8},
  tabOn: {backgroundColor: '#fff', borderWidth: 1, borderColor: C.line},
  tabTxt: {fontSize: 11.5, fontWeight: '700', color: C.textLight},
  tabTxtOn: {color: C.oceanMid},
  list: {paddingHorizontal: 15, paddingBottom: 24},
  wrap: {gap: 7},
  metaRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  chBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  chTxt: {color: '#fff', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase'},
  time: {fontSize: 10.5, color: C.textLight, fontWeight: '600'},
  msg: {
    fontSize: 11.5,
    color: C.textMid,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  gone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    padding: 14,
    opacity: 0.7,
  },
  goneTxt: {fontSize: 12, fontWeight: '600', color: C.textLight, flex: 1},
  empty: {alignItems: 'center', paddingTop: 70},
  emptyIcon: {fontSize: 40, marginBottom: 12},
  emptyTxt: {fontSize: 14, fontWeight: '700', color: C.textLight, textAlign: 'center', paddingHorizontal: 30},
});

export default MyEnquiriesScreen;
