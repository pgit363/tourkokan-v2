import React from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
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
import Emergency from '../Screens/Emergency';
import QueriesList from '../Screens/ListPages/QueriesList';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const {t, i18n} = useTranslation();

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

  const CustomDrawerContent = props => (
    <View style={{flex: 1}}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={styles.footerContainer}>
        <View style={styles.socialMediaContainer}>
          <TouchableOpacity
            onPress={() => handleLinkPress('https://www.facebook.com/...')}>
            <Ionicons
              name="logo-facebook"
              size={24}
              color="#3b5998"
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              handleLinkPress('https://www.instagram.com/tour_kokan')
            }>
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
      </View>
    </View>
  );

  return (
    <Drawer.Navigator
      screenOptions={{headerShown: false}}
      drawerContent={props => <CustomDrawerContent {...props} />}>
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
