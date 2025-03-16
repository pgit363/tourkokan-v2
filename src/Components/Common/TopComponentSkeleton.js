import React from 'react';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';

const TopComponentSkeleton = () => {
  return (
    <Skeleton
      animation="pulse"
      variant="text"
      style={styles.topComponentSkeleton}
    />
  );
};

export default TopComponentSkeleton;
