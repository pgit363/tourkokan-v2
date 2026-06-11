import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import VersionCheck from 'react-native-version-check';
import {Linking} from 'react-native';
import {setMode, setLoader} from '../Reducers/CommonActions';
import {comnPost, saveToStorage} from '../Services/Api/CommonServices';
import {backPage} from '../Services/CommonMethods';
import STRING from '../Services/Constants/STRINGS';
import UpdatePopup from '../Components/Common/UpdatePopup';
import ModePopup from '../Components/Common/ModePopup';
import {createLogger} from '../Services/Logger';

const log = createLogger('Settings');

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  oceanMid: '#1B6B7B',
  sand: '#C4972A',
};

// ─── Coming Soon Popup ─────────────────────────────────────────────────────────

const ComingSoonPopup = ({visible, onClose, title, message, btnLabel}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onClose}>
    <Pressable style={popStyles.backdrop} onPress={onClose}>
      <Pressable style={popStyles.card} onPress={() => {}}>
        <Text style={popStyles.icon}>🚀</Text>
        <Text style={popStyles.title}>{title}</Text>
        <Text style={popStyles.message}>{message}</Text>
        <TouchableOpacity
          style={popStyles.btn}
          activeOpacity={0.85}
          onPress={onClose}>
          <Text style={popStyles.btnText}>{btnLabel}</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  </Modal>
);

const popStyles = StyleSheet.create({
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
  icon: {fontSize: 48, marginBottom: 12},
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.sand,
    alignItems: 'center',
  },
  btnText: {fontSize: 15, fontWeight: '600', color: C.white},
});

// ─── Settings Screen ───────────────────────────────────────────────────────────

const Settings = ({navigation, mode, setMode: reduxSetMode}) => {
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();

  // modeRef keeps online/offline mode in sync without stale closure issues
  const modeRef = useRef(mode);

  const currentLang = i18n.language === 'mr' ? 'mr' : 'en';
  const [onlineMode, setOnlineMode] = useState(mode);
  const [comingSoonVisible, setComingSoonVisible] = useState(false);
  const [modePopupVisible, setModePopupVisible] = useState(false);
  const [langLoading, setLangLoading] = useState(false);
  const [updatePopup, setUpdatePopup] = useState({
    visible: false,
    type: 'uptodate',
    storeUrl: null,
  });

  // Keep modeRef and local state in sync with Redux
  useEffect(() => {
    modeRef.current = mode;
    setOnlineMode(mode);
  }, [mode]);

  // BackHandler
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          navigation.navigate(STRING.SCREEN.DASHBOARD);
          return true;
        },
      );
      return () => backHandler.remove();
    }, [navigation]),
  );

  // ─── Language ────────────────────────────────────────────────────────────────
  // If offline: show ModePopup (same pattern as Categories/ContactUs/Emergency)
  // If online: call API to sync language preference, then change locally

  const handleLanguage = async lang => {
    if (lang === currentLang || langLoading) return;

    if (!modeRef.current) {
      // Offline — show mode popup so user can switch to online first
      setModePopupVisible(true);
      return;
    }

    setLangLoading(true);
    try {
      await comnPost('v2/updateProfile', {language: lang});
      await AsyncStorage.setItem('isUpdated', 'true');
    } catch (err) {
      log.debug('Language API Error:', err);
    }

    i18n.changeLanguage(lang);
    await AsyncStorage.setItem(STRING.STORAGE.LANGUAGE, lang);
    await AsyncStorage.setItem('isLangChanged', 'true');
    setLangLoading(false);
    // Navigate home immediately so the landing page re-fetches with the new language
    // before the user can switch to offline mode (which would block the API call)
    navigation.navigate(STRING.SCREEN.DASHBOARD);
  };

  // ─── Online Mode ─────────────────────────────────────────────────────────────
  // Same pattern as TopComponent — toggle saves to AsyncStorage + Redux

  const handleModeToggle = async newVal => {
    modeRef.current = newVal;
    setOnlineMode(newVal);
    reduxSetMode(newVal);
    await saveToStorage(STRING.STORAGE.MODE, JSON.stringify(newVal));
  };

  // Called from ModePopup when user taps Online/Offline button
  const handleModeChangeFromPopup = async newMode => {
    modeRef.current = newMode;
    setOnlineMode(newMode);
    reduxSetMode(newMode);
    await saveToStorage(STRING.STORAGE.MODE, JSON.stringify(newMode));
    setModePopupVisible(false);
  };

  // ─── Check for Updates ───────────────────────────────────────────────────────

  const checkUpdate = async () => {
    try {
      const update = await VersionCheck.needUpdate();
      if (update && update.isNeeded) {
        setUpdatePopup({visible: true, type: 'update', storeUrl: update.storeUrl});
      } else {
        setUpdatePopup({visible: true, type: 'uptodate', storeUrl: null});
      }
    } catch (error) {
      log.debug(error);
    }
  };

  const handleUpdateDismiss = () =>
    setUpdatePopup(prev => ({...prev, visible: false}));

  const handleUpdatePress = () => {
    const {storeUrl} = updatePopup;
    setUpdatePopup(prev => ({...prev, visible: false}));
    if (storeUrl) {
      Linking.openURL(storeUrl);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate(STRING.SCREEN.DASHBOARD)}
          activeOpacity={0.8}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="chevron-back" size={18} color={C.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('SETTINGS.TITLE')}</Text>
      </View>
      <View style={styles.headerCurve} />

      {/* Body */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Preferences ── */}
        <Text style={styles.sectionLabel}>{t('SETTINGS.PREFERENCES')}</Text>
        <View style={styles.card}>

          {/* Language */}
          <View style={styles.item}>
            <Text style={styles.itemIcon}>🌐</Text>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>{t('SETTINGS.LANGUAGE')}</Text>
              <Text style={styles.itemDesc}>{t('SETTINGS.LANGUAGE_DESC')}</Text>
            </View>
            {langLoading ? (
              <ActivityIndicator size="small" color={C.oceanMid} />
            ) : (
              <View style={styles.langRow}>
                <TouchableOpacity
                  style={[styles.langBtn, currentLang === 'en' && styles.langBtnActive]}
                  activeOpacity={0.8}
                  onPress={() => handleLanguage('en')}>
                  <Text style={[styles.langBtnText, currentLang === 'en' && styles.langBtnTextActive]}>
                    {t('en')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langBtn, currentLang === 'mr' && styles.langBtnActive]}
                  activeOpacity={0.8}
                  onPress={() => handleLanguage('mr')}>
                  <Text style={[styles.langBtnText, currentLang === 'mr' && styles.langBtnTextActive]}>
                    {t('mr')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Online Mode */}
          <View style={styles.item}>
            <Text style={styles.itemIcon}>📡</Text>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>{t('SETTINGS.ONLINE_MODE')}</Text>
              <Text style={styles.itemDesc}>
                {onlineMode ? t('SETTINGS.FETCHING_LIVE') : t('SETTINGS.USING_CACHED')}
              </Text>
            </View>
            <Switch
              value={onlineMode}
              onValueChange={handleModeToggle}
              trackColor={{false: 'rgba(0,0,0,0.12)', true: C.oceanMid}}
              thumbColor={C.white}
            />
          </View>

          <View style={styles.divider} />

          {/* Notifications */}
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.75}
            onPress={() => setComingSoonVisible(true)}>
            <Text style={styles.itemIcon}>🔔</Text>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>{t('SETTINGS.NOTIFICATIONS')}</Text>
              <Text style={styles.itemDesc}>{t('SETTINGS.NOTIFICATIONS_DESC')}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('SETTINGS.COMING_SOON_BADGE')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── App ── */}
        <Text style={styles.sectionLabel}>{t('SETTINGS.APP_SECTION')}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.75}
            onPress={checkUpdate}>
            <Image
              source={require('../Assets/Images/DrawerIcons/update.webp')}
              style={styles.updateIcon}
              resizeMode="contain"
            />
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>{t('SETTINGS.CHECK_UPDATES')}</Text>
              <Text style={styles.itemDesc}>
                v{VersionCheck.getCurrentVersion()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textLight} />
          </TouchableOpacity>
        </View>

        {/* ── Legal ── */}
        <Text style={styles.sectionLabel}>{t('SETTINGS.LEGAL')}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(STRING.SCREEN.PRIVACY_POLICY)}>
            <Text style={styles.itemIcon}>📜</Text>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>{t('SETTINGS.PRIVACY_POLICY')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textLight} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(STRING.SCREEN.TERMS)}>
            <Text style={styles.itemIcon}>📝</Text>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>{t('SETTINGS.TERMS')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textLight} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>
          {t('SETTINGS.VERSION_PREFIX')} {VersionCheck.getCurrentVersion()}
        </Text>
      </ScrollView>

      {/* ── Popups ── */}

      {/* Coming Soon */}
      <ComingSoonPopup
        visible={comingSoonVisible}
        onClose={() => setComingSoonVisible(false)}
        title={t('SETTINGS.COMING_SOON_TITLE')}
        message={t('SETTINGS.COMING_SOON_MESSAGE')}
        btnLabel={t('SETTINGS.GOT_IT')}
      />

      {/* Online/Offline mode popup — shown when language change attempted offline */}
      <ModePopup
        visible={modePopupVisible}
        currentMode={onlineMode}
        onClose={() => setModePopupVisible(false)}
        onModeChange={handleModeChangeFromPopup}
      />

      {/* Update */}
      <UpdatePopup
        visible={updatePopup.visible}
        type={updatePopup.type}
        onDismiss={handleUpdateDismiss}
        onUpdate={handleUpdatePress}
      />
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},
  flex: {flex: 1},

  // Header
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

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
  },

  // Section label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  // Card (no elevation/shadow)
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 44,
  },

  // Item row
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  itemIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  updateIcon: {
    width: 26,
    height: 26,
    marginRight: 6,
  },
  itemContent: {flex: 1},
  itemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: C.textDark,
    marginBottom: 2,
  },
  itemDesc: {fontSize: 12, color: C.textLight},

  // Language toggle pills
  langRow: {flexDirection: 'row', gap: 6},
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: C.white,
  },
  langBtnActive: {
    backgroundColor: C.oceanMid,
    borderColor: 'transparent',
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMid,
  },
  langBtnTextActive: {color: C.white},

  // Coming Soon badge
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },

  // Version footer
  version: {
    textAlign: 'center',
    marginTop: 32,
    color: C.textLight,
    fontSize: 12,
  },
});

// ─── Redux ─────────────────────────────────────────────────────────────────────

const mapStateToProps = state => ({
  mode: state.commonState.mode,
});

const mapDispatchToProps = dispatch => ({
  setMode: val => dispatch(setMode(val)),
  setLoader: val => dispatch(setLoader(val)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
