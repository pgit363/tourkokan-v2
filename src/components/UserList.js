// src/components/UserList.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllUsers } from '../controllers/UserController';

export default function UserList({ navigation }) {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const data = await getAllUsers();
    setUsers(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="Add User" onPress={() => navigation.navigate('AddUser')} />

      <FlatList
        data={users}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 8 }}>
            <Text style={{ fontSize: 16 }}>{item.name}</Text>
            <Text style={{ fontSize: 14, color: 'gray' }}>{item.email}</Text>
          </View>
        )}
        onRefresh={loadUsers}
        refreshing={false} // Add loading state if needed
      />

    </View>
  );
}
