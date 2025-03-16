import React from 'react';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';

const RouteHeadCardSkeleton = () => {
  return (
    <Skeleton
      animation="pulse"
      variant="text"
      style={styles.routeHeadCardSkeleton}
    />
  );
};

export default RouteHeadCardSkeleton;
