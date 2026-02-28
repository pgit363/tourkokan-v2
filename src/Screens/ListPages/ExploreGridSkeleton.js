import React, {useState} from 'react';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';
import {FlatList} from 'react-native';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';

const gridStyle = {
  padding: 5,
  marginBottom: 70,
  height: DIMENSIONS.screenHeight,
  width: DIMENSIONS.screenWidth,
};

const ExploreGridSkeleton = () => {
  const [gallery] = useState([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  ]);

  const renderItem = ({item}) => {
    return (
      <Skeleton
        animation="pulse"
        variant="text"
        style={styles.imageGridBoxSkeleton}
      />
    );
  };

  return (
    <FlatList
      data={gallery}
      numColumns={3}
      keyExtractor={item => item}
      renderItem={renderItem}
      style={gridStyle}
    />
  );
};

export default ExploreGridSkeleton;
