/**
 * ModePopup — Reusable online/offline mode status popup.
 *
 * Props:
 *   visible      boolean   — show/hide the popup
 *   currentMode  boolean   — true = online mode, false = offline mode
 *   onClose      function  — called when user dismisses without changing mode
 *   onModeChange function  — (newMode: boolean) => void, called when user switches mode
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

const ModePopup = ({visible, currentMode, onClose, onModeChange}) => {
  const isOffline = !currentMode;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Inner Pressable stops backdrop tap from closing when tapping the card */}
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Status icon */}
          <View style={[styles.iconWrap, isOffline ? styles.iconBgOffline : styles.iconBgOnline]}>
            <Feather
              name={isOffline ? 'wifi-off' : 'wifi'}
              size={30}
              color={isOffline ? '#C4972A' : '#2E5C3A'}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isOffline ? 'Offline Mode Active' : 'Online Mode Active'}
          </Text>

          {/* Message */}
          <Text style={styles.message}>
            {isOffline
              ? 'Refresh is disabled in offline mode. Switch to online mode to fetch the latest data.'
              : 'The app is connected and syncing live data.'}
          </Text>

          {/* Mode toggle buttons */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, !isOffline && styles.modeBtnOnlineActive]}
              activeOpacity={0.85}
              onPress={() => onModeChange(true)}>
              <Ionicons
                name="cloud-outline"
                size={17}
                color={!isOffline ? '#fff' : '#78716C'}
                style={{marginRight: 6}}
              />
              <Text style={[styles.modeBtnText, !isOffline && styles.modeBtnTextActive]}>
                Online
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeBtn, isOffline && styles.modeBtnOfflineActive]}
              activeOpacity={0.85}
              onPress={() => onModeChange(false)}>
              <Feather
                name="wifi-off"
                size={17}
                color={isOffline ? '#fff' : '#78716C'}
                style={{marginRight: 6}}
              />
              <Text style={[styles.modeBtnText, isOffline && styles.modeBtnTextActive]}>
                Offline
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dismiss */}
          <TouchableOpacity onPress={onClose} style={styles.dismiss} activeOpacity={0.7}>
            <Text style={styles.dismissText}>Dismiss</Text>
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
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconBgOffline: {
    backgroundColor: '#FEF3C7',
  },
  iconBgOnline: {
    backgroundColor: '#D4EDD9',
  },
  title: {
    fontSize: 18,
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
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  modeBtnOnlineActive: {
    backgroundColor: '#0D3D4A',
  },
  modeBtnOfflineActive: {
    backgroundColor: '#C4972A',
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78716C',
  },
  modeBtnTextActive: {
    color: '#fff',
  },
  dismiss: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  dismissText: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '500',
  },
});

export default ModePopup;
