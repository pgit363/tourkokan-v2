import React, {useState} from 'react';
import {TouchableOpacity, View, Image} from 'react-native';
import styles from './Styles';

const CategoryCard = ({data, getCategory}) => {
  const onIconCLick = () => {
    getCategory();
  };

  return (
    <View style={styles.catCardContainer}>
      <TouchableOpacity
        style={styles.catCardIcon}
        onPress={() => onIconCLick()}>
        <Image
          source={require('../../Assets/Images/beach.png')}
          style={styles.catCardIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

export default CategoryCard;
