// src/components/ReachUsScreen.js

import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

export default function ReachUsScreen() {
  const handleCall = () => {
    Linking.openURL('tel:1234567890');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:contact@tourkokan.co.in');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reach Us</Text>
      <Text style={styles.text}>Tour Kokan Office</Text>
      <Text style={styles.text}>Address: Mumbai, Maharashtra, India</Text>
      <TouchableOpacity onPress={handleCall}>
        <Text style={styles.link}>Call: 1234567890</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleEmail}>
        <Text style={styles.link}>Email: contact@tourkokan.co.in</Text>
      </TouchableOpacity>
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
  link: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 10,
  },
});
