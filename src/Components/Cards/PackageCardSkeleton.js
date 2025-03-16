import React from 'react';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';
import {useTranslation} from 'react-i18next';

const PackageCardSkeleton = ({cardType}) => {
  const {t} = useTranslation();

  return (
    <Skeleton
      animation="pulse"
      variant="text"
      style={
        cardType == 'small' ? styles.packageCardSmall : styles.packageCardLong
      }
    />
  );
};

export default PackageCardSkeleton;
