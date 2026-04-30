import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';

import HomeScreen from '../Screens/HomeScreen';
import Categories from '../Screens/ListPages/Categories';
import MSRTCSearch from '../Screens/ListPages/MSRTCSearch';
import ExploreGrid from '../Screens/ListPages/ExploreGrid';
import EventsList from '../Screens/ListPages/EventsList';
import CustomTabBar from '../Components/Navigation/CustomTabBar';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const {t} = useTranslation();

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name={t('SCREEN.HOME_TAB')} component={HomeScreen} />
      <Tab.Screen name={t('SCREEN.GALLERY')} component={ExploreGrid} />
      <Tab.Screen name={t('SCREEN.ROUTES')} component={MSRTCSearch} />
      <Tab.Screen name={t('SCREEN.CATEGORIES')} component={Categories} />
      <Tab.Screen name={t('SCREEN.EVENTS_LIST')} component={EventsList} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
