import React from 'react';
import {View} from 'react-native';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';

const SearchPanelSkeleton = () => {
  return (
    <View>
      <Skeleton
        animation="pulse"
        variant="text"
        style={styles.fieldsViewSkeleton}
      />
      <Skeleton
        animation="pulse"
        variant="text"
        style={styles.fieldsViewSkeleton}
      />
      <Skeleton
        animation="pulse"
        variant="text"
        style={styles.searchButtonSkeleton}
      />
    </View>
  );
};

export default SearchPanelSkeleton;
