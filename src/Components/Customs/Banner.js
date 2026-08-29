import React, {Component, useState, useEffect, useRef, useCallback} from 'react';
import {View, Animated, Image, TouchableOpacity, useWindowDimensions} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import ProgressImage from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import {Linking} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AWS_URL} from '@env';
import {createLogger} from '../../Services/Logger';
import {
  recordBannerImpression,
  recordBannerClick,
} from '../../Services/Api/BannerServices';

const log = createLogger('Banner');

// The item carries banner_placement_id (a stable seeded FK), not the code
// string the tracking endpoints want. Derive it; the item's own `placement`
// or an explicit prop wins if present.
const PLACEMENT_BY_ID = {
  1: 'HOME_HERO',
  2: 'HOME_MIDDLE',
  3: 'HOME_FOOTER',
  4: 'APP_SPLASH',
  5: 'CITY_MIDDLE',
  6: 'CITY_FOOTER',
  7: 'ROUTE_DETAIL_MIDDLE',
  8: 'ROUTE_DETAIL_FOOTER',
  9: 'ROUTE_LIST_MIDDLE',
  10: 'ROUTE_LIST_FOOTER',
};
const placementOf = (item, override) =>
  override || item?.placement || PLACEMENT_BY_ID[item?.banner_placement_id];

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
      log.warn('⚠️ Image not found (404).');
    } else {
      log.warn('⚠️ Image failed to load:', errorMessage);
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
  !image ? null : image.startsWith('http') ? image : `${AWS_URL}${image}`;

/**
 * How much a creative may be scaled up (and therefore cropped at the sides) to
 * fill a taller slot. 1.25 ≈ at most a fifth of the width lost — past that the
 * banner keeps its own height instead. See the sizing effect in Banner.
 */
const MAX_FILL_UPSCALE = 1.25;

/** Marathi creative when the user is on `mr` and the advertiser supplied one. */
const localisedImage = (item, lang) =>
  (lang === 'mr' && item?.mr_image) || item?.image;

const Banner = ({style, bannerImages, width, resizeMode, placement, minHeight}) => {
  const {width: windowWidth} = useWindowDimensions();
  const {i18n} = useTranslation();
  const lang = i18n.language;
  const carouselWidth = width ?? windowWidth;

  // Impression tracking. The server dedups per banner+placement+session+day, but
  // we also dedup per mounted instance so a looping carousel doesn't spam the
  // network. Fire for the active slide: initial index on mount + each snap.
  const firedRef = useRef(new Set());
  const fireImpression = useCallback(
    index => {
      const item = bannerImages?.[index];
      if (!item?.id) return;
      const key = `${item.id}`;
      if (firedRef.current.has(key)) return;
      firedRef.current.add(key);
      recordBannerImpression(item.id, placementOf(item, placement));
    },
    [bannerImages, placement],
  );

  useEffect(() => {
    firedRef.current.clear();
    if (bannerImages?.length) fireImpression(0);
  }, [bannerImages, fireImpression]);

  const onBannerPress = (item, url) => {
    if (item?.id) recordBannerClick(item.id, placementOf(item, placement)); // before the handoff
    if (url) Linking.openURL(url).catch(() => {});
  };

  // If caller provides an explicit height, honour it and skip auto-sizing.
  // This preserves the original hero-banner behaviour (fixed large height, cover fill).
  const fixedHeight = style?.height ?? null;
  // `minHeight` asks for a taller slot (footer ads). It is a REQUEST, not a hard
  // floor: see the sizing effect — a creative too wide to crop safely keeps its
  // own height so it always fits the box exactly, with no dead space.
  const floor = minHeight || 0;
  const fallbackHeight =
    fixedHeight || Math.max(Math.round(carouselWidth / 2.5), floor);
  const [carouselHeight, setCarouselHeight] = useState(fallbackHeight);
  // true → the artwork fills the box (cover); false → the box fits the artwork.
  const [fillsSlot, setFillsSlot] = useState(false);

  // Auto-size from image dimensions only when no explicit height is given (ad banners)
  useEffect(() => {
    if (fixedHeight) {
      setCarouselHeight(fixedHeight);
      return;
    }
    if (!bannerImages?.length) return;
    const uri = getImageUri(localisedImage(bannerImages[0], lang));
    if (!uri) return;
    Image.getSize(
      uri,
      (imgW, imgH) => {
        if (!(imgW > 0 && imgH > 0)) return;
        const natural = Math.round(carouselWidth * (imgH / imgW));
        // Growing the box to `floor` means cropping the sides to fill it. That is
        // fine for a creative drawn near the slot's ratio, but a very wide strip
        // (say 6:1 in a 3.4:1 slot) would lose ~44% of its width — headline and
        // CTA included. So: fill the slot when the crop is small, otherwise let
        // the box shrink to the artwork. Either way there is never a letterbox.
        if (!floor || natural >= floor) {
          setCarouselHeight(natural);
          setFillsSlot(false);
        } else if (floor / natural <= MAX_FILL_UPSCALE) {
          setCarouselHeight(floor);
          setFillsSlot(true);
        } else {
          setCarouselHeight(natural);
          setFillsSlot(false);
        }
      },
      () => {},
    );
  }, [bannerImages, carouselWidth, fixedHeight, lang, floor]);

  // Hero banners (fixed height) use 'cover' — fills the container proportionally,
  // cropping edges instead of distorting (T9; was 'stretch')
  // Ad banners (auto height) use 'contain' — shows full image at natural ratio
  const imageResizeMode =
    resizeMode ?? (fixedHeight || fillsSlot ? 'cover' : 'contain');

  return (
    <View style={[{width: carouselWidth, height: carouselHeight, overflow: 'hidden'}, style, {height: carouselHeight}]}>
      <Carousel
        loop={bannerImages.length > 1}
        width={carouselWidth}
        height={carouselHeight}
        autoPlay={bannerImages.length > 1}
        data={bannerImages}
        scrollAnimationDuration={3000}
        onSnapToItem={fireImpression}
        renderItem={({index}) => {
          const item = bannerImages[index];
          const imageUri = getImageUri(localisedImage(item, lang));
          const url = item.redirect_url || item.meta_data?.url;
          return (
            <TouchableOpacity
              style={{width: carouselWidth, height: carouselHeight}}
              activeOpacity={url ? 0.85 : 1}
              onPress={() => onBannerPress(item, url)}>
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

/**
 * Requested height for FOOTER ad slots, shared by every screen that renders one
 * so they all present the same box. Creatives drawn near this ratio fill it;
 * much wider ones keep their own height rather than losing content to a crop.
 */
export const footerBannerHeight = width => Math.max(122, Math.round(width / 3.4));

export default Banner;
