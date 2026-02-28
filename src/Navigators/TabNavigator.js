import React from 'react';
import {Image} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import {useTranslation} from 'react-i18next';

import DIMENSIONS from '../Services/Constants/DIMENSIONS';
import COLOR from '../Services/Constants/COLORS';

import HomeScreen from '../Screens/HomeScreen';
import MapScreen from '../Screens/MapScreen';
import Categories from '../Screens/ListPages/Categories';
import AllRoutesSearch from '../Screens/ListPages/AllRoutesSearch';
import ExploreGrid from '../Screens/ListPages/ExploreGrid';

const Tab = createBottomTabNavigator();
const routesIconStyle = {width: 40, height: 40};

const HomeTabIcon = () => (
  <Ionicons
    name="home-outline"
    color={COLOR.black}
    size={DIMENSIONS.iconSize}
  />
);

const GalleryTabIcon = () => (
  <Fontisto name="photograph" color={COLOR.black} size={DIMENSIONS.iconSize} />
);

const RoutesTabIcon = () => (
  <Image
    source={require('../Assets/Images/Bus1_png_high.png')}
    style={routesIconStyle}
  />
);

const CategoriesTabIcon = () => (
  <MaterialIcons name="category" color={COLOR.black} size={DIMENSIONS.iconSize} />
);

const MapTabIcon = () => (
  <Ionicons name="map-outline" color={COLOR.black} size={DIMENSIONS.iconSize} />
);

const TabNavigator = () => {
  const {t} = useTranslation();

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
          tabBarIcon: HomeTabIcon,
        }}
      />

      <Tab.Screen
        name={t('SCREEN.GALLERY')}
        component={ExploreGrid}
        options={{
          title: `${t('SCREEN.GALLERY')}`,
          tabBarLabel: `${t('SCREEN.GALLERY')}`,
          tabBarIcon: GalleryTabIcon,
        }}
      />

      <Tab.Screen
        name={t('SCREEN.ROUTES')}
        component={AllRoutesSearch}
        options={{
          tabBarIcon: RoutesTabIcon,
          tabBarLabel: () => null,
        }}
      />

      <Tab.Screen
        name={t('SCREEN.CATEGORIES')}
        component={Categories}
        options={{
          title: `${t('SCREEN.CATEGORIES')}`,
          tabBarLabel: `${t('SCREEN.CATEGORIES')}`,
          tabBarIcon: CategoriesTabIcon,
        }}
      />

      <Tab.Screen
        name={t('SCREEN.MAP_SCREEN')}
        component={MapScreen}
        options={{
          tabBarLabel: `${t('SCREEN.MAP')}`,
          tabBarIcon: MapTabIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
