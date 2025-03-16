import React from 'react';
import {TouchableOpacity} from 'react-native';
import styles from './Styles';
import {Image} from '@rneui/base';
import GlobalText from '../Text';
import Path from '../../../Services/Api/BaseUrl';
import {FTP_PATH} from '@env';

const ImageButton = ({
  image,
  onPress,
  buttonStyle,
  text,
  isSelected,
  imageButtonCircle,
  buttonIcon,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        buttonStyle,
        styles.imageButtonContainer,
        isSelected && styles.selectedButton,
      ]}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.imageButtonCircle,
          isSelected && styles.selectedCircle,
          imageButtonCircle,
        ]}>
        <Image
          source={{uri: FTP_PATH + image}}
          style={[styles.catCardIcon, buttonIcon]}
        />
      </TouchableOpacity>
      <GlobalText text={text} style={isSelected && styles.selectedText} />
    </TouchableOpacity>
  );
};

export default ImageButton;
