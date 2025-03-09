// src/components/UserList.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Button, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllUsers, deleteUser } from '../controllers/UserController';

export default function UserList({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const handleDeleteUser = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteUser(id);
            Alert.alert('User deleted');
            loadUsers();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View
      style={{
        marginBottom: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
      }}
    >
      <Text style={{ fontSize: 16 }}>{item.name}</Text>
      <Text style={{ fontSize: 14, color: 'gray' }}>{item.email}</Text>

      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <TouchableOpacity
          onPress={() => handleDeleteUser(item.id)}
          style={{
            backgroundColor: 'red',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: 'white' }}>Delete</Text>
        </TouchableOpacity>

        {/* Optional Edit Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EditUser', { user: item })}
          style={{
            backgroundColor: 'blue',
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 6,
            marginLeft: 10,
          }}
        >
          <Text style={{ color: 'white' }}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="Add User" onPress={() => navigation.navigate('AddUser')} />

      <FlatList
        data={users}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading && <Text style={{ marginTop: 20 }}>No users found.</Text>
        }
        refreshing={loading}
        onRefresh={loadUsers}
        contentContainerStyle={{ paddingVertical: 16 }}
      />
    </View>
  );
}
