import React from 'react';
import {View, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';

const RESIZE_MAP = {
  cover: FastImage.resizeMode.cover,
  contain: FastImage.resizeMode.contain,
  stretch: FastImage.resizeMode.stretch,
  center: FastImage.resizeMode.center,
};

const toFastSource = uri => ({
  uri,
  priority: FastImage.priority.normal,
  cache: FastImage.cacheControl.immutable,
});

const CachedImage = ({source, style, resizeMode = 'cover', ...rest}) => {
  const rm = RESIZE_MAP[resizeMode] ?? FastImage.resizeMode.cover;
  const fastSource =
    source && typeof source === 'object' && source.uri
      ? toFastSource(source.uri)
      : source;
  return <FastImage source={fastSource} style={style} resizeMode={rm} {...rest} />;
};

export const CachedImageBackground = ({source, style, imageStyle, children, resizeMode = 'cover', ...rest}) => {
  const rm = RESIZE_MAP[resizeMode] ?? FastImage.resizeMode.cover;
  const fastSource =
    source && typeof source === 'object' && source.uri
      ? toFastSource(source.uri)
      : source;
  return (
    <View style={style}>
      <FastImage
        source={fastSource}
        style={[StyleSheet.absoluteFill, imageStyle]}
        resizeMode={rm}
        {...rest}
      />
      {children}
    </View>
  );
};

export default CachedImage;
