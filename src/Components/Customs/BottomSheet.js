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
        // react-native-raw-bottom-sheet@3 hardcodes
        //   behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // on the KeyboardAvoidingView that wraps the whole sheet (src/index.js:127).
        // 'height' needs the window to resize, and edge-to-edge means it no longer
        // does — so on Android 15+ the sheet stayed put and the keyboard covered
        // any field in it. This overrides that one prop for every bottom sheet in
        // the app. It has to happen HERE: the sheet lives inside the library's own
        // <Modal>, so nothing we wrap the content in can lift the sheet itself.
        customAvoidingViewProps={{behavior: 'padding'}}
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
