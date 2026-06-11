import React, {useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import STRING from '../Services/Constants/STRINGS';
import PrivacyPolicyContent from '../Components/Common/PrivacyPolicyContent';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  cream: '#FAF7F0',
  white: '#FFFFFF',
};

// ─── PrivacyPolicyScreen ───────────────────────────────────────────────────────

const PrivacyPolicyScreen = ({navigation}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          navigation.navigate(STRING.SCREEN.SETTINGS);
          return true;
        },
      );
      return () => backHandler.remove();
    }, [navigation]),
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate(STRING.SCREEN.SETTINGS)}
          activeOpacity={0.8}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="chevron-back" size={18} color={C.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('PRIVACY_POLICY_SCREEN.TITLE')}</Text>
      </View>
      <View style={styles.headerCurve} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <PrivacyPolicyContent />
      </ScrollView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},
  flex: {flex: 1},

  header: {
    backgroundColor: C.oceanDeep,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },
  headerCurve: {
    height: 36,
    backgroundColor: C.cream,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
    marginTop: -36,
    zIndex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },
});

export default PrivacyPolicyScreen;
