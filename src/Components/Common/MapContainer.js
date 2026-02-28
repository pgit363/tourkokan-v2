import React from 'react';
import {View} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import styles from './Styles';

const MapContainer = ({initialRegion, currentLatitude, currentLongitude}) => {
  const lat = parseFloat(currentLatitude);
  const lng = parseFloat(currentLongitude);

  if (isNaN(lat) || isNaN(lng)) return null;

  return (
    <View style={styles.profileMapView}>
      <MapView
        style={styles.map}
        region={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: initialRegion?.latitudeDelta || 0.01,
          longitudeDelta: initialRegion?.longitudeDelta || 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}>
        <Marker
          key={`${lat}_${lng}`}
          coordinate={{
            latitude: lat,
            longitude: lng,
          }}
        />
      </MapView>
    </View>
  );
};

export default MapContainer;
