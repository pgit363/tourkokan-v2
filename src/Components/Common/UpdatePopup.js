/**
 * UpdatePopup — Custom modal for app update check results.
 *
 * Props:
 *   visible      boolean  — show/hide
 *   type         string   — 'update' | 'uptodate'
 *   storeUrl     string   — play store URL (only used when type='update')
 *   onDismiss    function — called on Cancel / OK / backdrop tap
 *   onUpdate     function — called when user taps Update (opens store)
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {scaleFontSizes} from '../../Services/responsive';

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  sand: '#C4972A',
  textDark: '#1C1917',
  textLight: '#78716C',
  white: '#FFFFFF',
};

const UpdatePopup = ({visible, type, onDismiss, onUpdate}) => {
  const {t} = useTranslation();
  const isUpdate = type === 'update';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={() => {}}>

          {/* Icon */}
          <View style={[styles.iconWrap, isUpdate ? styles.iconBgUpdate : styles.iconBgOk]}>
            {isUpdate ? (
              <MaterialCommunityIcons
                name="arrow-up-circle-outline"
                size={38}
                color={C.sand}
              />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={38}
                color="#2E5C3A"
              />
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isUpdate ? t('UPDATE_POPUP.UPDATE_TITLE') : t('UPDATE_POPUP.UPTODATE_TITLE')}
          </Text>

          {/* Message */}
          <Text style={styles.message}>
            {isUpdate ? t('UPDATE_POPUP.UPDATE_MSG') : t('UPDATE_POPUP.UPTODATE_MSG')}
          </Text>

          {/* Buttons */}
          {isUpdate ? (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.btnCancel}
                activeOpacity={0.8}
                onPress={onDismiss}>
                <Text style={styles.btnCancelText}>{t('UPDATE_POPUP.LATER')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnUpdate}
                activeOpacity={0.8}
                onPress={onUpdate}>
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={17}
                  color={C.white}
                  style={{marginRight: 6}}
                />
                <Text style={styles.btnUpdateText}>{t('UPDATE_POPUP.UPDATE_NOW')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.btnOk}
              activeOpacity={0.8}
              onPress={onDismiss}>
              <Text style={styles.btnOkText}>{t('UPDATE_POPUP.GOT_IT')}</Text>
            </TouchableOpacity>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create(scaleFontSizes({
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
    paddingVertical: 32,
    alignItems: 'center',
  },

  // Icon
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconBgUpdate: {
    backgroundColor: '#FEF3C7',
  },
  iconBgOk: {
    backgroundColor: '#D4EDD9',
  },

  // Text
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  // Update state: two buttons side by side
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textLight,
  },
  btnUpdate: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.oceanDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnUpdateText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.white,
  },

  // Up-to-date state: single full-width button
  btnOk: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.oceanDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOkText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.white,
  },
}));

export default UpdatePopup;
