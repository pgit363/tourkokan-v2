import React, {useCallback, useMemo} from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import {useTranslation} from 'react-i18next';
import {View, Text, Linking, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TabNavigator from './TabNavigator';
import Emergency from '../Screens/Emergency';
import QueriesList from '../Screens/ListPages/QueriesList';
import VersionCheck from 'react-native-version-check';
import STRING from '../Services/Constants/STRINGS';

const Drawer = createDrawerNavigator();
const drawerContainerStyle = {flex: 1};
const FACEBOOK_URL = 'https://www.facebook.com/...';
const INSTAGRAM_URL = 'https://www.instagram.com/tour_kokan';
const APP_VERSION = VersionCheck.getCurrentVersion();

const CustomDrawerContent = React.memo(props => {
  const {t} = useTranslation();

  const handleLinkPress = useCallback(async url => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open URL:', err);
    }
  }, []);

  const checkUpdate = useCallback(async () => {
    try {
      const update = await VersionCheck.needUpdate();
      if (update && update.isNeeded) {
        Alert.alert(
          STRING.ALERT.UPDATE_AVAILABLE,
          STRING.ALERT.UPDATE_DESC,
          [
            {
              text: t('BUTTON.CANCEL'),
              style: 'cancel',
            },
            {
              text: t('BUTTON.UPDATE'),
              onPress: () => {
                Linking.openURL(update.storeUrl);
              },
            },
          ],
        );
      } else {
        Alert.alert(STRING.ALERT.UP_TO_DATE, STRING.ALERT.APP_UP_TO_DATE);
      }
    } catch (error) {
      console.log(error);
    }
  }, [t]);

  const openFacebook = useCallback(() => handleLinkPress(FACEBOOK_URL), [
    handleLinkPress,
  ]);
  const openInstagram = useCallback(() => handleLinkPress(INSTAGRAM_URL), [
    handleLinkPress,
  ]);

  return (
    <View style={drawerContainerStyle}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
        <DrawerItem label={STRING.DRAWER.CHECK_UPDATE} onPress={checkUpdate} />
      </DrawerContentScrollView>
      <View style={styles.footerContainer}>
        <View style={styles.socialMediaContainer}>
          <TouchableOpacity onPress={openFacebook}>
            <Ionicons
              name="logo-facebook"
              size={24}
              color="#3b5998"
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={openInstagram}>
            <Ionicons
              name="logo-instagram"
              size={24}
              color="#e1306c"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.footerText}>
          Designed and Developed by Probyte Solution LLP.
        </Text>
        <Text style={styles.footerText}>v{APP_VERSION}</Text>
      </View>
    </View>
  );
});

const DrawerNavigator = () => {
  const {t, i18n} = useTranslation();
  const screenOptions = useMemo(() => ({headerShown: false}), []);
  const renderDrawerContent = useCallback(
    drawerProps => <CustomDrawerContent {...drawerProps} />,
    [],
  );

  if (!i18n.isInitialized) {
    return null;
  }

  return (
    <Drawer.Navigator
      screenOptions={screenOptions}
      drawerContent={renderDrawerContent}>
      <Drawer.Screen name={t('SCREEN.DASHBOARD')} component={TabNavigator} />
      <Drawer.Screen name={t('SCREEN.EMERGENCY')} component={Emergency} />
      <Drawer.Screen name={t('SCREEN.CONTACT_US')} component={QueriesList} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  socialMediaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '30%',
    marginBottom: 20,
  },
  icon: {
    marginHorizontal: 10,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#888',
  },
});

export default DrawerNavigator;
