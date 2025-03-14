import React from 'react';
import { View, Text, Button } from 'react-native';

export default function ModalScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
      <Text>🚨 This is a Modal Screen</Text>
      <Button title="Close" onPress={() => navigation.goBack()} />
    </View>
  );
}
