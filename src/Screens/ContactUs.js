import React, {useEffect, useState, useRef} from 'react';
import {
  BackHandler,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {backPage} from '../Services/CommonMethods';
import {comnPost, getFromStorage} from '../Services/Api/CommonServices';
import ResultPopup from '../Components/Common/ResultPopup';
import {setLoader} from '../Reducers/CommonActions';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import STRING from '../Services/Constants/STRINGS';
import NetInfo from '@react-native-community/netinfo';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {scaleFontSizes} from '../Services/responsive';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  sandMid: '#C4972A',
  cream: '#EDE8DE',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  white: '#FFFFFF',
  border: 'rgba(0,0,0,0.1)',
  disabledBg: '#F3F4F6',
};

// ─── Static TourKokan support info (built inside component for i18n) ─────────

// ─── Component ────────────────────────────────────────────────────────────────

const ContactUs = ({
  navigation,
  step,
  setStep,
  route_id,
  onQuerySubmitted,
  ...props
}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const contactInfo = [
    {icon: '📧', label: t('CONTACT_US_SCREEN.EMAIL'), value: 'support@tourkokan.com'},
    {icon: '📞', label: t('CONTACT_US_SCREEN.PHONE'), value: '+91 8888095747'},
    {icon: '📍', label: t('CONTACT_US_SCREEN.ADDRESS'), value: 'Sindhudurg, Maharashtra, India'},
  ];

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({email: '', phone: '', message: ''});

  // Popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState('success'); // 'success' | 'error'
  const [popupMessage, setPopupMessage] = useState('');

  const isMounted = useRef(true);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      STRING.EVENT.HARDWARE_BACK_PRESS,
      () => {
        goBackStep();
        return true;
      },
    );

    const init = async () => {
      const userEmail = await AsyncStorage.getItem(t('STORAGE.USER_EMAIL'));
      if (isMounted.current && userEmail) setEmail(userEmail);

      const profileData = await getFromStorage(t('STORAGE.PROFILE_RESPONSE'));
      if (isMounted.current && profileData) {
        const profile = JSON.parse(profileData);
        if (profile.mobile) setPhone(profile.mobile);
      }
    };

    init();

    return () => {
      isMounted.current = false;
      backHandler.remove();
    };
  }, []);

  const goBackStep = () => {
    if (step == 0 || !setStep) {
      backPage(navigation);
    } else {
      setStep(0);
    }
  };

  const showPopup = (type, msg) => {
    setPopupType(type);
    setPopupMessage(msg);
    setPopupVisible(true);
  };

  const handlePopupClose = () => {
    setPopupVisible(false);
    if (popupType === 'success') {
      setEmail('');
      setPhone('');
      setMessage('');
      setErrors({email: '', phone: '', message: ''});
      if (typeof onQuerySubmitted === 'function') {
        onQuerySubmitted();
      } else if (typeof setStep === 'function') {
        setStep(0);
      }
    }
  };

  const validate = () => {
    const errs = {email: '', phone: '', message: ''};
    let valid = true;

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      errs.email = t('CONTACT_US_SCREEN.ERR_EMAIL_REQUIRED');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errs.email = t('CONTACT_US_SCREEN.ERR_EMAIL_INVALID');
      valid = false;
    }

    const phoneTrimmed = phone.trim().replace(/[\s\-()]/g, '');
    if (phoneTrimmed) {
      const digits = phoneTrimmed.replace(/^\+91/, '');
      if (!/^[6-9]\d{9}$/.test(digits)) {
        errs.phone = t('CONTACT_US_SCREEN.ERR_PHONE_INVALID');
        valid = false;
      }
    }

    const msgTrimmed = message.trim();
    if (!msgTrimmed) {
      errs.message = t('CONTACT_US_SCREEN.ERR_MESSAGE_REQUIRED');
      valid = false;
    } else if (msgTrimmed.length < 10) {
      errs.message = t('CONTACT_US_SCREEN.ERR_MESSAGE_SHORT');
      valid = false;
    }

    setErrors(errs);
    return valid;
  };

  const clearFieldError = field => {
    if (errors[field]) setErrors(prev => ({...prev, [field]: ''}));
  };

  const submit = async () => {
    if (!validate()) return;

    const mode = JSON.parse(await getFromStorage(STRING.STORAGE.MODE));
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;

    if (
      (isConnected && !mode) ||
      (!isConnected && !mode) ||
      (!isConnected && mode)
    ) {
      showPopup(
        'error',
        !isConnected && !mode
          ? t('ALERT.NETWORK')
          : !isConnected && mode
          ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE')
          : t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE'),
      );
      return;
    }

    setSubmitting(true);

    const data = {
      user_id: await AsyncStorage.getItem(t('STORAGE.USER_ID')),
      name: await AsyncStorage.getItem(t('STORAGE.USER_NAME')),
      email: email.trim(),
      phone: phone.trim(),
      message: message.trim(),
      route_id,
    };

    const res = await comnPost('v2/addQuery', data);
    if (!isMounted.current) return;
    setSubmitting(false);

    const resData = res?.data ?? res?.response?.data;
    if (resData?.success) {
      setPhone('');
      setMessage('');
      const msg = resData.message;
      showPopup('success', typeof msg === 'string' ? msg : 'Your query has been submitted successfully.');
    } else {
      const msg = resData?.message;
      const displayMsg = typeof msg === 'string'
        ? msg
        : typeof msg === 'object' && msg !== null
          ? Object.values(msg).flat().join('\n')
          : t('ALERT.FAILED');
      showPopup('error', displayMsg);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={goBackStep}
          activeOpacity={0.8}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="chevron-back" size={18} color={C.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('CONTACT_US_SCREEN.TITLE')}</Text>
      </View>
      {/* Curved bottom edge */}
      <View style={styles.headerCurve} />

      {/* ── Body ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, {paddingBottom: insets.bottom + 24}]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Contact info card */}
          <View style={styles.card}>
            {contactInfo.map((item, i) => (
              <View
                key={item.label}
                style={[
                  styles.infoItem,
                  i === contactInfo.length - 1 && styles.infoItemLast,
                ]}>
                <Text style={styles.infoIcon}>{item.icon}</Text>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.formTitle}>{t('CONTACT_US_SCREEN.SEND_MESSAGE')}</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('CONTACT_US_SCREEN.EMAIL')}
                <Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  styles.formInputDisabled,
                  !!errors.email && styles.formInputError,
                ]}
                value={email}
                editable={false}
                placeholderTextColor={C.textLight}
              />
              {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('CONTACT_US_SCREEN.PHONE_OPTIONAL')}</Text>
              <TextInput
                style={[
                  styles.formInput,
                  !!errors.phone && styles.formInputError,
                ]}
                placeholder={t('CONTACT_US_SCREEN.PHONE_PLACEHOLDER')}
                placeholderTextColor={C.textLight}
                value={phone}
                onChangeText={text => {
                  setPhone(text.replace(/[^0-9]/g, ''));
                  clearFieldError('phone');
                }}
                keyboardType="number-pad"
                maxLength={10}
                returnKeyType="next"
              />
              {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('CONTACT_US_SCREEN.MESSAGE_LABEL')}
                <Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                style={[
                  styles.formTextarea,
                  !!errors.message && styles.formInputError,
                ]}
                placeholder={t('CONTACT_US_SCREEN.PLACEHOLDER')}
                placeholderTextColor={C.textLight}
                value={message}
                onChangeText={text => {
                  setMessage(text);
                  clearFieldError('message');
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {!!errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={submit}
              activeOpacity={0.85}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <Text style={styles.submitBtnText}>{t('CONTACT_US_SCREEN.SUBMIT')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ResultPopup
        visible={popupVisible}
        type={popupType}
        message={popupMessage}
        onClose={handlePopupClose}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create(scaleFontSizes({
  screen: {
    flex: 1,
    backgroundColor: C.cream,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    backgroundColor: C.oceanDeep,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },
  headerCurve: {
    height: 36,
    backgroundColor: C.cream,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
    marginTop: -36,
    zIndex: 1,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },

  // Card
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 20,
  },

  // Contact info
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: C.textLight,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textDark,
  },

  // Form
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.textDark,
    marginBottom: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMid,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textDark,
    backgroundColor: C.white,
  },
  formInputDisabled: {
    backgroundColor: C.disabledBg,
    color: C.textLight,
  },
  formInputError: {
    borderColor: '#DC2626',
    borderWidth: 1.5,
  },
  formTextarea: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: C.textDark,
    backgroundColor: C.white,
    minHeight: 110,
  },
  required: {
    color: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 5,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Submit
  submitBtn: {
    backgroundColor: C.sandMid,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.white,
  },
}));

// ─── Redux ────────────────────────────────────────────────────────────────────

const mapStateToProps = state => ({
  access_token: state.commonState.access_token,
});

const mapDispatchToProps = dispatch => ({
  setLoader: data => dispatch(setLoader(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ContactUs);
