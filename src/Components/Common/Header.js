import React from 'react';
import {View} from 'react-native';
import styles from './Styles';
import GlobalText from '../Customs/Text';

const Header = ({startIcon, name, endIcon, style, Component}) => {
  const startIconWrapStyle = {flex: 1, marginLeft: 7};
  const titleWrapStyle = {flex: 2};
  const endIconWrapStyle = {flex: 1, alignItems: 'flex-end', marginRight: 7};

  return (
    <View style={[styles.headerMain, style]}>
      {startIcon && <View style={startIconWrapStyle}>{startIcon}</View>}
      <View style={titleWrapStyle}>
        <GlobalText text={name} style={styles.headerText} />
        {Component && Component}
      </View>
      <View style={endIconWrapStyle}>
        {endIcon && endIcon}
      </View>
    </View>
  );
};

export default Header;
