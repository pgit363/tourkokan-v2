/**
 * BecomeVendorScreen — dedicated "become a vendor" page (Module M1/refactor).
 *
 * Entry point: the Home VendorCTA banner (and any other "list your business"
 * link) navigates here instead of dumping the user on Profile. Self-contained:
 * loads the user's vendor/role-request status, shows the value proposition +
 * promo, and submits the role request via `requestRole`. Approved vendors are
 * offered the dashboard; pending/rejected states are shown inline.
 *
 * Backend already exists (UserRoleRequestController::store). Missing email/mobile
 * comes back as a structured 403 from VendorMiddleware — intercepted here (M2):
 * ContactDetailsSheet collects exactly the missing fields, saves them via
 * updateProfile, then the role request is retried automatically.
 */
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {comnPost, comnGet} from '../../Services/Api/CommonServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import STRING from '../../Services/Constants/STRINGS';
import {isGuestUser, isVendorUser} from '../../Components/Common/GuestGateModal';
import ContactDetailsSheet from '../../Components/Common/ContactDetailsSheet';
import {useConnectivityGate} from '../../Components/Common/useConnectivityGate';

const C = {
  purple: '#7A3E9D',
  purpleDeep: '#5E2E82',
  white: '#FFFFFF',
  ink: '#1C1917',
  soft: '#57534E',
  faint: '#8B8378',
  sand: '#E4B23E',
  ok: '#059669',
  okBg: '#ECFDF5',
  warn: '#D97706',
  warnBg: '#FFFBEB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  cream: '#F7F2E8',
  line: 'rgba(13,61,74,0.10)',
};

const BecomeVendorScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {modal: connectivityModal, ensureOnline} = useConnectivityGate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('none'); // none | pending | rejected | vendor
  const [adminNote, setAdminNote] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [guestVisible, setGuestVisible] = useState(false);
  // M2 — the contact gate: which fields the backend said are missing
  const [contactMissing, setContactMissing] = useState([]);
  const [contactVisible, setContactVisible] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      if (await isVendorUser()) {
        setStatus('vendor');
        setLoading(false);
        return;
      }
      const token = await AsyncStorage.getItem(STRING.STORAGE.ACCESS_TOKEN);
      const res = await comnGet('v2/myRoleRequests', token, null);
      const list = res?.data?.data?.data || [];
      const req = list.find(r => r.role?.code === 'vendor');
      if (req?.status === 'pending') setStatus('pending');
      else if (req?.status === 'rejected') {
        setStatus('rejected');
        setAdminNote(req.admin_note || '');
      } else setStatus('none');
    } catch {
      setStatus('none');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus]),
  );

  const openRequest = async () => {
    if (await isGuestUser()) {
      setGuestVisible(true);
      return;
    }
    ensureOnline(() => {
      setResultMsg('');
      setSheetVisible(true);
    });
  };

  const submit = () =>
    ensureOnline(async () => {
      setSubmitting(true);
      setResultMsg('');
      const res = await comnPost(
        'v2/requestRole',
        {role_code: 'vendor', ...(reason.trim() && {reason: reason.trim()})},
        null,
      );
      const resData = res?.data ?? res?.response?.data;
      setSubmitting(false);
      if (resData?.success) {
        setResultMsg(resData.message || t('VENDOR.REQUEST_SUCCESS'));
        setReason('');
        setTimeout(() => {
          setSheetVisible(false);
          setResultMsg('');
          loadStatus();
        }, 1800);
      } else if (resData?.data?.missing_profile_fields?.length) {
        // M2 — the contact gate. Ask for exactly the missing fields inline
        // instead of parroting the backend's error text.
        setContactMissing(resData.data.missing_profile_fields);
        setContactVisible(true);
      } else {
        const raw = resData?.message;
        setResultMsg(
          typeof raw === 'object'
            ? Object.values(raw).flat().join('\n')
            : raw || t('ALERT.FAILED'),
        );
      }
    });

  const goGuestLogin = async () => {
    setGuestVisible(false);
    await AsyncStorage.clear();
    await AsyncStorage.setItem(STRING.STORAGE.IS_FIRST_TIME, 'false');
    navigation.reset({index: 0, routes: [{name: STRING.SCREEN.EMAIL}]});
  };

  const Perk = ({icon, children}) => (
    <View style={s.perk}>
      <Text style={s.perkIcon}>{icon}</Text>
      <Text style={s.perkText}>{children}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['bottom']} style={s.safe}>
      {/* Hero */}
      <LinearGradient colors={[C.purple, C.purpleDeep]} style={s.hero}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>
        <Text style={s.heroEmoji}>🏪</Text>
        <Text style={s.heroTitle}>{t('VENDOR.INTRO_TITLE')}</Text>
        <Text style={s.heroSub}>{t('VENDOR.INTRO_SUB')}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* Free-3-months band */}
        <View style={s.freeBand}>
          <View style={s.freeBadge}>
            <Text style={s.freeBadgeText}>{t('VENDOR.FREE_BADGE')}</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={s.freeTitle}>{t('VENDOR.FREE_TITLE')}</Text>
            <Text style={s.freeDesc}>{t('VENDOR.FREE_DESC')}</Text>
          </View>
        </View>

        {/* Perks */}
        <View style={s.perks}>
          <Perk icon="✓">{t('VENDOR.PERK_LISTING')}</Perk>
          <Perk icon="✓">{t('VENDOR.PERK_ENQUIRIES')}</Perk>
          <Perk icon="★">{t('VENDOR.PERK_EARLY')}</Perk>
          <Perk icon="🛡️">{t('VENDOR.PERK_VERIFIED')}</Perk>
        </View>

        {/* State-aware action */}
        {loading ? (
          <ActivityIndicator style={{marginTop: 24}} color={C.purple} />
        ) : status === 'vendor' ? (
          <TouchableOpacity
            style={[s.stateCard, {backgroundColor: C.okBg}]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(STRING.SCREEN.VENDOR_DASHBOARD)}>
            <Ionicons name="storefront" size={24} color={C.ok} />
            <View style={s.stateText}>
              <Text style={[s.stateTitle, {color: C.ok}]}>{t('VENDOR.ALREADY_VENDOR')}</Text>
              <Text style={s.stateDesc}>{t('VENDOR.ALREADY_VENDOR_DESC')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.ok} />
          </TouchableOpacity>
        ) : status === 'pending' ? (
          <View style={[s.stateCard, {backgroundColor: C.warnBg}]}>
            <Ionicons name="time-outline" size={22} color={C.warn} />
            <View style={s.stateText}>
              <Text style={[s.stateTitle, {color: C.warn}]}>{t('VENDOR.REQUEST_PENDING_TITLE')}</Text>
              <Text style={s.stateDesc}>{t('VENDOR.REQUEST_PENDING_MSG')}</Text>
            </View>
          </View>
        ) : status === 'rejected' ? (
          <View style={[s.stateCard, {backgroundColor: C.dangerBg, flexDirection: 'column', alignItems: 'stretch'}]}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Ionicons name="close-circle-outline" size={22} color={C.danger} />
              <Text style={[s.stateTitle, {color: C.danger, flex: 1}]}>{t('VENDOR.REQUEST_REJECTED_TITLE')}</Text>
            </View>
            {!!adminNote && <Text style={s.rejNote}>{adminNote}</Text>}
            <TouchableOpacity style={s.reapplyBtn} onPress={openRequest} activeOpacity={0.85}>
              <Text style={s.reapplyText}>{t('VENDOR.REAPPLY')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.primaryBtn} onPress={openRequest} activeOpacity={0.9}>
            <Text style={s.primaryText}>{t('VENDOR.REGISTER_BUSINESS')}</Text>
          </TouchableOpacity>
        )}

        <Text style={s.terms}>{t('VENDOR.TERMS_NOTE')}</Text>
      </ScrollView>

      {/* Request sheet */}
      <Modal visible={sheetVisible} transparent animationType="fade" onRequestClose={() => setSheetVisible(false)}>
        <View style={s.scrim}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{t('VENDOR.REQUEST_TITLE')}</Text>
            <Text style={s.sheetSub}>{t('VENDOR.REASON_LABEL')}</Text>
            <TextInput
              style={s.input}
              value={reason}
              onChangeText={setReason}
              placeholder={t('VENDOR.REASON_PLACEHOLDER')}
              placeholderTextColor={C.faint}
              multiline
            />
            {!!resultMsg && (
              <Text style={[s.resultMsg, resultMsg === t('VENDOR.REQUEST_SUCCESS') && {color: C.ok}]}>
                {resultMsg}
              </Text>
            )}
            <TouchableOpacity
              style={[s.submitBtn, submitting && {opacity: 0.6}]}
              onPress={submit}
              disabled={submitting}
              activeOpacity={0.9}>
              {submitting ? <ActivityIndicator color={C.white} /> : <Text style={s.submitText}>{t('VENDOR.SUBMIT_REQUEST')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSheetVisible(false)} style={s.cancelBtn}>
              <Text style={s.cancelText}>{t('VENDOR.MAYBE_LATER')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Guest gate */}
      <Modal visible={guestVisible} transparent animationType="fade" onRequestClose={() => setGuestVisible(false)}>
        <View style={s.scrim}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>{t('VENDOR.GUEST_TITLE')}</Text>
            <Text style={s.sheetSub}>{t('VENDOR.GUEST_MSG')}</Text>
            <TouchableOpacity style={s.submitBtn} onPress={goGuestLogin} activeOpacity={0.9}>
              <Text style={s.submitText}>{t('VENDOR.GUEST_LOGIN')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGuestVisible(false)} style={s.cancelBtn}>
              <Text style={s.cancelText}>{t('VENDOR.MAYBE_LATER')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* M2 — missing email/mobile fill-in; saving retries the role request */}
      <ContactDetailsSheet
        visible={contactVisible}
        missing={contactMissing}
        onClose={() => setContactVisible(false)}
        onSaved={() => {
          setContactVisible(false);
          submit();
        }}
      />

      {connectivityModal}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.cream},
  hero: {paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 26, paddingHorizontal: 20, alignItems: 'center'},
  back: {position: 'absolute', top: Platform.OS === 'ios' ? 54 : 42, left: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center'},
  heroEmoji: {fontSize: 38, marginTop: 6},
  heroTitle: {fontSize: 22, fontWeight: '800', color: C.white, marginTop: 8, textAlign: 'center'},
  heroSub: {fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center', maxWidth: '86%'},

  body: {padding: 16, paddingBottom: 40},
  freeBand: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 12, marginTop: -14, borderWidth: 1, borderColor: C.line, shadowColor: '#0D3D4A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: {width: 0, height: 6}, elevation: 3},
  freeBadge: {backgroundColor: C.okBg, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6},
  freeBadgeText: {fontSize: 10, fontWeight: '800', color: C.ok, textTransform: 'uppercase', textAlign: 'center'},
  freeTitle: {fontSize: 13.5, fontWeight: '700', color: C.ink},
  freeDesc: {fontSize: 11.5, color: C.soft, marginTop: 1},

  perks: {marginTop: 16},
  perk: {flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7},
  perkIcon: {fontSize: 14, color: C.ok, fontWeight: '800', width: 18},
  perkText: {flex: 1, fontSize: 13, color: C.soft},

  primaryBtn: {backgroundColor: C.purple, borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 18},
  primaryText: {color: C.white, fontSize: 15, fontWeight: '800'},

  stateCard: {flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 13, padding: 14, marginTop: 18},
  stateText: {flex: 1},
  stateTitle: {fontSize: 14, fontWeight: '700'},
  stateDesc: {fontSize: 12, color: C.soft, marginTop: 2},
  rejNote: {fontSize: 12.5, color: C.soft, marginTop: 8, marginLeft: 32},
  reapplyBtn: {backgroundColor: C.danger, borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 12},
  reapplyText: {color: C.white, fontWeight: '700', fontSize: 13},

  terms: {fontSize: 11, color: C.faint, textAlign: 'center', marginTop: 18},

  scrim: {flex: 1, backgroundColor: 'rgba(13,61,74,0.4)', justifyContent: 'flex-end'},
  sheet: {backgroundColor: C.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 30},
  sheetHandle: {width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, alignSelf: 'center', marginBottom: 14},
  sheetTitle: {fontSize: 18, fontWeight: '800', color: C.ink},
  sheetSub: {fontSize: 12.5, color: C.soft, marginTop: 4, marginBottom: 10},
  input: {borderWidth: 1, borderColor: C.line, borderRadius: 11, padding: 12, fontSize: 13, color: C.ink, minHeight: 80, textAlignVertical: 'top', backgroundColor: C.cream},
  resultMsg: {fontSize: 12.5, color: C.danger, marginTop: 10},
  submitBtn: {backgroundColor: C.purple, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14},
  submitText: {color: C.white, fontWeight: '800', fontSize: 14},
  cancelBtn: {alignItems: 'center', paddingVertical: 12, marginTop: 2},
  cancelText: {color: C.soft, fontWeight: '600', fontSize: 13},
});

export default BecomeVendorScreen;
