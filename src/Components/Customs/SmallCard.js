import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import styles from './Styles';
import GlobalText from './Text';

const SmallCard = ({style, Icon, title, onPress}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.smallCard, style]}>
        <View style={styles.smallCardIcon}>{Icon}</View>
        <GlobalText text={title} />
      </View>
    </TouchableOpacity>
  );
};

export default SmallCard;
