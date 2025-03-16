import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Skeleton} from '@rneui/themed';

const SkeletonAccordion = () => {
  return (
    <View style={styles.container}>
      <Skeleton animation="pulse" variant="text" style={styles.skeletonTitle} />
      <Skeleton
        animation="pulse"
        variant="rect"
        style={styles.skeletonContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  skeletonTitle: {
    height: 30,
    marginBottom: 10,
  },
  skeletonContent: {
    height: 200, // Adjust based on your content height
    borderRadius: 5,
  },
});

export default SkeletonAccordion;
