import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';

import TabNavigator from './TabNavigator';
import EmergencyScreen from '../screens/EmergencyScreen';
import ReachUsScreen from '../screens/ReachUsScreen';


const Drawer = createDrawerNavigator();

// 🔗 Handle social media link click
const handleLinkPress = (url) => {
  Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
};

// 👉 Custom Drawer Content with Footer Branding
const CustomDrawerContent = (props) => {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>

      {/* Footer Section */}
      <View style={styles.footerContainer}>
        <View style={styles.socialMediaContainer}>
          <TouchableOpacity onPress={() => handleLinkPress('https://www.facebook.com/')}>
            <Ionicons name="logo-facebook" size={24} color="#3b5998" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLinkPress('https://www.instagram.com/tour_kokan')}>
            <Ionicons name="logo-instagram" size={24} color="#e1306c" style={styles.icon} />
          </TouchableOpacity>
        </View>
        <Text style={styles.footerText}>
          Designed and Developed by Probyte Solution LLP.
        </Text>
      </View>
    </DrawerContentScrollView>
  );
};

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />} // 👈 ADD THIS
      screenOptions={{
        headerShown: true, // ✅ Show header
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={TabNavigator}
        options={{
          headerTitle: 'Tourkokan',
          drawerLabel: 'Home', // optional if same as name
        }} />
      <Drawer.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{ title: 'Emergency' }}
      />
      <Drawer.Screen
        name="ReachUs"
        component={ReachUsScreen}
        options={{ title: 'Reach Us' }}
      />
    </Drawer.Navigator>

  );
}

// 💅 Styles
const styles = StyleSheet.create({
  footerContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ccc',
    marginTop: 'auto', // Push to bottom
    alignItems: 'center', // Center horizontally
  },
  socialMediaContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Center icons horizontally
    marginBottom: 10,
  },
  icon: {
    marginHorizontal: 10, // Equal spacing on both sides
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center', // Center text
  },
});

