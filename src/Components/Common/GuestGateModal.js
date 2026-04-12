import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import STRING from '../../Services/Constants/STRINGS';

// ─── Async helper ─────────────────────────────────────────────────────────────

export const isGuestUser = async () => {
  try {
    const raw = await AsyncStorage.getItem('IS_GUEST');
    const val = JSON.parse(raw) === true;
    console.log('[isGuestUser] raw =', raw, '| result =', val);
    return val;
  } catch {
    return false;
  }
};

// Keys stored in AsyncStorage to track guest usage counts
export const GUEST_KEYS = {
  ROUTE_SEARCH_COUNT: 'GUEST_ROUTE_SEARCH_COUNT',
  FILTER_COUNT: 'GUEST_FILTER_COUNT',
};

export const getGuestCount = async key => {
  try {
    return parseInt((await AsyncStorage.getItem(key)) || '0', 10);
  } catch {
    return 0;
  }
};

export const incrementGuestCount = async key => {
  const count = await getGuestCount(key);
  await AsyncStorage.setItem(key, String(count + 1));
  return count + 1;
};

// ─── Component ────────────────────────────────────────────────────────────────

const GuestGateModal = ({visible, onClose, onLogin, message}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onClose}>
    <View style={s.backdrop}>
      <View style={s.card}>
        <View style={s.iconWrap}>
          <Text style={s.iconText}>🔒</Text>
        </View>
        <Text style={s.title}>Members Only</Text>
        <Text style={s.message}>
          {message || 'Please register or login to continue.'}
        </Text>
        <TouchableOpacity style={s.loginBtn} onPress={onLogin} activeOpacity={0.85}>
          <Text style={s.loginBtnText}>Login / Register</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={s.cancelBtnText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const useGuestGate = navigation => {
  const [visible, setVisible] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const show = msg => {
    setMessage(msg || '');
    setVisible(true);
  };

  const hide = () => setVisible(false);

  const handleLogin = async () => {
    hide();
    await AsyncStorage.clear();
    navigation.reset({index: 0, routes: [{name: STRING.SCREEN.EMAIL}]});
  };

  const modal = (
    <GuestGateModal
      visible={visible}
      onClose={hide}
      onLogin={handleLogin}
      message={message}
    />
  );

  return {show, hide, modal};
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {fontSize: 34},
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D3D4A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#1B6B7B',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#78716C',
  },
});

export default GuestGateModal;
