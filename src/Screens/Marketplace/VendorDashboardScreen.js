/**
 * Sell · Dashboard — myUsageStats + myLeads. Leads are the headline metric.
 */
import React, {useCallback, useState} from 'react';
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
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import {myUsageStats, myLeads, mySites, mySubscription, myProducts} from '../../Services/Api/MarketplaceServices';
import {comnPost} from '../../Services/Api/CommonServices';
import {navigateTo, backPage} from '../../Services/CommonMethods';
import {shadow} from '../../Services/shadow';

const LEAD_ICON = {
  call: {name: 'call', bg: C.oceanMid},
  whatsapp: {name: 'logo-whatsapp', bg: C.wa},
  directions: {name: 'navigate', bg: C.sandMid},
  enquiry: {name: 'chatbubble-ellipses', bg: C.forestMid},
};

const num = n => {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString('en-IN') : '0';
};

const VendorDashboardScreen = ({navigation}) => {
  useMarketBack(navigation);
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  // M6 — the free-period chip; M8 — rejected listings that need the vendor's attention
  const [subInfo, setSubInfo] = useState(null);
  const [rejectedSites, setRejectedSites] = useState(0);
  const [rejectedProducts, setRejectedProducts] = useState(0);

  const load = useCallback(async () => {
    const [st, ld, ms, sb, sub, rp] = await Promise.all([
      myUsageStats({}, navigation),
      myLeads({page: 1}, navigation),
      mySites(navigation),
      comnPost('v2/mySubmissions', {}, navigation),
      mySubscription(navigation),
      myProducts({status: 'rejected'}, navigation),
    ]);
    if (st?.data?.success) setStats(st.data.data);
    if (ld?.data?.success) setLeads(ld.data.data?.data ?? ld.data.data ?? []);
    if (ms?.data?.success) {
      const rows = ms.data.data?.data ?? ms.data.data ?? [];
      setSite(rows.find(x => x.is_primary) || rows[0] || null);
    }
    if (sb?.data?.success) {
      const rows = sb.data.data?.data ?? sb.data.data ?? [];
      setRejectedSites(rows.filter(x => x.submission_status === 'rejected').length);
    }
    if (sub?.data?.success) setSubInfo(sub.data.data?.subscription ?? null);
    if (rp?.data?.success) setRejectedProducts(rp.data.data?.total ?? (rp.data.data?.data ?? []).length);
    setLoading(false);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // myUsageStats nests its values: { leads:{total}, views:{total}, listings:{total}, conversion_rate }
  const leadsTotal = stats?.leads?.total ?? leads.length;
  const views = stats?.views?.total;
  const conversion = stats?.conversion_rate;
  const listings = stats?.listings?.total;
  const convText =
    conversion != null && Number.isFinite(Number(conversion))
      ? `${Number(conversion).toFixed(1)}%`
      : '—';
  const rejectedCount = rejectedSites + rejectedProducts;

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[C.oceanDeep, C.forestMid]}
          style={[s.head, {paddingTop: insets.top + 8}]}>
          <View style={s.headTop}>
            <TouchableOpacity
              onPress={() => backPage(navigation)}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headTitle}>{t('MARKETPLACE.YOUR_BUSINESS')}</Text>
            <View style={{width: 24}} />
          </View>
          {/* M6 — free-period countdown chip */}
          {subInfo?.ends_at != null && (
            <TouchableOpacity
              style={s.planChip}
              activeOpacity={0.85}
              onPress={() => navigateTo(navigation, t('SCREEN.SUBSCRIPTION'))}>
              <Ionicons name="gift-outline" size={13} color="#fff" />
              <Text style={s.planChipTxt}>
                {t('VENDOR.PLAN_FREE_LEFT', {count: subInfo.days_remaining ?? 0})}
              </Text>
              <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </LinearGradient>

        {loading ? (
          <ActivityIndicator style={{marginTop: 40}} color={C.oceanMid} />
        ) : (
          <View style={s.body}>
            {/* M8 — rejected listings surface here, loudly, with the fix path */}
            {rejectedCount > 0 && (
              <TouchableOpacity
                style={s.attention}
                activeOpacity={0.9}
                onPress={() =>
                  navigateTo(
                    navigation,
                    rejectedSites > 0 ? t('SCREEN.MY_SUBMISSIONS') : t('SCREEN.MY_PRODUCTS'),
                  )
                }>
                <Ionicons name="alert-circle" size={22} color="#DC2626" />
                <View style={{flex: 1}}>
                  <Text style={s.attTitle}>{t('VENDOR.ATTENTION_REJECTED', {count: rejectedCount})}</Text>
                  <Text style={s.attSub}>{t('VENDOR.ATTENTION_FIX')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#DC2626" />
              </TouchableOpacity>
            )}

            <View style={s.bizRow}>
              <TouchableOpacity
                style={s.bizAdd}
                activeOpacity={0.9}
                onPress={() =>
                  navigateTo(navigation, t('SCREEN.SUBMIT_PLACE'), {vendorFlow: true})
                }>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={s.bizAddTxt}>
                  {site ? t('MARKETPLACE.ADD_BUSINESS') : t('MARKETPLACE.ADD_FIRST_BUSINESS')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.bizMine}
                activeOpacity={0.85}
                onPress={() => navigateTo(navigation, t('SCREEN.MY_SUBMISSIONS'))}>
                <Ionicons name="business-outline" size={17} color={C.oceanMid} />
                <Text style={s.bizMineTxt}>{t('MARKETPLACE.MY_SITES')}</Text>
              </TouchableOpacity>
            </View>

            <View style={s.headline}>
              <Text style={s.hLab}>{t('MARKETPLACE.LEADS_30D')}</Text>
              <Text style={s.hBig}>{num(leadsTotal)}</Text>
              <Text style={s.hSub}>{t('MARKETPLACE.ENQUIRIES_SENT')}</Text>
            </View>

            <View style={s.kpis}>
              <View style={s.kpi}>
                <Text style={s.kpiVal}>{num(views)}</Text>
                <Text style={s.kpiLab}>{t('MARKETPLACE.VIEWS')}</Text>
              </View>
              <View style={s.kpi}>
                <Text style={s.kpiVal}>{convText}</Text>
                <Text style={s.kpiLab}>{t('MARKETPLACE.CONVERSION')}</Text>
              </View>
              <View style={s.kpi}>
                <Text style={s.kpiVal}>{num(listings)}</Text>
                <Text style={s.kpiLab}>{t('MARKETPLACE.LISTINGS')}</Text>
              </View>
            </View>

            <View style={s.actions}>
              <Action icon="pricetags-outline" label={t('MARKETPLACE.MY_PRODUCTS')} onPress={() => navigateTo(navigation, t('SCREEN.MY_PRODUCTS'))} />
              <Action icon="chatbubbles-outline" label={t('MARKETPLACE.LEADS')} onPress={() => navigateTo(navigation, t('SCREEN.MY_LEADS'))} />
              <Action icon="card-outline" label={t('MARKETPLACE.PLAN')} onPress={() => navigateTo(navigation, t('SCREEN.SUBSCRIPTION'))} />
            </View>

            <Text style={s.sLabel}>{t('MARKETPLACE.RECENT_ENQUIRIES')}</Text>
            {leads.length === 0 ? (
              <Text style={s.muted}>{t('MARKETPLACE.NO_ENQUIRIES')}</Text>
            ) : (
              leads.slice(0, 6).map((l, i) => {
                const ic = LEAD_ICON[l.lead_type] || LEAD_ICON.enquiry;
                return (
                  <View key={l.id || i} style={s.leadRow}>
                    <View style={[s.leadIc, {backgroundColor: ic.bg}]}>
                      <Ionicons name={ic.name} size={15} color="#fff" />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={s.leadType}>
                        {t('MARKETPLACE.LEAD_' + String(l.lead_type || 'enquiry').toUpperCase(), {defaultValue: l.lead_type || 'enquiry'})}
                      </Text>
                      <Text style={s.muted} numberOfLines={1}>
                        {l.product?.name || l.product_name || ''}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
            <View style={{height: 90}} />
          </View>
        )}
      </ScrollView>

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

const Action = ({icon, label, onPress}) => (
  <TouchableOpacity style={s.action} onPress={onPress} activeOpacity={0.85}>
    <Ionicons name={icon} size={20} color={C.oceanMid} />
    <Text style={s.actionTxt}>{label}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  head: {paddingHorizontal: 15, paddingBottom: 15},
  headTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headTitle: {color: '#fff', fontSize: 17, fontWeight: '800'},
  planChip: {flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 10, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6},
  planChipTxt: {color: '#fff', fontSize: 11.5, fontWeight: '700'},
  attention: {flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)', borderRadius: 13, padding: 12, marginBottom: 12},
  attTitle: {fontSize: 13, fontWeight: '800', color: '#DC2626'},
  attSub: {fontSize: 11, color: '#B91C1C', marginTop: 1},
  body: {padding: 15},
  bizRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  bizAdd: {flex: 1.4, height: 46, borderRadius: 12, backgroundColor: C.oceanMid, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7},
  bizAddTxt: {color: '#fff', fontWeight: '800', fontSize: 13.5},
  bizMine: {flex: 1, height: 46, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
  bizMineTxt: {color: C.oceanMid, fontWeight: '800', fontSize: 13},
  headline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 15,
    padding: 14,
    marginBottom: 11,
  },
  hLab: {fontSize: 10, letterSpacing: 0.9, textTransform: 'uppercase', color: C.sandMid, fontWeight: '800'},
  hBig: {fontSize: 30, fontWeight: '800', color: C.textDark, letterSpacing: -0.5},
  hSub: {fontSize: 11, color: C.textLight},
  kpis: {flexDirection: 'row', gap: 8},
  kpi: {flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10},
  kpiVal: {fontSize: 16, fontWeight: '800', color: C.textDark},
  kpiLab: {fontSize: 9, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 1},
  actions: {flexDirection: 'row', gap: 8, marginTop: 12},
  action: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 5,
  },
  actionTxt: {fontSize: 11, fontWeight: '700', color: C.textMid},
  sLabel: {fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: C.sandMid, fontWeight: '800', marginTop: 18, marginBottom: 10},
  muted: {fontSize: 11.5, color: C.textLight},
  leadRow: {flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.line},
  leadIc: {width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center'},
  leadType: {fontSize: 11.5, fontWeight: '700', color: C.textDark},
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
    ...shadow(4),
  },
  fabTxt: {color: '#fff', fontWeight: '800', fontSize: 13.5},
});

export default VendorDashboardScreen;
