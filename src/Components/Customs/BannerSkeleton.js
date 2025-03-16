import React from 'react';
import {View} from 'react-native';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';

const BannerSkeleton = () => {
  return (
    <View>
      <Skeleton
        animation="pulse"
        variant="text"
        style={styles.fieldsViewSkeleton}
      />
    </View>
  );
};

export default BannerSkeleton;
