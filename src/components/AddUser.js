// src/components/AddUser.js
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { addUser } from '../controllers/UserController';

export default function AddUser({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleAddUser = async () => {
        if (!name) {
            Alert.alert('Please enter a name');
            return;
        }

        await addUser(name, email);
        Alert.alert('User Added');
        navigation.goBack(); // Go back to UserList screen
    };

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <TextInput
                placeholder="Enter name"
                value={name}
                onChangeText={setName}
                style={{ borderWidth: 1, padding: 10, marginBottom: 16 }}
            />
            <TextInput placeholder="Email" onChangeText={setEmail} />

            <Button title="Add User" onPress={handleAddUser} />
        </View>
    );
}
