/** Sell · Plan & limits — mySubscription (usage) + listPlans. limit:null = Unlimited. */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import MarketHeader from '../../Components/Marketplace/MarketHeader';
import {mySubscription, listPlans} from '../../Services/Api/MarketplaceServices';

// Plans page on the website — plans are admin-assigned; the app links out so
// vendors can read details / start the switch conversation.
const PLANS_URL = 'https://tourkokan.com/subscription';
const openPlans = () => Linking.openURL(PLANS_URL).catch(() => {});

const UsageBar = ({label, use}) => {
  const {t} = useTranslation();
  const unlimited = use?.limit == null;
  const pct = unlimited ? 1 : Math.min(1, (use?.used || 0) / (use?.limit || 1));
  return (
    <View style={s.usage}>
      <View style={s.usageRow}>
        <Text style={s.usageLabel}>{label}</Text>
        <Text style={s.usageVal}>
          {unlimited
            ? t('MARKETPLACE.UNLIMITED')
            : t('MARKETPLACE.USAGE_OF', {used: use?.used ?? 0, limit: use?.limit})}
        </Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, {width: `${pct * 100}%`, opacity: unlimited ? 0.25 : 1}]} />
      </View>
    </View>
  );
};

const SubscriptionScreen = ({navigation}) => {
  useMarketBack(navigation);
  const {t} = useTranslation();
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([mySubscription(navigation), listPlans(navigation)]);
      if (a?.data?.success) setSub(a.data.data);
      if (b?.data?.success) setPlans(b.data.data?.data ?? b.data.data ?? []);
      setLoading(false);
    })();
  }, [navigation]);

  const usage = sub?.usage || {};
  const planCode = sub?.plan?.code;

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <MarketHeader navigation={navigation} title={t('MARKETPLACE.PLAN_LIMITS')} />

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} color={C.oceanMid} />
      ) : (
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.sLabel}>{t('MARKETPLACE.YOUR_USAGE')}</Text>
          {usage.max_sites && <UsageBar label={t('MARKETPLACE.BUSINESSES')} use={usage.max_sites} />}
          {usage.max_products && <UsageBar label={t('MARKETPLACE.PRODUCTS')} use={usage.max_products} />}
          {Object.keys(usage)
            .filter(k => k !== 'max_sites' && k !== 'max_products')
            .map(k => (
              <UsageBar key={k} label={k.replace(/^max_/, '').replace(/_/g, ' ')} use={usage[k]} />
            ))}

          <Text style={s.sLabel}>{t('MARKETPLACE.PLANS')}</Text>
          {plans.map(pl => {
            const current = pl.code === planCode;
            return (
              <View key={pl.code} style={[s.plan, current && s.planCur]}>
                <View style={s.planTop}>
                  <Text style={s.planName}>{pl.name}</Text>
                  <Text style={s.planPrice}>
                    ₹{Number(pl.price || 0).toLocaleString('en-IN')}
                    {pl.billing_period && pl.billing_period !== 'free' ? (
                      <Text style={s.per}>/{pl.billing_period}</Text>
                    ) : null}
                  </Text>
                </View>
                {!!pl.description && <Text style={s.planDesc}>{pl.description}</Text>}
                {current ? (
                  <Text style={s.currentTag}>{t('MARKETPLACE.CURRENT_PLAN')}</Text>
                ) : (
                  <TouchableOpacity
                    style={s.upgradeBtn}
                    activeOpacity={0.85}
                    onPress={openPlans}>
                    <Ionicons name="open-outline" size={15} color={C.oceanMid} />
                    <Text style={s.upgradeTxt}>{t('MARKETPLACE.UPGRADE_ON_WEB')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <Text style={s.note}>{t('MARKETPLACE.PLAN_NOTE')}</Text>
          <TouchableOpacity
            style={s.webLink}
            activeOpacity={0.85}
            onPress={openPlans}>
            <Ionicons name="globe-outline" size={14} color={C.oceanMid} />
            <Text style={s.webLinkTxt}>{t('MARKETPLACE.VIEW_PLANS')}</Text>
            <Ionicons name="open-outline" size={13} color={C.oceanMid} />
          </TouchableOpacity>
          <View style={{height: 20}} />
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  body: {padding: 15},
  sLabel: {fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: C.sandMid, fontWeight: '800', marginTop: 6, marginBottom: 10},
  usage: {backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, marginBottom: 9},
  usageRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7},
  usageLabel: {fontSize: 12, fontWeight: '700', color: C.textDark, textTransform: 'capitalize'},
  usageVal: {fontSize: 12, fontWeight: '700', color: C.textMid},
  track: {height: 8, borderRadius: 4, backgroundColor: C.cream, overflow: 'hidden'},
  fill: {height: '100%', borderRadius: 4, backgroundColor: C.oceanMid},
  plan: {borderWidth: 1, borderColor: C.line, borderRadius: 13, padding: 13, marginBottom: 9, backgroundColor: '#fff'},
  planCur: {borderColor: C.oceanMid, backgroundColor: 'rgba(27,107,123,0.05)'},
  planTop: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between'},
  planName: {fontSize: 14, fontWeight: '800', color: C.textDark},
  planPrice: {fontSize: 14, fontWeight: '800', color: C.oceanMid},
  per: {fontSize: 10, color: C.textLight},
  planDesc: {fontSize: 11.5, color: C.textMid, marginTop: 6, lineHeight: 17},
  currentTag: {fontSize: 10.5, fontWeight: '800', color: C.oceanMid, marginTop: 7},
  upgradeBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, borderColor: C.oceanMid, backgroundColor: 'rgba(27,107,123,0.06)'},
  upgradeTxt: {fontSize: 11.5, fontWeight: '800', color: C.oceanMid},
  webLink: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff'},
  webLinkTxt: {fontSize: 12.5, fontWeight: '700', color: C.oceanMid},
  note: {fontSize: 11, color: C.textLight, lineHeight: 16, marginTop: 6, fontStyle: 'italic'},
});

export default SubscriptionScreen;
