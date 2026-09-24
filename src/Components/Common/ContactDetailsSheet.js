/**
 * ContactDetailsSheet — inline fill-in for the vendor contact gate (Module M2).
 *
 * The backend refuses a vendor role request (and every vendor route) until the
 * profile has an email and a WhatsApp mobile — VendorMiddleware returns a 403
 * with `data.missing_profile_fields`. Instead of surfacing that as a raw error,
 * this bottom sheet asks for exactly the missing fields, saves them through
 * `updateProfile`, and hands control back so the caller can retry the request
 * that was blocked.
 *
 * Reusable: anything that hits the same 403 (requestRole, future vendor
 * surfaces) can mount this with the field list from the response.
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {comnPost} from '../../Services/Api/CommonServices';

const C = {
  purple: '#7A3E9D',
  white: '#FFFFFF',
  ink: '#1C1917',
  soft: '#57534E',
  faint: '#8B8378',
  danger: '#DC2626',
  cream: '#F7F2E8',
  line: 'rgba(13,61,74,0.10)',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{10}$/;

const ContactDetailsSheet = ({visible, missing = [], onClose, onSaved}) => {
  const {t} = useTranslation();
  const askEmail = missing.includes('email');
  const askMobile = missing.includes('mobile');

  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // A fresh open starts a fresh form — stale values from a previous attempt
  // (e.g. an email the backend rejected as taken) must not linger.
  useEffect(() => {
    if (visible) {
      setEmail('');
      setMobile('');
      setError('');
    }
  }, [visible]);

  const save = async () => {
    const payload = {};
    if (askEmail) {
      if (!EMAIL_RE.test(email.trim())) {
        setError(t('VENDOR.CONTACT_INVALID_EMAIL'));
        return;
      }
      payload.email = email.trim();
    }
    if (askMobile) {
      if (!MOBILE_RE.test(mobile.trim())) {
        setError(t('VENDOR.CONTACT_INVALID_MOBILE'));
        return;
      }
      payload.mobile = mobile.trim();
    }

    setSaving(true);
    setError('');
    const res = await comnPost('v2/updateProfile', payload);
    setSaving(false);

    if (res?.data?.success) {
      onSaved?.();
      return;
    }

    // updateProfile reports validation problems as {message: {field: [msgs]}}
    // (HTTP 200), network problems as a plain message string.
    const msg = res?.data?.message;
    setError(
      typeof msg === 'object'
        ? Object.values(msg).flat().join('\n')
        : msg || t('ALERT.FAILED'),
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.scrim}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.titleRow}>
            <Ionicons name="person-circle-outline" size={22} color={C.purple} />
            <Text style={s.title}>{t('VENDOR.CONTACT_TITLE')}</Text>
          </View>
          <Text style={s.sub}>{t('VENDOR.CONTACT_DESC')}</Text>

          {askEmail && (
            <>
              <Text style={s.label}>{t('VENDOR.CONTACT_EMAIL_LABEL')}</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('VENDOR.CONTACT_EMAIL_PH')}
                placeholderTextColor={C.faint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}

          {askMobile && (
            <>
              <Text style={s.label}>{t('VENDOR.CONTACT_MOBILE_LABEL')}</Text>
              <TextInput
                style={s.input}
                value={mobile}
                onChangeText={v => setMobile(v.replace(/[^0-9]/g, ''))}
                placeholder={t('VENDOR.CONTACT_MOBILE_PH')}
                placeholderTextColor={C.faint}
                keyboardType="number-pad"
                maxLength={10}
              />
              <Text style={s.hint}>{t('VENDOR.CONTACT_MOBILE_HINT')}</Text>
            </>
          )}

          {!!error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity
            style={[s.saveBtn, saving && {opacity: 0.6}]}
            onPress={save}
            disabled={saving}
            activeOpacity={0.9}>
            {saving ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={s.saveText}>{t('VENDOR.CONTACT_SAVE')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
            <Text style={s.cancelText}>{t('VENDOR.MAYBE_LATER')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  scrim: {flex: 1, backgroundColor: 'rgba(13,61,74,0.4)', justifyContent: 'flex-end'},
  sheet: {backgroundColor: C.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 30},
  handle: {width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, alignSelf: 'center', marginBottom: 14},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  title: {fontSize: 18, fontWeight: '800', color: C.ink},
  sub: {fontSize: 12.5, color: C.soft, marginTop: 4, marginBottom: 8},
  label: {fontSize: 12, fontWeight: '700', color: C.ink, marginTop: 10, marginBottom: 5},
  input: {borderWidth: 1, borderColor: C.line, borderRadius: 11, padding: 12, fontSize: 14, color: C.ink, backgroundColor: C.cream},
  hint: {fontSize: 10.5, color: C.faint, marginTop: 4},
  error: {fontSize: 12.5, color: C.danger, marginTop: 10},
  saveBtn: {backgroundColor: C.purple, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16},
  saveText: {color: C.white, fontWeight: '800', fontSize: 14},
  cancelBtn: {alignItems: 'center', paddingVertical: 12, marginTop: 2},
  cancelText: {color: C.soft, fontWeight: '600', fontSize: 13},
});

export default ContactDetailsSheet;
