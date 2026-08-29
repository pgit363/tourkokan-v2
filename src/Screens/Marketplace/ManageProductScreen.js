/**
 * Sell · Manage listing — getProduct + toggleProductStatus / deleteProduct.
 * Editing an approved product returns it to review (handled by updateProduct).
 */
import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import StatusPill, {statusTone} from '../../Components/Marketplace/StatusPill';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import MarketHeader from '../../Components/Marketplace/MarketHeader';
import {localised} from '../../Services/marketplace';
import {
  getProduct,
  toggleProductStatus,
  deleteProduct,
} from '../../Services/Api/MarketplaceServices';
import {backPage, navigateTo} from '../../Services/CommonMethods';

const ManageProductScreen = ({navigation, route}) => {
  useMarketBack(navigation);
  const {t, i18n} = useTranslation();
  const id = route.params?.id;
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await getProduct(id, navigation);
    if (res?.data?.success) setP(res.data.data);
    setLoading(false);
  }, [id, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isLive = statusTone(p?.status) === 'live';

  const onToggle = async () => {
    const res = await toggleProductStatus(id, navigation);
    if (res?.data?.success) load();
  };

  const onDelete = () =>
    Alert.alert(t('MARKETPLACE.DELETE_TITLE'), t('MARKETPLACE.DELETE_MSG'), [
      {text: t('MARKETPLACE.CANCEL'), style: 'cancel'},
      {
        text: t('MARKETPLACE.DELETE'),
        style: 'destructive',
        onPress: async () => {
          const res = await deleteProduct(id, navigation);
          if (res?.data?.success) backPage(navigation);
        },
      },
    ]);

  if (loading) {
    return (
      <View style={s.center}>
        <SystemBars style="dark" />
        <ActivityIndicator color={C.oceanMid} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <MarketHeader navigation={navigation} title={t('MARKETPLACE.MANAGE_LISTING')} />

      <ScrollView contentContainerStyle={s.body}>
        <View style={s.titleRow}>
          <Text style={s.name}>{localised(p, 'name', i18n.language)}</Text>
          <StatusPill status={p?.status} />
        </View>

        {statusTone(p?.status) === 'rejected' && !!p?.rejection_reason && (
          <View style={s.reject}>
            <Ionicons name="alert-circle" size={15} color="#B23A2E" />
            <Text style={s.rejectTxt}>{p.rejection_reason}</Text>
          </View>
        )}

        {(statusTone(p?.status) === 'live' || statusTone(p?.status) === 'paused') && (
          <View style={s.switchRow}>
            <View>
              <Text style={s.switchTitle}>{isLive ? t('MARKETPLACE.LIVE_VISIBLE') : t('MARKETPLACE.PAUSED')}</Text>
              <Text style={s.muted}>{isLive ? t('MARKETPLACE.LIVE_SUB') : t('MARKETPLACE.PAUSED_SUB')}</Text>
            </View>
            <Switch value={isLive} onValueChange={onToggle} trackColor={{true: C.forestMid, false: '#D6D3D1'}} thumbColor="#fff" />
          </View>
        )}

        <Text style={s.sLabel}>{t('MARKETPLACE.PERFORMANCE')}</Text>
        <View style={s.kpis}>
          <View style={s.kpi}><Text style={s.kpiVal}>{p?.views_count ?? 0}</Text><Text style={s.kpiLab}>{t('MARKETPLACE.VIEWS')}</Text></View>
          <View style={s.kpi}><Text style={s.kpiVal}>{p?.leads_count ?? 0}</Text><Text style={s.kpiLab}>{t('MARKETPLACE.LEADS')}</Text></View>
          <View style={s.kpi}><Text style={s.kpiVal}>₹{Number(p?.base_price || 0).toLocaleString('en-IN')}</Text><Text style={s.kpiLab}>{t('MARKETPLACE.PRICE')}</Text></View>
        </View>

        <View style={s.actionRow}>
          <TouchableOpacity
            style={s.editBtn}
            activeOpacity={0.9}
            onPress={() => navigateTo(navigation, t('SCREEN.ADD_PRODUCT'), {editId: id})}>
            <Ionicons name="create-outline" size={17} color="#fff" />
            <Text style={s.editTxt}>{t('MARKETPLACE.EDIT_LISTING')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.analyticsBtn}
            activeOpacity={0.85}
            onPress={() => navigateTo(navigation, t('SCREEN.PRODUCT_ANALYTICS'), {id})}>
            <Ionicons name="stats-chart-outline" size={16} color={C.oceanMid} />
            <Text style={s.analyticsTxt}>{t('MARKETPLACE.VIEW_ANALYTICS')}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={14} color="#7a5a17" />
          <Text style={s.noteTxt}>{t('MARKETPLACE.EDIT_NOTE')}</Text>
        </View>

        <TouchableOpacity style={s.delRow} onPress={onDelete}>
          <Ionicons name="trash-outline" size={17} color="#B23A2E" />
          <Text style={s.delTxt}>{t('MARKETPLACE.DELETE_LISTING')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream},
  body: {padding: 15},
  titleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  name: {fontSize: 17, fontWeight: '800', color: C.textDark, flex: 1},
  muted: {fontSize: 10.5, color: C.textLight, marginTop: 1},
  reject: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(178,58,46,0.08)', borderRadius: 11, padding: 11, marginTop: 12},
  rejectTxt: {fontSize: 11.5, color: '#B23A2E', fontWeight: '600', flex: 1},
  switchRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(46,125,70,0.3)', borderRadius: 12, padding: 12, marginTop: 14},
  switchTitle: {fontSize: 13, fontWeight: '800', color: C.forestMid},
  sLabel: {fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: C.sandMid, fontWeight: '800', marginTop: 18, marginBottom: 10},
  kpis: {flexDirection: 'row', gap: 8},
  kpi: {flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 10},
  kpiVal: {fontSize: 15, fontWeight: '800', color: C.textDark},
  kpiLab: {fontSize: 9, color: C.textLight, textTransform: 'uppercase', marginTop: 1},
  actionRow: {flexDirection: 'row', gap: 9, marginTop: 18},
  editBtn: {flex: 1.3, height: 46, borderRadius: 12, backgroundColor: C.oceanMid, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7},
  editTxt: {color: '#fff', fontWeight: '800', fontSize: 13.5},
  analyticsBtn: {flex: 1, height: 46, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
  analyticsTxt: {color: C.oceanMid, fontWeight: '800', fontSize: 12.5},
  note: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(196,151,42,0.1)', borderColor: 'rgba(196,151,42,0.3)', borderWidth: 1, borderRadius: 11, padding: 11, marginTop: 16},
  noteTxt: {fontSize: 11, color: '#7a5a17', fontWeight: '600', flex: 1},
  delRow: {flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(178,58,46,0.25)', borderRadius: 12, padding: 13, marginTop: 12},
  delTxt: {fontSize: 13, fontWeight: '800', color: '#B23A2E'},
});

export default ManageProductScreen;
