/**
 * useConnectivityGate
 *
 * Reusable connectivity/mode guard for any data-fetch or pull-to-refresh action.
 * See docs/offline-mode-connectivity-guard.md for the full feature spec.
 *
 * Behaviour (4 combinations of internet × app mode):
 *   1. connected + online mode   → runs the action immediately.
 *   2. connected + offline mode  → shows the RoutesOfflineGate popup with a
 *                                  "Go Online" button; tapping it switches the
 *                                  app to online mode and then runs the action.
 *   3. no internet + online mode → informational popup ("check your network").
 *   4. no internet + offline mode→ informational popup (generic network).
 *
 * Usage:
 *   const { modal, ensureOnline } = useConnectivityGate();
 *   // render {modal} once in the screen's JSX, then:
 *   const onRefresh = () => ensureOnline(async () => {
 *     setRefreshing(true);
 *     await fetchData();
 *     setRefreshing(false);
 *   });
 */

import React, {useCallback, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import store from '../../../Store';
import {setMode as setModeAction} from '../../Reducers/CommonActions';
import RoutesOfflineGate from './RoutesOfflineGate';

// Matches the app's existing mode storage key (STRING.STORAGE.MODE === 'mode').
const MODE_STORAGE_KEY = 'mode';

export const useConnectivityGate = () => {
  const {t} = useTranslation();
  // Single popup, condition-aware. gate = {visible, title, message, showGoOnline}
  const [gate, setGate] = useState({
    visible: false,
    title: '',
    message: '',
    showGoOnline: true,
  });
  // The action to run once the user is confirmed online.
  const pendingRef = useRef(null);

  /**
   * Runs `onProceed` only when the device is connected AND the app is in online
   * mode. Otherwise shows the single connectivity popup with the right message
   * for the current condition. Returns true if it proceeded.
   */
  const ensureOnline = useCallback(
    async onProceed => {
      let storedMode = true;
      try {
        const raw = await AsyncStorage.getItem(MODE_STORAGE_KEY);
        storedMode = raw !== null ? JSON.parse(raw) : true;
      } catch {}

      const net = await NetInfo.fetch();
      const isConnected = !!net.isConnected;

      // 1. connected + online → proceed.
      if (isConnected && storedMode) {
        onProceed?.();
        return true;
      }

      pendingRef.current = onProceed || null;

      if (isConnected && !storedMode) {
        // 2. offline mode but internet is available → offer "Go Online".
        setGate({
          visible: true,
          title: t('BUTTON.OFFLINE_MODE'),
          message: t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE'),
          showGoOnline: true,
        });
      } else if (!isConnected && storedMode) {
        // 3. online mode but no internet → going online won't help; just inform.
        setGate({
          visible: true,
          title: t('NETWORK'),
          message: t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE'),
          showGoOnline: false,
        });
      } else {
        // 4. offline mode + no internet.
        setGate({
          visible: true,
          title: t('NETWORK'),
          message: t('ALERT.NETWORK'),
          showGoOnline: false,
        });
      }
      return false;
    },
    [t],
  );

  // "Go Online" → persist + Redux, then run the pending action.
  const handleModeChange = useCallback(async newMode => {
    try {
      await AsyncStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(newMode));
    } catch {}
    store.dispatch(setModeAction(newMode));
    setGate(g => ({...g, visible: false}));
    if (newMode) {
      const cb = pendingRef.current;
      pendingRef.current = null;
      cb?.();
    }
  }, []);

  const handleDismiss = useCallback(() => {
    pendingRef.current = null;
    setGate(g => ({...g, visible: false}));
  }, []);

  const modal = (
    <RoutesOfflineGate
      visible={gate.visible}
      title={gate.title}
      message={gate.message}
      showGoOnline={gate.showGoOnline}
      onDismiss={handleDismiss}
      onModeChange={handleModeChange}
    />
  );

  return {modal, ensureOnline};
};

export default useConnectivityGate;
