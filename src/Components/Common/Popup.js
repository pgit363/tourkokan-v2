import React from 'react';
import {View} from 'react-native';
import {Overlay} from '@rneui/themed';
import GlobalText from '../Customs/Text';
import styles from './Styles';
import TextButton from '../Customs/Buttons/TextButton';
import {useTranslation} from 'react-i18next';

const Popup = ({
  message,
  visible,
  toggleOverlay,
  onPress,
  Component,
  noButton,
}) => {
  const {t} = useTranslation();
  let isOpen = visible;

  const closePopup = () => {
    isOpen = false;
    onPress();
  };

  return (
    <Overlay
      style={styles.overlay}
      isVisible={isOpen}
      onBackdropPress={toggleOverlay}>
      <View style={styles.popupView}>
        <GlobalText style={styles.overlayMessage} text={message} />
        {Component}
      </View>
      {!noButton && (
        <TextButton
          title={t('BUTTON.OK')}
          containerStyle={styles.editButtonContainer}
          buttonStyle={styles.planButtonStyle}
          titleStyle={styles.planButtonTitleStyle}
          raised={true}
          onPress={closePopup}
        />
      )}
    </Overlay>
  );
};

export default Popup;
