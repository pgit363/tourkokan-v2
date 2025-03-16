import React from 'react';
import {View} from 'react-native';
import styles from './Styles';
import COLOR from '../../../Services/Constants/COLORS';
import DIMENSIONS from '../../../Services/Constants/DIMENSIONS';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const RouteLineFirst = () => {
  return (
    <View>
      <View style={styles.routeLineFirst}></View>
      <MaterialIcons
        name="my-location"
        color={COLOR.themeBlue}
        size={DIMENSIONS.iconBig}
        style={styles.icon}
      />
    </View>
  );
};

export default RouteLineFirst;
