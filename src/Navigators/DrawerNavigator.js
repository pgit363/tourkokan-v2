import React, {useState} from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  Linking,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TabNavigator from './TabNavigator';
import MapScreen from '../Screens/MapScreen';
import Emergency from '../Screens/Emergency';
import QueriesList from '../Screens/ListPages/QueriesList';
import Settings from '../Screens/Settings';
import PrivacyPolicyScreen from '../Screens/PrivacyPolicyScreen';
import TermsScreen from '../Screens/TermsScreen';
import AboutScreen from '../Screens/AboutScreen';
import HelpCenterScreen from '../Screens/HelpCenterScreen';
import VersionCheck from 'react-native-version-check';
import STRING from '../Services/Constants/STRINGS';
import UpdatePopup from '../Components/Common/UpdatePopup';

const Drawer = createDrawerNavigator();

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  sandDark: '#8B6914',
  textDark: '#1C1917',
  textLight: '#78716C',
  white: '#FFFFFF',
  activeBg: 'rgba(184,228,234,0.18)',
};

// ─── DrawerNavigator ───────────────────────────────────────────────────────────

const DrawerNavigator = () => {
  const {t, i18n} = useTranslation();
  const [updatePopup, setUpdatePopup] = useState({
    visible: false,
    type: 'uptodate',
    storeUrl: null,
  });

  if (!i18n.isInitialized) {
    return null;
  }

  const handleLinkPress = async url => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open URL:', err);
    }
  };

  const checkUpdate = async () => {
    try {
      const update = await VersionCheck.needUpdate();
      if (update && update.isNeeded) {
        setUpdatePopup({visible: true, type: 'update', storeUrl: update.storeUrl});
      } else {
        setUpdatePopup({visible: true, type: 'uptodate', storeUrl: null});
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdateDismiss = () =>
    setUpdatePopup(prev => ({...prev, visible: false}));

  const handleUpdatePress = () => {
    setUpdatePopup(prev => ({...prev, visible: false}));
    if (updatePopup.storeUrl) {
      Linking.openURL(updatePopup.storeUrl);
    }
  };

  const MENU_ITEMS = [
    {type: 'image', source: require('../Assets/Images/DrawerIcons/home.webp'), label: t('DRAWER.HOME'), screen: STRING.SCREEN.DASHBOARD, navigate: true},
    {type: 'image', source: require('../Assets/Images/DrawerIcons/emergency.webp'), label: t('DRAWER.EMERGENCY'), screen: STRING.SCREEN.EMERGENCY, navigate: true},
    {type: 'image', source: require('../Assets/Images/DrawerIcons/contact_us.webp'), label: t('DRAWER.CONTACT_US'), screen: STRING.SCREEN.CONTACT_US, navigate: true},
    {type: 'image', source: require('../Assets/Images/DrawerIcons/settings.webp'), label: t('DRAWER.SETTINGS'), screen: STRING.SCREEN.SETTINGS, navigate: true},
    {type: 'image', source: require('../Assets/Images/DrawerIcons/about.webp'), label: t('DRAWER.ABOUT'), screen: STRING.SCREEN.ABOUT, navigate: true},
    {type: 'emoji', source: '🗺️', label: t('DRAWER.MAP'), screen: STRING.SCREEN.MAP_SCREEN, navigate: true},
    {type: 'image', source: require('../Assets/Icons/faq.png'), label: t('DRAWER.HELP_CENTER'), screen: STRING.SCREEN.HELP_CENTER, navigate: true},
  ];

  const CustomDrawerContent = ({navigation, state}) => {
    const activeScreen = state.routes[state.index]?.name;

    return (
      <View style={styles.sidebar}>
        {/* ── Scrollable area: header + menu ── */}
        <DrawerContentScrollView
          scrollEnabled={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.menuHeader}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../Assets/Images/Logos/tourkokan-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.tagline}>{t('DRAWER.TAGLINE')}</Text>
          </View>

          {/* Menu items */}
          <View style={styles.menuList}>
            {MENU_ITEMS.map(item => {
              const isActive = item.navigate && activeScreen === item.screen;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() =>
                    item.navigate ? navigation.navigate(item.screen) : undefined
                  }
                  activeOpacity={item.navigate ? 0.7 : 1}>
                  {item.type === 'image' ? (
                    <Image
                      source={item.source}
                      style={styles.menuIconImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.menuIconEmoji}>{item.source}</Text>
                  )}
                  <Text
                    style={[
                      styles.menuText,
                      isActive && styles.menuTextActive,
                    ]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={styles.activeBar} />}
                </TouchableOpacity>
              );
            })}

            {/* Check for Update */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={checkUpdate}
              activeOpacity={0.7}>
              <Image
                source={require('../Assets/Images/DrawerIcons/update.webp')}
                style={styles.menuIconImg}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>{t('DRAWER.CHECK_UPDATE')}</Text>
            </TouchableOpacity>
          </View>
        </DrawerContentScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.socialRow}>
            <TouchableOpacity
              onPress={() =>
                handleLinkPress('https://www.facebook.com/tourkokan')
              }>
              <Ionicons
                name="logo-facebook"
                size={28}
                color="#3b5998"
                style={styles.socialIconSpacing}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                handleLinkPress('https://www.instagram.com/tour_kokan')
              }>
              <Ionicons
                name="logo-instagram"
                size={28}
                color="#e1306c"
                style={styles.socialIconSpacing}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>{t('DRAWER.FOOTER')}</Text>
          <Text style={styles.footerText}>
            v{VersionCheck.getCurrentVersion()}
          </Text>
        </View>

        {/* Update Popup */}
        <UpdatePopup
          visible={updatePopup.visible}
          type={updatePopup.type}
          onDismiss={handleUpdateDismiss}
          onUpdate={handleUpdatePress}
        />
      </View>
    );
  };

  return (
    <Drawer.Navigator
      screenOptions={{headerShown: false}}
      drawerContent={props => <CustomDrawerContent {...props} />}>
      <Drawer.Screen name={STRING.SCREEN.DASHBOARD} component={TabNavigator} />
      <Drawer.Screen name={STRING.SCREEN.EMERGENCY} component={Emergency} />
      <Drawer.Screen name={STRING.SCREEN.CONTACT_US} component={QueriesList} />
      <Drawer.Screen name={STRING.SCREEN.SETTINGS} component={Settings} />
      <Drawer.Screen name={STRING.SCREEN.PRIVACY_POLICY} component={PrivacyPolicyScreen} />
      <Drawer.Screen name={STRING.SCREEN.TERMS} component={TermsScreen} />
      <Drawer.Screen name={STRING.SCREEN.ABOUT} component={AboutScreen} />
      <Drawer.Screen name={STRING.SCREEN.MAP_SCREEN} component={MapScreen} />
      <Drawer.Screen name={STRING.SCREEN.HELP_CENTER} component={HelpCenterScreen} />
    </Drawer.Navigator>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: C.white,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  menuHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  logoWrap: {
    width: 100,
    height: 100,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
    color: C.sandDark,
    letterSpacing: 0.5,
  },

  // Menu
  menuList: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: C.activeBg,
  },
  activeBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: C.oceanMid,
    borderRadius: 2,
  },
  menuIconImg: {
    width: 26,
    height: 26,
    marginRight: 14,
  },
  menuIconEmoji: {
    fontSize: 22,
    width: 26,
    textAlign: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: C.textDark,
    marginLeft: 14,
  },
  menuTextActive: {
    color: C.oceanMid,
    fontWeight: '600',
  },

  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    alignItems: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  socialIconSpacing: {
    marginHorizontal: 10,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#888',
    fontSize: 12,
  },
});

export default DrawerNavigator;
