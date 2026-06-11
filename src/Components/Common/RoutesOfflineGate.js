/**
 * RoutesOfflineGate
 *
 * Shows a popup when the user opens a routes screen in offline mode.
 * Routes require an internet connection to fetch live data.
 *
 * Usage — hook form (works with or without Redux):
 *   const { modal } = useRoutesOfflineGate({ mode, onModeChange });
 *   // render {modal} anywhere in the component tree
 *
 * Props accepted by the component directly:
 *   visible       boolean
 *   onDismiss     () => void
 *   onModeChange  (newMode: boolean) => void
 */

import React, {useEffect, useState, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import {useTranslation} from 'react-i18next';
import store from '../../../Store';
import {setMode as setModeAction} from '../../Reducers/CommonActions';
import {createLogger} from '../../Services/Logger';

const log = createLogger('RoutesOfflineGate');

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  amber: '#C4972A',
  amberBg: '#FEF3C7',
  greenBg: '#D4EDD9',
  green: '#2E5C3A',
};

// ─── Storage key for mode (matches the app's existing key) ───────────────────

const MODE_STORAGE_KEY = 'mode';

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Single, condition-aware connectivity popup used app-wide.
 *
 * Props:
 *   visible       boolean
 *   onDismiss     () => void
 *   onModeChange  (newMode:boolean) => void   — tapped "Go Online"
 *   title         string?  — defaults to the routes wording
 *   message       string?  — defaults to the routes wording
 *   showGoOnline  boolean  — show the "Go Online" action (only when switching to
 *                            online would help, i.e. internet is available)
 */
const RoutesOfflineGate = ({
  visible,
  onDismiss,
  onModeChange,
  title,
  message,
  showGoOnline = true,
}) => {
  const {t} = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      <Pressable style={s.backdrop} onPress={onDismiss}>
        <Pressable style={s.card} onPress={() => {}}>

          {/* Icon */}
          <View style={[s.iconWrap, {backgroundColor: C.amberBg}]}>
            <Feather name="wifi-off" size={30} color={C.amber} />
          </View>

          {/* Title */}
          <Text style={s.title}>{title || 'Internet Required'}</Text>

          {/* Message */}
          <Text style={s.message}>
            {message ||
              'Bus routes and schedules require an internet connection to load. Switch to Online mode to search and browse live route data.'}
          </Text>

          {/* Actions */}
          <View style={s.btnRow}>
            {showGoOnline && (
              <TouchableOpacity
                style={[s.btn, s.btnOnline]}
                onPress={() => onModeChange(true)}
                activeOpacity={0.85}>
                <Ionicons name="cloud-outline" size={17} color={C.white} style={s.btnIcon} />
                <Text style={[s.btnText, {color: C.white}]}>{t('BUS_ROUTE_SCREEN.CHANGE_MODE')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[s.btn, s.btnOffline]}
              onPress={onDismiss}
              activeOpacity={0.85}>
              <Feather name="wifi-off" size={17} color={C.textLight} style={s.btnIcon} />
              <Text style={[s.btnText, {color: C.textLight}]}>{t('BUTTON.OK')}</Text>
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useRoutesOfflineGate
 *
 * @param {object} options
 * @param {boolean|undefined} options.mode  — Redux mode prop (if screen is connected).
 *                                            If undefined the hook reads from AsyncStorage.
 * @param {function|undefined} options.onModeChange — Redux setMode dispatch (if connected).
 *
 * Returns { modal } — render it once inside the screen's JSX.
 */
export const useRoutesOfflineGate = ({mode: modeProp, onModeChange: onModeChangeProp} = {}) => {
  const [visible, setVisible] = useState(false);
  const [localMode, setLocalMode] = useState(true);

  // On mount: use Redux prop if available, otherwise read from storage
  useEffect(() => {
    const init = async () => {
      let currentMode = modeProp;
      if (currentMode === undefined || currentMode === null) {
        try {
          const raw = await AsyncStorage.getItem(MODE_STORAGE_KEY);
          currentMode = raw !== null ? JSON.parse(raw) : true;
        } catch {
          currentMode = true;
        }
      }
      setLocalMode(currentMode);
      if (!currentMode) setVisible(true);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also react when Redux mode prop changes (e.g., toggled from Settings)
  useEffect(() => {
    if (modeProp !== undefined && modeProp !== null) {
      setLocalMode(modeProp);
      if (!modeProp) setVisible(true);
    }
  }, [modeProp]);

  const handleModeChange = useCallback(async newMode => {
    try {
      await AsyncStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(newMode));
    } catch (e) { log.warn("[caught]", e); }
    // Update Redux store (works for both connected and unconnected screens)
    store.dispatch(setModeAction(newMode));
    // Also call the prop-based setter if the screen passes one
    if (onModeChangeProp) onModeChangeProp(newMode);
    setLocalMode(newMode);
    setVisible(false);
  }, [onModeChangeProp]);

  const handleDismiss = useCallback(() => setVisible(false), []);

  const modal = (
    <RoutesOfflineGate
      visible={visible}
      onDismiss={handleDismiss}
      onModeChange={handleModeChange}
    />
  );

  return {modal};
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    backgroundColor: C.white,
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: C.textMid,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  btnOnline: {
    backgroundColor: C.oceanDeep,
  },
  btnOffline: {
    backgroundColor: '#F3F4F6',
  },
  btnIcon: {
    marginRight: 6,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dismiss: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  dismissText: {
    fontSize: 13,
    color: C.textLight,
    fontWeight: '500',
  },
});

export default RoutesOfflineGate;
