import React, {Component} from 'react';
import {View, Animated, LogBox, Image, TouchableOpacity} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import styles from './Styles';
import Path from '../../Services/Api/BaseUrl';
import ProgressImage from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import {Linking} from 'react-native';
import {AWS_URL} from '@env';

class AnimationStyle extends Component {
  state = {
    opacity: new Animated.Value(0),
  };

  onLoad = () => {
    Animated.timing(this.state.opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  onLoadError = (error) => {
    const errorMessage = error?.nativeEvent?.error;
  
    if (errorMessage && errorMessage.includes('404')) {
      console.warn('⚠️ Image not found (404).');
    } else {
      console.warn('⚠️ Image failed to load:', errorMessage);
    }
  };
  

  render() {
    return (
      <Animated.View
        style={[
          {
            opacity: this.state.opacity,
            transform: [
              {
                scale: this.state.opacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1],
                }),
              },
            ],
          },
          this.props.style,
        ]}>
        <ProgressImage
          {...this.props}
          indicator={Progress.Circle} // Optional: Add a progress indicator
          indicatorProps={{
            size: 30,
            borderWidth: 0,
            color: 'rgba(150, 150, 150, 1)',
            unfilledColor: 'rgba(200, 200, 200, 0.2)',
          }}
          resizeMode="stretch"
          imageStyle={{ width: '100%', height: '100%' }}
          onLoad={this.onLoad}
          onError={this.onLoadError}
        />
      </Animated.View>
    );
  }
}

const Banner = ({style, bannerImages}) => {
  const bannerClick = imageUri => {
    Linking.openURL(imageUri);
  };

  return (
    <View style={[styles.banner, style]}>
      <Carousel
        loop={bannerImages.length > 1}
        width={DIMENSIONS.windowWidth}
        height={style?.height || DIMENSIONS.windowWidth / 2}
        autoPlay={bannerImages.length > 1}
        data={bannerImages}
        scrollAnimationDuration={3000}
        renderItem={({index}) => {
          const image = bannerImages[index].image;
          const imageUri = image.startsWith('http')
            ? image
            : `${AWS_URL}${image}`;
          const item = bannerImages[index];
          const url = item.redirect_url || item.meta_data?.url;

          return (
            <TouchableOpacity
              style={{ width: '100%', height: '100%' }}
              onPress={() => (url ? bannerClick(url) : null)}>
              <AnimationStyle
                source={{uri: imageUri}}
                style={[styles.bannerImage, { width: '100%', height: '100%', resizeMode: 'stretch' }]}
                onLoad={() => console.log(`Image ${imageUri} loaded`)}
                onError={error => {
                  console.error(`Image ${imageUri} failed to load`, error);
                }}
              />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default Banner;
