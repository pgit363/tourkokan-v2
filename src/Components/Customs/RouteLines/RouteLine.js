import React from 'react';
import {View} from 'react-native';
import styles from './Styles';

const RouteLine = () => {
  return (
    <View>
      <View style={styles.routeLineVert} />
      <View style={styles.routeDot} />
    </View>
  );
};

export default RouteLine;
