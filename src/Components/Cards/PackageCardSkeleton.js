import React from 'react';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';

const PackageCardSkeleton = ({cardType}) => {
  return (
    <Skeleton
      animation="pulse"
      variant="text"
      style={
        cardType === 'small' ? styles.packageCardSmall : styles.packageCardLong
      }
    />
  );
};

export default PackageCardSkeleton;
