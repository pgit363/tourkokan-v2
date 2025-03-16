import {Skeleton} from '@rneui/themed';
import React from 'react';
import styles from './Styles';

const MapSkeleton = () => {
  return (
    <Skeleton animation="pulse" variant="text" style={styles.profileMapView} />
  );
};

export default MapSkeleton;
