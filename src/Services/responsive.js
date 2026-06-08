/**
 * Responsive helpers — tablet-aware sizing built on useWindowDimensions so it
 * reacts to rotation / split-screen (unlike a Dimensions snapshot taken once at
 * module load).
 *
 * Usage:
 *   const {isTablet, contentWidth, ms} = useResponsive();
 *   fontSize: ms(14)            // grows modestly on tablet
 *   width: isTablet ? 260 : 180 // bigger cards on tablet
 *
 * For StyleSheet defaults that can't call a hook, use the static `moderateScale`.
 */

import {Dimensions, useWindowDimensions} from 'react-native';

// Baseline device width the fixed px values were designed against.
const BASE_WIDTH = 375;

// A device is treated as a tablet when its shortest side is >= this (dp).
export const TABLET_BREAKPOINT = 600;

// Content is centered within this width on large screens so it doesn't stretch
// edge-to-edge awkwardly.
export const MAX_CONTENT_WIDTH = 760;

// Cap the up-scale so tablets don't get absurdly large text/spacing.
const MAX_SCALE = 1.6;

const scaleFor = width => Math.min(width / BASE_WIDTH, MAX_SCALE);

/**
 * moderateScale(size, factor): grows `size` toward the device scale but only by
 * `factor` of the difference (default 0.5 = half), so fonts/spacing get a little
 * bigger on tablets without ballooning.
 */
export const moderateScale = (size, factor = 0.5) => {
  const {width} = Dimensions.get('window');
  const scale = scaleFor(width);
  return Math.round(size + (scale - 1) * size * factor);
};

export const isTabletDevice = () => {
  const {width, height} = Dimensions.get('window');
  return Math.min(width, height) >= TABLET_BREAKPOINT;
};

export const useResponsive = () => {
  const {width, height} = useWindowDimensions();
  const shortest = Math.min(width, height);
  const isTablet = shortest >= TABLET_BREAKPOINT;
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const scale = scaleFor(width);

  const ms = (size, factor = 0.5) =>
    Math.round(size + (scale - 1) * size * factor);

  return {width, height, isTablet, contentWidth, scale, ms};
};

export default useResponsive;
