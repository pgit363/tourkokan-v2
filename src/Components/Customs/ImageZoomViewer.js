import React from 'react';
import {View, StyleSheet} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';

const ImageZoomViewer = () => {
  const images = [
    {
      url: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwallpaperaccess.com%2Fportrait&psig=AOvVaw3GN6qnBPWN756VsYOqAd3O&ust=1687187686189000&source=images&cd=vfe&ved=0CBEQjRxqFwoTCICvs_ORzf8CFQAAAAAdAAAAABAE', // Replace with your image URL
    },
    {
      url: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwallpaperaccess.com%2Fportrait&psig=AOvVaw3GN6qnBPWN756VsYOqAd3O&ust=1687187686189000&source=images&cd=vfe&ved=0CBEQjRxqFwoTCICvs_ORzf8CFQAAAAAdAAAAABAE', // Replace with your image URL
    },
    // Add more images as needed
  ];

  return (
    <View style={styles.container}>
      <ImageViewer
        imageUrls={images}
        enableSwipeDown
        enableImageZoom
        renderIndicator={() => null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ImageZoomViewer;
