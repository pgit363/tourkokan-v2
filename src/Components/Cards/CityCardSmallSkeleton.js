import React from 'react';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';
import {useTranslation} from 'react-i18next';

const CityCardSmallSkeleton = ({type}) => {
  const {t} = useTranslation();

  return (
    <Skeleton
      animation="pulse"
      variant="text"
      style={
        type == t('HEADER.PLACE')
          ? styles.placeCardSkeleton
          : styles.cityCardSmallSkeleton
      }
    />
  );
};

export default CityCardSmallSkeleton;
