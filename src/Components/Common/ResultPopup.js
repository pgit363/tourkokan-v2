/**
 * ResultPopup — Reusable success / error result modal.
 *
 * Props:
 *   visible  boolean  — show/hide
 *   type     'success' | 'error'  — controls icon & accent color
 *   message  string   — body text shown below the title
 *   onClose  function — called when user taps OK
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';

const ResultPopup = ({visible, type = 'success', message, onClose}) => {
  const isSuccess = type === 'success';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Icon */}
          <View
            style={[
              styles.iconWrap,
              isSuccess ? styles.iconBgSuccess : styles.iconBgError,
            ]}>
            <Text style={styles.iconText}>{isSuccess ? '✅' : '❌'}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isSuccess ? 'Query Submitted!' : 'Something went wrong'}
          </Text>

          {/* Message */}
          {!!message && (
            <Text style={styles.message}>{message}</Text>
          )}

          {/* OK Button */}
          <TouchableOpacity
            style={[styles.okBtn, isSuccess ? styles.okBtnSuccess : styles.okBtnError]}
            onPress={onClose}
            activeOpacity={0.85}>
            <Text style={styles.okBtnText}>OK</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconBgSuccess: {
    backgroundColor: '#D1FAE5',
  },
  iconBgError: {
    backgroundColor: '#FEE2E2',
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  okBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 8,
  },
  okBtnSuccess: {
    backgroundColor: '#1B6B7B',
  },
  okBtnError: {
    backgroundColor: '#DC2626',
  },
  okBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default ResultPopup;
