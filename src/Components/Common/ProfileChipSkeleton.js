import React from 'react';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';

const ProfileChipSkeleton = () => {
  return (
    <Skeleton animation="pulse" variant="text" style={styles.profileChip} />
  );
};

export default ProfileChipSkeleton;
