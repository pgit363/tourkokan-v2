import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import StackNavigator from './StackNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import RoutesList from '../components/RoutesList';
import FavouritesScreen from '../screens/FavouritesScreen';
import MapScreen from '../screens/MapScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Main':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Favourite':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'BusRoute':
              iconName = focused ? 'bus' : 'bus-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007aff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Main"
        component={StackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Favourite"
        component={FavouritesScreen}
        options={{ title: 'Favourites' }}
      />
      <Tab.Screen
        name="BusRoute"
        component={RoutesList}
        options={{ title: 'Bus Routes' }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          headerShown: true,
          title: 'Tourist Map',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
