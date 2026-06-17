import React from 'react';
import {Text, StyleSheet} from 'react-native';
import styles from './Styles';
import {useResponsive} from '../../Services/responsive';

/**
 * GlobalText — app-wide text wrapper.
 *
 * Tablet font scaling: fixed-px sizes (≤18) that were designed against phone
 * widths get a moderate bump via ms(). Width-derived sizes (DIMENSIONS.textSize
 * etc. are already > 18 on tablets) are left alone to avoid double-scaling.
 * Phones are untouched.
 */
const GlobalText = ({text, style}) => {
  const {isTablet, ms} = useResponsive();

  let finalStyle = [styles.text, style];
  if (isTablet) {
    const flat = StyleSheet.flatten(finalStyle) || {};
    const size = flat.fontSize;
    if (size && size <= 18) {
      finalStyle = [styles.text, style, {fontSize: ms(size)}];
    }
  }

  return <Text style={finalStyle}>{text}</Text>;
};

export default GlobalText;
