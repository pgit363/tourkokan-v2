import React, {useEffect, useState} from 'react';
import {Image, Keyboard} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import {useTranslation} from 'react-i18next';

import DIMENSIONS from '../Services/Constants/DIMENSIONS';
import COLOR from '../Services/Constants/COLORS';

import HomeScreen from '../Screens/HomeScreen';
import MapScreen from '../Screens/MapScreen';
import Explore from '../Screens/ListPages/Explore';
import Categories from '../Screens/ListPages/Categories';
import AllRoutesSearch from '../Screens/ListPages/AllRoutesSearch';
import ExploreGrid from '../Screens/ListPages/ExploreGrid';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const {t} = useTranslation();

  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [keyboardShown, setKeyboardShown] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        setKeyboardShown(true);
        setKeyboardOffset(event.endCoordinates.height);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardShown(false);
        setKeyboardOffset(0);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        activeTintColor: COLOR.themeBlue,
        inactiveTintColor: COLOR.black,
        labelStyle: {paddingBottom: 4},
        tabBarHideOnKeyboard: true,
        tabBarStyle: {},
      }}>
      <Tab.Screen
        name={t('SCREEN.HOME_TAB')}
        component={HomeScreen}
        options={{
          tabBarLabel: `${t('SCREEN.HOME')}`,
          tabBarIcon: ({color, size}) => (
            <Ionicons
              name="home-outline"
              color={COLOR.black}
              size={DIMENSIONS.iconSize}
            />
          ),
        }}
      />

      <Tab.Screen
        name={t('SCREEN.GALLERY')}
        component={ExploreGrid}
        options={{
          title: `${t('SCREEN.GALLERY')}`,
          tabBarLabel: `${t('SCREEN.GALLERY')}`,
          tabBarIcon: ({color, size}) => (
            <Fontisto
              name="photograph"
              color={COLOR.black}
              size={DIMENSIONS.iconSize}
            />
          ),
        }}
      />

      <Tab.Screen
        name={t('SCREEN.ROUTES')}
        component={AllRoutesSearch}
        options={{
          tabBarIcon: ({color, size}) => (
            <Image
              source={require('../Assets/Images/Bus1_png_high.png')}
              style={{width: 40, height: 40}}
            />
          ),
          tabBarLabel: () => null,
        }}
      />

      <Tab.Screen
        name={t('SCREEN.CATEGORIES')}
        component={Categories}
        options={{
          title: `${t('SCREEN.CATEGORIES')}`,
          tabBarLabel: `${t('SCREEN.CATEGORIES')}`,
          tabBarIcon: ({color, size}) => (
            <MaterialIcons
              name="category"
              color={COLOR.black}
              size={DIMENSIONS.iconSize}
            />
          ),
        }}
      />

      <Tab.Screen
        name={t('SCREEN.MAP_SCREEN')}
        component={MapScreen}
        options={{
          tabBarLabel: `${t('SCREEN.MAP')}`,
          tabBarIcon: ({color, size}) => (
            <Ionicons
              name="map-outline"
              color={COLOR.black}
              size={DIMENSIONS.iconSize}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
