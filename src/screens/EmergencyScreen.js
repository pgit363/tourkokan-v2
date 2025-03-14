// src/components/EmergencyScreen.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmergencyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      {/* You can map a list of contacts here */}
      <Text style={styles.text}>Police: 100</Text>
      <Text style={styles.text}>Fire Brigade: 101</Text>
      <Text style={styles.text}>Ambulance: 102</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
});
