import React from 'react';
import {View} from 'react-native';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';

const RoutesSearchPanelSkeleton = () => {
  return (
    <View>
      <Skeleton
        animation="pulse"
        variant="text"
        style={styles.smallFieldsViewSkeleton}
      />
      <Skeleton
        animation="pulse"
        variant="text"
        style={styles.searchButtonSkeleton}
      />
    </View>
  );
};

export default RoutesSearchPanelSkeleton;
