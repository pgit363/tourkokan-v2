import React, {Component, useCallback, useMemo} from 'react';
import {View, Animated, TouchableOpacity} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import styles from './Styles';
import ProgressImage from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import {Linking} from 'react-native';
import {FTP_PATH} from '@env';

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

  imageStyle = {width: '100%', height: '100%'};

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
          imageStyle={this.imageStyle}
          onLoad={this.onLoad}
          onError={this.onLoadError}
        />
      </Animated.View>
    );
  }
}

const Banner = ({style, bannerImages}) => {
  const fullSizeStyle = useMemo(() => ({width: '100%', height: '100%'}), []);
  const bannerImageStyle = useMemo(
    () => ({width: '100%', height: '100%', resizeMode: 'stretch'}),
    [],
  );
  const bannerClick = useCallback(imageUri => {
    Linking.openURL(imageUri);
  }, []);

  const renderBannerItem = useCallback(
    ({item}) => {
      const image = item.image;
      const imageUri = image.startsWith('http') ? image : `${FTP_PATH}${image}`;
      const url = item.redirect_url || item.meta_data?.url;

      return (
        <TouchableOpacity
          style={fullSizeStyle}
          onPress={() => (url ? bannerClick(url) : null)}>
          <AnimationStyle
            source={{uri: imageUri}}
            style={[styles.bannerImage, bannerImageStyle]}
          />
        </TouchableOpacity>
      );
    },
    [bannerClick, bannerImageStyle, fullSizeStyle],
  );

  return (
    <View style={[styles.banner, style]}>
      <Carousel
        loop={bannerImages.length > 1}
        width={DIMENSIONS.windowWidth}
        height={style?.height || DIMENSIONS.windowWidth / 2}
        autoPlay={bannerImages.length > 1}
        data={bannerImages}
        scrollAnimationDuration={3000}
        renderItem={renderBannerItem}
      />
    </View>
  );
};

export default React.memo(Banner);
