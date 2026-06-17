import React from 'react';
import {Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * Fallback shown when a record has no image. Brand ocean gradient + a centered
 * icon, sized to whatever container style you pass. Stays visible against white
 * cards — unlike the plain no-image.png, which was white-on-white and, with
 * resizeMode "cover", blew its small glyph up and shoved it into a corner.
 *
 *   <ImagePlaceholder style={s.cardImg} icon="image-outline" iconSize={40} />
 *   <ImagePlaceholder style={s.heroImage} icon="calendar-outline" iconSize={64} showLabel />
 */
const ImagePlaceholder = ({style, icon = 'image-outline', iconSize = 44, showLabel = false}) => (
  <LinearGradient
    colors={['#1B6B7B', '#0D3D4A']}
    start={{x: 0, y: 0}}
    end={{x: 1, y: 1}}
    style={[styles.base, style]}>
    <Ionicons name={icon} size={iconSize} color="rgba(255,255,255,0.55)" />
    {showLabel ? <Text style={styles.label}>No image available</Text> : null}
  </LinearGradient>
);

const styles = StyleSheet.create({
  base: {alignItems: 'center', justifyContent: 'center', gap: 8},
  label: {fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)'},
});

export default ImagePlaceholder;
