import React from 'react';
import {ImageBackground, StatusBar, View} from 'react-native';
import styles from './Styles';
import COLOR from '../../Services/Constants/COLORS';
import GlobalText from '../../Components/Customs/Text';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import {navigateTo} from '../../Services/CommonMethods';
import {useTranslation} from 'react-i18next';

const AuthScreen = ({navigation}) => {
  const {t} = useTranslation();

  const goTo = screen => {
    navigateTo(navigation, screen);
  };

  return (
    <View>
      <StatusBar backgroundColor={COLOR.loginImageBlue} />
      <ImageBackground
        style={styles.loginImage}
        source={require('../../Assets/Images/Intro/login_beach.png')}
      />

      <View style={styles.authScreenView}>
        <View style={styles.loginAppName}>
          <GlobalText text={t('APPNAME')} style={styles.loginName} />
        </View>

        <View>
          <GlobalText text={t('EXPLORE')} style={styles.exploreText} />
          <GlobalText text={t('KOKAN')} style={styles.boldKokan} />
          <GlobalText text={t('COMPANION')} style={styles.textLeft} />
          <TextButton
            title={t('BUTTON.LOGIN')}
            buttonView={styles.loginButton}
            isDisabled={false}
            raised={true}
            onPress={() => goTo(t('SCREEN.EMAIL'))}
          />
          <TextButton
            title={t('BUTTON.SIGNUP')}
            buttonView={styles.signUpButton}
            titleStyle={styles.buttonTitle}
            isDisabled={false}
            raised={true}
            onPress={() => goTo(t('SCREEN.SIGN_UP'))}
          />
        </View>
      </View>
    </View>
  );
};

export default AuthScreen;
