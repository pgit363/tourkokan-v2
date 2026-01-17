import React, {useState} from 'react';
import styles from './Styles';
import {Skeleton} from '@rneui/themed';
import {ResponsiveGrid} from 'react-native-flexible-grid';
import {FlatList} from 'react-native';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';

const ExploreGridSkeleton = () => {
  const [gallery, setGallery] = useState([
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
      style={{
        padding: 5,
        marginBottom: 70,
        height: DIMENSIONS.screenHeight,
        width: DIMENSIONS.screenWidth,
      }}
    />
  );
};

export default ExploreGridSkeleton;
