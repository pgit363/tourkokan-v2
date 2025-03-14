import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const ProfileScreen = () => {
  const user = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    phone: '+91 9876543210',
    location: {
      latitude: 18.5204,
      longitude: 73.8567,
      address: 'Pune, Maharashtra, India',
    },
    photo: 'https://i.pravatar.cc/150?img=3',
  };

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileCard}>
        <Image source={{ uri: user.photo }} style={styles.profileImage} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
      </View>

      {/* Location Section */}
      <View style={styles.mapContainer}>
        <Text style={styles.sectionTitle}>Location</Text>
        <MapView
          style={styles.map}
          region={{
            latitude: user.location.latitude,
            longitude: user.location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={{
              latitude: user.location.latitude,
              longitude: user.location.longitude,
            }}
            title={user.name}
            description={user.location.address}
          />
        </MapView>
        <Text style={styles.locationText}>{user.location.address}</Text>
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 16,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#777',
    marginTop: 4,
  },
  phone: {
    fontSize: 16,
    color: '#777',
    marginTop: 2,
  },
  mapContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  locationText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#555',
  },
});
