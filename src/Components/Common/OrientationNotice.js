import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textMid: '#44403C',
};

// ─── OrientationNotice ─────────────────────────────────────────────────────────
// The app is designed portrait-first. When the device rotates to landscape this
// overlay asks the user to rotate back; it disappears automatically the moment
// the device is portrait again. useWindowDimensions updates live on rotation,
// unlike the module-load snapshot in Services/Constants/DIMENSIONS.

const OrientationNotice = () => {
  const {width, height} = useWindowDimensions();
  const {t} = useTranslation();

  if (height >= width) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={s.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={34} color={C.white} />
          </View>
          <Text style={s.title}>{t('ORIENTATION_NOTICE.TITLE')}</Text>
          <Text style={s.message}>{t('ORIENTATION_NOTICE.MESSAGE')}</Text>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13,61,74,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: C.cream,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 26,
    alignItems: 'center',
    maxWidth: 360,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.oceanDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: C.oceanDeep,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 13.5,
    color: C.textMid,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default OrientationNotice;
