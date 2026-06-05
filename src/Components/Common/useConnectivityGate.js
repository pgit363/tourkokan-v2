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
import Popup from './Popup';

// Matches the app's existing mode storage key (STRING.STORAGE.MODE === 'mode').
const MODE_STORAGE_KEY = 'mode';

export const useConnectivityGate = () => {
  const {t} = useTranslation();
  const [gateVisible, setGateVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  // The action to run once the user is confirmed online.
  const pendingRef = useRef(null);

  /**
   * Runs `onProceed` only when the device is connected AND the app is in online
   * mode. Otherwise shows the appropriate popup. Returns true if it proceeded.
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

      // 1. connected + online → go.
      if (isConnected && storedMode) {
        onProceed?.();
        return true;
      }

      // 2. connected + offline mode → offer to go online.
      if (isConnected && !storedMode) {
        pendingRef.current = onProceed || null;
        setGateVisible(true);
        return false;
      }

      // 3 & 4. no internet → inform (can't go online without a connection).
      setInfoMessage(
        storedMode
          ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE')
          : t('ALERT.NETWORK'),
      );
      setInfoVisible(true);
      return false;
    },
    [t],
  );

  // RoutesOfflineGate "Go Online" → persist + Redux, then run the pending action.
  const handleModeChange = useCallback(async newMode => {
    try {
      await AsyncStorage.setItem(MODE_STORAGE_KEY, JSON.stringify(newMode));
    } catch {}
    store.dispatch(setModeAction(newMode));
    setGateVisible(false);
    if (newMode) {
      const cb = pendingRef.current;
      pendingRef.current = null;
      cb?.();
    }
  }, []);

  const handleGateDismiss = useCallback(() => {
    pendingRef.current = null;
    setGateVisible(false);
  }, []);

  const modal = (
    <>
      <RoutesOfflineGate
        visible={gateVisible}
        onDismiss={handleGateDismiss}
        onModeChange={handleModeChange}
      />
      <Popup
        message={infoMessage}
        visible={infoVisible}
        onPress={() => setInfoVisible(false)}
      />
    </>
  );

  return {modal, ensureOnline};
};

export default useConnectivityGate;
