import React from 'react';
import {View} from 'react-native';
import styles from './Styles';

const RouteLine = () => {
  return (
    <View>
      <View style={styles.routeLineVert}></View>
      <View style={styles.routeDot}></View>
    </View>
  );
};

export default RouteLine;
