/** Sell · Listing analytics — productAnalytics {id}: KPIs + daily series. */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useTranslation} from 'react-i18next';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import MarketHeader from '../../Components/Marketplace/MarketHeader';
import {productAnalytics} from '../../Services/Api/MarketplaceServices';

const ProductAnalyticsScreen = ({navigation, route}) => {
  useMarketBack(navigation);
  const {t} = useTranslation();
  const id = route.params?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await productAnalytics(id, {}, navigation);
      if (res?.data?.success) setData(res.data.data);
      setLoading(false);
    })();
  }, [id, navigation]);

  // Backend confirmed: product.{name,views_count,leads_count} + conversion_rate + leads_by_type + daily[]
  const p = data?.product || {};
  const series = data?.daily || data?.series || [];
  const maxViews = Math.max(1, ...series.map(d => d.views ?? d.count ?? 0));
  const leadsByType = data?.leads_by_type || {};
  const title = p.name || data?.name || t('MARKETPLACE.ANALYTICS');
  const views = p.views_count ?? data?.totals?.views ?? data?.views_count ?? 0;
  const leads = p.leads_count ?? data?.totals?.leads ?? data?.leads_count ?? 0;

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <MarketHeader navigation={navigation} title={title} />

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} color={C.oceanMid} />
      ) : (
        <ScrollView contentContainerStyle={s.body}>
          <View style={s.kpis}>
            <View style={s.kpi}><Text style={s.kpiVal}>{views}</Text><Text style={s.kpiLab}>{t('MARKETPLACE.VIEWS')}</Text></View>
            <View style={s.kpi}><Text style={[s.kpiVal, {color: C.forestMid}]}>{leads}</Text><Text style={s.kpiLab}>{t('MARKETPLACE.LEADS')}</Text></View>
            <View style={s.kpi}><Text style={s.kpiVal}>{data?.conversion_rate != null ? `${Number(data.conversion_rate).toFixed(1)}%` : '—'}</Text><Text style={s.kpiLab}>{t('MARKETPLACE.CONV')}</Text></View>
          </View>

          {series.length > 0 && (
            <>
              <Text style={s.sLabel}>{t('MARKETPLACE.VIEWS_PER_DAY')}</Text>
              <View style={s.bars}>
                {series.map((d, i) => (
                  <View key={i} style={[s.bar, {height: `${((d.views || d.count || 0) / maxViews) * 100}%`}]} />
                ))}
              </View>
            </>
          )}

          {Object.keys(leadsByType).length > 0 && (
            <>
              <Text style={s.sLabel}>{t('MARKETPLACE.LEADS_BY_CHANNEL')}</Text>
              {Object.keys(leadsByType).map(k => {
                const total = Math.max(1, ...Object.values(leadsByType).map(Number));
                return (
                  <View key={k} style={s.usage}>
                    <View style={s.usageRow}>
                      <Text style={s.usageLabel}>{k}</Text>
                      <Text style={s.usageVal}>{leadsByType[k]}</Text>
                    </View>
                    <View style={s.track}>
                      <View style={[s.fill, {width: `${(Number(leadsByType[k]) / total) * 100}%`}]} />
                    </View>
                  </View>
                );
              })}
            </>
          )}
          <View style={{height: 20}} />
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  body: {padding: 15},
  kpis: {flexDirection: 'row', gap: 8},
  kpi: {flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10},
  kpiVal: {fontSize: 16, fontWeight: '800', color: C.textDark},
  kpiLab: {fontSize: 9, color: C.textLight, textTransform: 'uppercase', marginTop: 1},
  sLabel: {fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: C.sandMid, fontWeight: '800', marginTop: 18, marginBottom: 10},
  bars: {flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10},
  bar: {flex: 1, backgroundColor: C.oceanMid, borderRadius: 4, minHeight: 5},
  usage: {backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, marginBottom: 9},
  usageRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7},
  usageLabel: {fontSize: 12, fontWeight: '700', color: C.textDark, textTransform: 'capitalize'},
  usageVal: {fontSize: 12, fontWeight: '700', color: C.textMid},
  track: {height: 8, borderRadius: 4, backgroundColor: C.cream, overflow: 'hidden'},
  fill: {height: '100%', borderRadius: 4, backgroundColor: C.oceanMid},
});

export default ProductAnalyticsScreen;
