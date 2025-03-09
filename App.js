// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import UserList from './src/components/UserList';
import AddUser from './src/components/AddUser';
import { createUserTable } from './src/models/UserModel';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Initialize DB tables
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
    <NavigationContainer>
      <Stack.Navigator initialRouteName="UserList">
        <Stack.Screen name="UserList" component={UserList} />
        <Stack.Screen name="AddUser" component={AddUser} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
