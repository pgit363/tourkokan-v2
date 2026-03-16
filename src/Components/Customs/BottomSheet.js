import React from 'react';
import {View} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import COLOR from '../../Services/Constants/COLORS';

const BottomSheet = ({
  refRBSheet,
  height,
  Component,
  openLocationSheet,
  closeLocationSheet,
}) => {
  return (
    <View>
      <RBSheet
        ref={refRBSheet}
        height={height}
        openDuration={250}
        draggable
        draggableIcon
        closeOnPressMask
        customStyles={{
          wrapper: {backgroundColor: 'transparent'},
          draggableIcon: {backgroundColor: COLOR.themeBlue},
        }}>
        {Component}
      </RBSheet>
    </View>
  );
};

export default BottomSheet;
