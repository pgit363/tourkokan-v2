// ImageCarousel.js
import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width: screenWidth } = Dimensions.get('window');

const dummyData = [
  { id: 1, title: 'Welcome to TourKokan' },
  { id: 2, title: 'Explore Beautiful Beaches' },
  { id: 3, title: 'Find Best Bus Routes' },
  { id: 4, title: 'Enjoy Local Culture' },
];

const ImageCarousel = () => {
  return (
    <View style={styles.container}>
      <Carousel
        loop
        width={screenWidth}
        height={160}
        autoPlay={true}
        data={dummyData}
        scrollAnimationDuration={1000}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.title}>{item.title}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  slide: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#ffcc80',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default ImageCarousel;
