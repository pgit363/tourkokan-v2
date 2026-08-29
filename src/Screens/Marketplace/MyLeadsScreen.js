/** Sell · Leads — myLeads, filterable by channel. */
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
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import MarketHeader from '../../Components/Marketplace/MarketHeader';
import {myLeads} from '../../Services/Api/MarketplaceServices';

const ICON = {
  call: {name: 'call', bg: C.oceanMid},
  whatsapp: {name: 'logo-whatsapp', bg: C.wa},
  directions: {name: 'navigate', bg: C.sandMid},
  enquiry: {name: 'chatbubble-ellipses', bg: C.forestMid},
};
const TABS = [
  {key: '', tkey: 'ALL'},
  {key: 'call', tkey: 'LEAD_CALL'},
  {key: 'whatsapp', tkey: 'LEAD_WHATSAPP'},
  {key: 'directions', tkey: 'LEAD_DIRECTIONS'},
];

const MyLeadsScreen = ({navigation}) => {
  useMarketBack(navigation);
  const {t} = useTranslation();
  const [tab, setTab] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const leadLabel = lt =>
    t('MARKETPLACE.LEAD_' + String(lt || 'enquiry').toUpperCase(), {
      defaultValue: lt || 'enquiry',
    });

  const load = useCallback(
    async lead_type => {
      setLoading(true);
      const res = await myLeads({lead_type: lead_type || undefined, page: 1}, navigation);
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

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <MarketHeader navigation={navigation} title={t('MARKETPLACE.ENQUIRIES')} />
      <View style={s.tabs}>
        {TABS.map(x => (
          <TouchableOpacity key={x.key || 'all'} style={[s.tab, tab === x.key && s.tabOn]} onPress={() => setTab(x.key)}>
            <Text style={[s.tabTxt, tab === x.key && s.tabTxtOn]}>{t('MARKETPLACE.' + x.tkey)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} color={C.oceanMid} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(l, i) => `${l.id}_${i}`}
          contentContainerStyle={s.list}
          renderItem={({item}) => {
            const ic = ICON[item.lead_type] || ICON.enquiry;
            return (
              <View style={s.row}>
                <View style={[s.ic, {backgroundColor: ic.bg}]}>
                  <Ionicons name={ic.name} size={15} color="#fff" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.type}>
                    {leadLabel(item.lead_type)}
                    {item.message ? ` · "${item.message}"` : ''}
                  </Text>
                  <Text style={s.muted} numberOfLines={1}>{item.product?.name || item.product_name || ''}</Text>
                </View>
                <Text style={s.time}>{item.created_at ? String(item.created_at).slice(5, 10) : ''}</Text>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{height: 1, backgroundColor: C.line}} />}
          ListEmptyComponent={<View style={s.empty}><Text style={s.emptyIcon}>💬</Text><Text style={s.emptyTxt}>{t('MARKETPLACE.NO_ENQUIRIES')}</Text></View>}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  tabs: {flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingVertical: 10},
  tab: {paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8},
  tabOn: {backgroundColor: '#fff', borderWidth: 1, borderColor: C.line},
  tabTxt: {fontSize: 11.5, fontWeight: '700', color: C.textLight},
  tabTxtOn: {color: C.oceanMid},
  list: {paddingHorizontal: 15},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10},
  ic: {width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center'},
  type: {fontSize: 11.5, fontWeight: '700', color: C.textDark},
  muted: {fontSize: 10, color: C.textLight, marginTop: 1},
  time: {fontSize: 10, color: C.textLight},
  empty: {alignItems: 'center', paddingTop: 70},
  emptyIcon: {fontSize: 40, marginBottom: 12},
  emptyTxt: {fontSize: 14, fontWeight: '700', color: C.textLight},
});

export default MyLeadsScreen;
