import React from 'react';
import {View} from 'react-native';
import styles from './Styles';
import COLOR from '../../../Services/Constants/COLORS';
import DIMENSIONS from '../../../Services/Constants/DIMENSIONS';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const RouteLineLast = () => {
  return (
    <View>
      <MaterialIcons
        name="location-pin"
        color={COLOR.themeBlue}
        size={DIMENSIONS.iconBig}
        style={styles.icon}
      />
      <View style={styles.routeLineLast}></View>
    </View>
  );
};

export default RouteLineLast;
