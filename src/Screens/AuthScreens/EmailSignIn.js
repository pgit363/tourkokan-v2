import React, {useEffect} from 'react';
import {useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  BackHandler,
  ImageBackground,
  KeyboardAvoidingView,
} from 'react-native';
import TextField from '../../Components/Customs/TextField';
import {SignInFields} from '../../Services/Constants/FIELDS';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import styles from './Styles';
import {
  comnPost,
  saveToStorage,
} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {
  saveAccess_token as saveAccessTokenAction,
  setLoader as setLoaderAction,
  setMode as setModeAction,
} from '../../Reducers/CommonActions';
import Loader from '../../Components/Customs/Loader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLOR from '../../Services/Constants/COLORS';
import {navigateTo} from '../../Services/CommonMethods';
import GlobalText from '../../Components/Customs/Text';
import Popup from '../../Components/Common/Popup';
import Feather from 'react-native-vector-icons/Feather';
import {useTranslation} from 'react-i18next';

const EmailSignIn = ({navigation, setLoader, setMode}) => {
  const {t} = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      t('EVENT.HARDWARE_BACK_PRESS'),
      () => navigateTo(navigation, t('SCREEN.EMAIL')),
    );
    return () => {
      backHandler.remove();
      setIsAlert(false);
      setAlertMessage('');
    };
  }, [navigation, t]);

  const setValue = (val, isVal, index) => {
    switch (index) {
      case 0:
        setEmail(val.trim());
        break;
      case 1:
        setPassword(val);
        break;
    }
    setIsButtonDisabled(false);
  };

  const getValue = i => {
    switch (i) {
      case 0:
        return email;
      case 1:
        return password;
    }
  };

  const closePopup = () => {
    setIsAlert(false);
  };

  const signUpScreen = () => {
    navigateTo(navigation, t('SCREEN.SIGN_UP'));
  };

  const validateEmail = value => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePassword = value => {
    return value.length >= 6;
  };

  const login = () => {
    setLoader(true);

    if (!validateEmail(email)) {
      setIsAlert(true);
      setAlertMessage(t('ALERT.INVALID_EMAIL'));
      setLoader(false);
      return;
    }

    if (!validatePassword(password)) {
      setIsAlert(true);
      setAlertMessage(t('ALERT.INVALID_PASSWORD'));
      setLoader(false);
      return;
    }

    const data = {
      email,
      password,
    };
    comnPost('v2/auth/login', data)
      .then(res => {
        if (res.data.success) {
          AsyncStorage.setItem(
            t('STORAGE.ACCESS_TOKEN'),
            res.data.data.access_token,
          );
          AsyncStorage.setItem(
            t('STORAGE.USER_ID'),
            JSON.stringify(res.data.data.user.id),
          );
          setLoader(false);
          AsyncStorage.setItem(
            t('STORAGE.IS_FIRST_TIME'),
            JSON.stringify(true),
          );
          saveToStorage(t('STORAGE.MODE'), JSON.stringify(true));
          setMode(true);
          navigateTo(navigation, t('SCREEN.HOME'));
        } else {
          setIsAlert(true);
          setAlertMessage(
            res.data.message.email
              ? res.data.message.email
              : res.data.message.password
              ? res.data.message.password
              : res.data.message,
          );
          setLoader(false);
        }
      })
      .catch(() => {
        setIsAlert(true);
        setAlertMessage(t('ALERT.WENT_WRONG'));
        setLoader(false);
      });
  };

  return (
    <View style={localStyles.container}>
      <ImageBackground
        style={styles.loginImage}
        source={require('../../Assets/Images/Intro/login_background.png')}
      />
      {/* <Header
        name={""}
        startIcon={<View></View>}
        style={styles.loginHeader}
      /> */}

      <View>
        <Loader />
        <GlobalText text={t('WELCOME')} style={styles.welcomeText} />
        <GlobalText text={t('APPNAME')} style={styles.boldKokan} />
      </View>

      <View style={styles.middleFlex}>
        <GlobalText text={t('LOG_IN')} style={styles.loginText} />
        {SignInFields.map((field, index) => {
          return (
            <TextField
              name={field.name}
              label={field.name}
              placeholder={field.placeholder}
              fieldType={field.type}
              length={field.length}
              required={field.required}
              disabled={false}
              value={getValue(index)}
              setChild={(v, i) => setValue(v, i, index)}
              style={styles.containerStyle}
              inputContainerStyle={styles.inputContainerStyle}
              isSecure={
                field.type === `${t('TYPE.PASSWORD')}`
                  ? !showPassword
                  : field.isSecure
              }
              rightIcon={
                field.type === `${t('TYPE.PASSWORD')}` && (
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={COLOR.themeBlue}
                    onPress={() => {
                      setShowPassword(!showPassword);
                    }}
                    style={styles.eyeIcon}
                  />
                )
              }
            />
          );
        })}
        <TouchableOpacity
          onPress={() => navigateTo(navigation, t('SCREEN.EMAIL'))}>
          <GlobalText
            text={t('BUTTON.LOGIN_WITH_OTP')}
            style={styles.loginSubText}
          />
        </TouchableOpacity>
        <View style={localStyles.loginButtonWrap}>
          <TextButton
            title={t('BUTTON.LOGIN')}
            buttonView={styles.buttonView}
            isDisabled={isButtonDisabled}
            raised={true}
            onPress={() => login()}
          />
        </View>
        <View style={styles.haveAcc}>
          <GlobalText text={t('DONT_HAVE_ACC')} />
          <TouchableOpacity onPress={() => signUpScreen()}>
            <GlobalText text={t('SIGN_UP')} style={styles.blueBold} />
          </TouchableOpacity>
        </View>
      </View>
      <KeyboardAvoidingView behavior="height" style={localStyles.keyboardSpacer} />
      <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.white,
  },
  loginButtonWrap: {
    alignItems: 'center',
  },
  keyboardSpacer: {
    flex: 1,
  },
});

const mapDispatchToProps = dispatch => {
  return {
    saveAccess_token: data => dispatch(saveAccessTokenAction(data)),
    setLoader: data => dispatch(setLoaderAction(data)),
    setMode: data => dispatch(setModeAction(data)),
  };
};

export default connect(null, mapDispatchToProps)(EmailSignIn);
