import React, {Component, useState, useEffect} from 'react';
import {View, Animated, Image, TouchableOpacity, useWindowDimensions} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
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
    const {resizeMode = 'contain', ...rest} = this.props;
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
          rest.style,
        ]}>
        <ProgressImage
          {...rest}
          indicator={Progress.Circle}
          indicatorProps={{
            size: 30,
            borderWidth: 0,
            color: 'rgba(150, 150, 150, 1)',
            unfilledColor: 'rgba(200, 200, 200, 0.2)',
          }}
          resizeMode={resizeMode}
          imageStyle={{width: '100%', height: '100%'}}
          onLoad={this.onLoad}
          onError={this.onLoadError}
        />
      </Animated.View>
    );
  }
}

const getImageUri = (image) =>
  image.startsWith('http') ? image : `${AWS_URL}${image}`;

const Banner = ({style, bannerImages, width, resizeMode}) => {
  const {width: windowWidth} = useWindowDimensions();
  const carouselWidth = width ?? windowWidth;

  // If caller provides an explicit height, honour it and skip auto-sizing.
  // This preserves the original hero-banner behaviour (fixed large height, cover fill).
  const fixedHeight = style?.height ?? null;
  const fallbackHeight = fixedHeight || Math.round(carouselWidth / 2.5);
  const [carouselHeight, setCarouselHeight] = useState(fallbackHeight);

  // Auto-size from image dimensions only when no explicit height is given (ad banners)
  useEffect(() => {
    if (fixedHeight) {
      setCarouselHeight(fixedHeight);
      return;
    }
    if (!bannerImages?.length) return;
    const uri = getImageUri(bannerImages[0].image);
    Image.getSize(
      uri,
      (imgW, imgH) => {
        if (imgW > 0 && imgH > 0) {
          setCarouselHeight(Math.round(carouselWidth * (imgH / imgW)));
        }
      },
      () => {},
    );
  }, [bannerImages, carouselWidth, fixedHeight]);

  // Hero banners (fixed height) use 'cover' — fills the container proportionally,
  // cropping edges instead of distorting (T9; was 'stretch')
  // Ad banners (auto height) use 'contain' — shows full image at natural ratio
  const imageResizeMode = resizeMode ?? (fixedHeight ? 'cover' : 'contain');

  const bannerClick = url => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[{width: carouselWidth, height: carouselHeight, overflow: 'hidden'}, style, {height: carouselHeight}]}>
      <Carousel
        loop={bannerImages.length > 1}
        width={carouselWidth}
        height={carouselHeight}
        autoPlay={bannerImages.length > 1}
        data={bannerImages}
        scrollAnimationDuration={3000}
        renderItem={({index}) => {
          const item = bannerImages[index];
          const imageUri = getImageUri(item.image);
          const url = item.redirect_url || item.meta_data?.url;
          return (
            <TouchableOpacity
              style={{width: carouselWidth, height: carouselHeight}}
              activeOpacity={url ? 0.85 : 1}
              onPress={() => bannerClick(url)}>
              <AnimationStyle
                source={{uri: imageUri}}
                style={{width: carouselWidth, height: carouselHeight}}
                resizeMode={imageResizeMode}
                onError={() => {}}
              />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default Banner;
