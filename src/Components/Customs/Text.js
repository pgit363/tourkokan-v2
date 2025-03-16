import React from 'react';
import {Text} from 'react-native';
import styles from './Styles';

const GlobalText = ({text, style}) => {
  return <Text style={[styles.text, style]}>{text}</Text>;
};

export default GlobalText;
