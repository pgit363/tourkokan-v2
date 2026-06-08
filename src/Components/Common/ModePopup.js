/**
 * ModePopup — kept for backward compatibility, now a thin adapter over the
 * single app-wide connectivity popup (RoutesOfflineGate). This guarantees every
 * "switch to online" popup looks and behaves identically.
 *
 * Props (unchanged):
 *   visible      boolean   — show/hide
 *   currentMode  boolean   — true = online, false = offline
 *   onClose      function  — dismissed without changing mode
 *   onModeChange function  — (newMode:boolean) => void, tapped a mode action
 */
import React from 'react';
import {useTranslation} from 'react-i18next';
import RoutesOfflineGate from './RoutesOfflineGate';

const ModePopup = ({visible, currentMode, onClose, onModeChange}) => {
  const {t} = useTranslation();
  const isOffline = !currentMode;

  return (
    <RoutesOfflineGate
      visible={visible}
      title={isOffline ? t('BUTTON.OFFLINE_MODE') : t('BUTTON.ONLINE_MODE')}
      message={
        isOffline
          ? t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE')
          : t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE')
      }
      showGoOnline={isOffline}
      onDismiss={onClose}
      onModeChange={onModeChange}
    />
  );
};

export default ModePopup;
