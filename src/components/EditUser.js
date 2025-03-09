// src/components/EditUser.js
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { updateUser } from '../controllers/UserController';

export default function EditUser({ route, navigation }) {
  const { user } = route.params;
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const handleUpdate = async () => {
    if (!name || !email) {
      Alert.alert('Please fill all fields');
      return;
    }

    try {
      await updateUser(user.id, name, email);
      Alert.alert('User updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error updating user');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name"
        style={styles.input}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        style={styles.input}
      />
      <Button title="Update User" onPress={handleUpdate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 10,
    borderRadius: 6,
  },
});
