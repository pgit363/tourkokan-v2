import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';

const {width: SW} = Dimensions.get('window');

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textLight: '#78716C',
  cream: '#FAF7F0',
};

const resolveIcon = message => {
  if (!message) return {name: 'information-circle', color: C.oceanMid};
  const m = message.toLowerCase();
  if (m.includes('internet') || m.includes('network') || m.includes('offline') || m.includes('online'))
    return {name: 'wifi', color: '#f39c12'};
  if (m.includes('error') || m.includes('fail'))
    return {name: 'close-circle', color: '#e74c3c'};
  if (m.includes('success') || m.includes('done'))
    return {name: 'checkmark-circle', color: '#27ae60'};
  return {name: 'information-circle', color: C.oceanMid};
};

const Popup = ({message, visible, onPress, toggleOverlay, Component, noButton}) => {
  const {t} = useTranslation();
  const icon = resolveIcon(message);

  const handleClose = () => {
    if (onPress) onPress();
    if (toggleOverlay) toggleOverlay();
  };

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          {/* Icon circle */}
          <View style={[s.iconCircle, {backgroundColor: `${icon.color}18`}]}>
            <Ionicons name={icon.name} size={38} color={icon.color} />
          </View>

          {/* Message */}
          <Text style={s.message}>{message}</Text>

          {/* Extra content slot */}
          {Component ? <View style={s.componentSlot}>{Component}</View> : null}

          {/* Divider */}
          <View style={s.divider} />

          {/* Button */}
          {!noButton && (
            <TouchableOpacity style={s.btn} onPress={handleClose} activeOpacity={0.85}>
              <Text style={s.btnText}>{t('BUTTON.OK') || 'OK'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    backgroundColor: C.white,
    borderRadius: 24,
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  message: {
    fontSize: 15,
    color: C.textDark,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  componentSlot: {
    width: '100%',
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  btn: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.oceanMid,
    letterSpacing: 0.3,
  },
});

export default Popup;
