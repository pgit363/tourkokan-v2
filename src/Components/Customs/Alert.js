import React from 'react';
import {View} from 'react-native';
import styles from './Styles';
import TextButton from './Buttons/TextButton';
import GlobalText from './Text';
import {useTranslation} from 'react-i18next';

const Alert = ({alertMessage, closeAlert, successAlert, proceed}) => {
  const {t} = useTranslation();

  return (
    <View style={styles.alertBackdrop}>
      <View style={styles.alertContainer}>
        <View style={styles.alertMsgView}>
          <GlobalText text={alertMessage} />
        </View>
        <View style={styles.alertButtonView}>
          {successAlert ? (
            <TextButton
              containerStyle={styles.alertContainerStyle}
              buttonStyle={styles.alertButtonStyle}
              title={t('BUTTON.OK')}
              onPress={proceed}
            />
          ) : (
            <TextButton
              containerStyle={styles.alertContainerStyle}
              buttonStyle={styles.alertButtonStyle}
              title={t('BUTTON.OK')}
              onPress={closeAlert}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default Alert;
