import React from 'react';
import styles from './Styles';
import {TouchableOpacity, View} from 'react-native';
import GlobalText from '../Text';

const TextButton = ({
  title,
  titleStyle,
  isDisabled,
  onPress,
  startIcon,
  endIcon,
  buttonView,
}) => {
  return (
    <TouchableOpacity
      onPress={isDisabled ? null : onPress}
      style={[styles.buttonView, buttonView]}>
      {startIcon}
      {title && (
        <GlobalText text={title} style={[styles.titleStyle, titleStyle]} />
      )}
      {endIcon}
    </TouchableOpacity>
  );
};

export default TextButton;
