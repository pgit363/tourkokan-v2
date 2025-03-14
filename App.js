// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';

import UserList from './src/components/UserList';
import AddUser from './src/components/AddUser';
import EditUser from './src/components/EditUser';
import { createUserTable } from './src/models/UserModel';

import RootNavigator from './src/navigation/RootNavigator';

const Stack = createNativeStackNavigator();
// const Drawer = createDrawerNavigator();

function UserStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="UserList">
      <Stack.Screen name="UserList" component={UserList} />
      <Stack.Screen name="AddUser" component={AddUser} />
      <Stack.Screen name="EditUser" component={EditUser} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    const initDB = async () => {
      try {
        await createUserTable();
        console.log('User table created/verified successfully');
      } catch (error) {
        console.log('DB Init Error:', error);
      }
    };
    initDB();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <RootNavigator/>
        {/* <Drawer.Navigator initialRouteName="Users">
          <Drawer.Screen name="Users" component={UserStackNavigator} />
        </Drawer.Navigator> */}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
