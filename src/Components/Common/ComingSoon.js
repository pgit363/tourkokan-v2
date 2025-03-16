import React from 'react';
import {Overlay} from '@rneui/themed';
import GlobalText from '../Customs/Text';
import styles from './Styles';

const ComingSoon = ({message, visible, toggleOverlay}) => {
  return (
    <Overlay
      style={styles.overlay}
      isVisible={visible}
      onBackdropPress={toggleOverlay}>
      <GlobalText style={styles.overlayMessage} text={message} />
    </Overlay>
  );
};

export default ComingSoon;
