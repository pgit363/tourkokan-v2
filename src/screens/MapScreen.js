import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

export default function MapScreen() {
  const [region, setRegion] = useState({
    latitude: 17.1426,
     longitude: 73.2645,
    latitudeDelta: 1.0, // Increased zoom out to show both markers
    longitudeDelta: 1.0,
  });
  const [locationGranted, setLocationGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const markers = [
    {
      id: '1',
      title: 'Ganpatipule Beach',
      description: 'Beautiful beach in Ratnagiri',
      coordinate: { latitude: 17.1426, longitude: 73.2645 },
    },
    {
      id: '2',
      title: 'Sindhudurg Fort',
      description: 'Historical fort in Malvan',
      coordinate: { latitude: 16.0573, longitude: 73.4656 },
    },
  ];

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setLocationGranted(true);
          getCurrentLocation();
        } else {
          console.log('Location permission denied');
          setLoading(false); // Allow map to show even without permission
        }
      } else {
        setLocationGranted(true);
        getCurrentLocation();
      }
    } catch (err) {
      console.warn(err);
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        console.log('Current Location:', position.coords);
        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 1.0,
          longitudeDelta: 1.0,
        });
        setLoading(false);
      },
      error => {
        console.log('Location Error:', error.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loadingText}>Loading Map...</Text>
      ) : (
        <MapView
          provider="google"
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {markers.length > 0 ? (
            markers.map(marker => (
              <Marker
                key={marker.id}
                coordinate={marker.coordinate}
                title={marker.title}
                description={marker.description}
              />
            ))
          ) : (
            <Marker
              coordinate={{ latitude: 17.1426, longitude: 73.2645 }}
              title="Test Marker"
              description="Test location"
            />
          )}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,
    color: '#555',
  },
});
