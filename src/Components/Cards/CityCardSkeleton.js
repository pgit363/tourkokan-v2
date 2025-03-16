import React from 'react';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';
import {useTranslation} from 'react-i18next';

const CityCardSkeleton = ({type}) => {
  const {t} = useTranslation();

  return (
    <Skeleton
      animation="pulse"
      variant="text"
      style={
        type == t('HEADER.PLACE')
          ? styles.placeCardSkeleton
          : styles.cityCardSkeleton
      }
    />
  );
};

export default CityCardSkeleton;
