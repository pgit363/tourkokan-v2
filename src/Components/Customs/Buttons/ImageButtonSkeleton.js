import React from 'react';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';

const ImageButtonSkeleton = () => {
  return (
    <Skeleton
      animation="pulse"
      variant="circle"
      style={styles.imageButtonSkeleton}
    />
  );
};

export default ImageButtonSkeleton;
