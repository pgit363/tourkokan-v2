import React from 'react';
import {View} from 'react-native';
import styles from './Styles';
import GlobalText from '../Customs/Text';

const Header = ({startIcon, name, endIcon, style, Component}) => {
  return (
    <View style={[styles.headerMain, style]}>
      {startIcon && <View style={{flex: 1, marginLeft: 7}}>{startIcon}</View>}
      <View style={{flex: 2}}>
        <GlobalText text={name} style={styles.headerText} />
        {Component && Component}
      </View>
      <View style={{flex: 1, alignItems: 'flex-end', marginRight: 7}}>
        {endIcon && endIcon}
      </View>
    </View>
  );
};

export default Header;
