import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './DrawerNavigator';
import ModalScreen from '../screens/ModalScreen';

const RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="MainApp" component={DrawerNavigator} options={{ headerShown: false }} />
      <RootStack.Screen name="Modal" component={ModalScreen} options={{ presentation: 'modal' }} />
    </RootStack.Navigator>
  );
}
