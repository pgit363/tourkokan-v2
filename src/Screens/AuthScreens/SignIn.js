import React, {useEffect} from 'react';
import {useState} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  BackHandler,
  Image,
  ImageBackground,
} from 'react-native';
import TextField from '../../Components/Customs/TextField';
import {MobileNo} from '../../Services/Constants/FIELDS';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import styles from './Styles';
import {comnPost} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {setLoader as setLoaderAction} from '../../Reducers/CommonActions';
import Loader from '../../Components/Customs/Loader';
import {exitApp, navigateTo} from '../../Services/CommonMethods';
import GlobalText from '../../Components/Customs/Text';
import Popup from '../../Components/Common/Popup';
import AppLogo from '../../Assets/Images/Logos/tourkokan-logo.png';
import {useTranslation} from 'react-i18next';

const SignIn = ({navigation, setLoader}) => {
  const {t} = useTranslation();

  const [mobile, setMobile] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      t('EVENT.HARDWARE_BACK_PRESS'),
      () => exitApp(),
    );
    return () => {
      backHandler.remove();
      setIsAlert(false);
      setAlertMessage('');
    };
  }, [t]);

  const setValue = (val, isVal, index) => {
    switch (index) {
      case 0:
        setMobile(val);
        break;
    }
  };

  const getValue = i => {
    switch (i) {
      case 0:
        return mobile;
    }
  };

  const sendOTP = () => {
    setLoader(true);
    const data = {
      mobile,
    };
    comnPost('v2/auth/sendOtp', data)
      .then(res => {
        if (res.data.success) {
          setIsAlert(true);
          setAlertMessage(res.data.message);
          setLoader(false);
        } else {
          if (res.data.message.mobile) {
            setIsAlert(true);
            setAlertMessage(res.data.message.mobile[0]);
            setLoader(false);
          }
        }
      })
      .catch(() => {
        setLoader(false);
        setIsAlert(true);
        setAlertMessage(t('ALERT.WENT_WRONG'));
      });
  };

  const closePopup = () => {
    setIsAlert(false);
  };

  const signUpScreen = () => {
    navigateTo(navigation, t('SCREEN.SIGN_UP'));
  };

  const emailLogin = () => {
    navigateTo(navigation, t('SCREEN.EMAIL'));
  };

  return (
    <View style={localStyles.container}>
      <ImageBackground
        style={styles.loginImage}
        source={require('../../Assets/Images/kokan1.jpeg')}
      />
      {/* <Header
        name={""}
        startIcon={<View></View>}
        style={styles.loginHeader}
      /> */}

      <View style={styles.appName}>
        <Image source={AppLogo} style={styles.appLogo} />
      </View>

      <Loader />
      <View style={styles.loginContentsBox}>
        <GlobalText text={t('LOG_IN')} style={styles.loginText} />
        {MobileNo.map((field, index) => {
          return (
            <TextField
              name={field.name}
              label={field.name}
              placeholder={field.placeholder}
              fieldType={field.type}
              length={field.length}
              required={field.required}
              disabled={field.disabled}
              value={getValue(index)}
              setChild={(v, i) => setValue(v, i, index)}
              style={styles.containerStyle}
              inputContainerStyle={styles.inputContainerStyle}
            />
          );
        })}
        <TextButton
          title={t('BUTTON.SEND_OTP')}
          buttonView={styles.buttonView}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.buttonStyle}
          titleStyle={styles.buttonTitle}
          disabled={false}
          raised={true}
          onPress={() => sendOTP()}
        />

        <View style={localStyles.altLoginWrap}>
          <GlobalText text={t('OR')} style={styles.whiteText} />
          <TextButton
            title={t('BUTTON.LOGIN_WITH_EMAIL')}
            buttonView={styles.buttonView}
            containerStyle={styles.buttonContainer}
            buttonStyle={styles.buttonStyle}
            titleStyle={styles.buttonTitle}
            disabled={false}
            raised={true}
            onPress={() => emailLogin()}
          />
        </View>

        <View style={styles.haveAcc}>
          <GlobalText style={styles.whiteText} text={t('DONT_HAVE_ACC')} />
          <TouchableOpacity onPress={() => signUpScreen()}>
            <GlobalText style={styles.whiteText} text={t('SIGN_UP')} />
          </TouchableOpacity>
        </View>
        <Popup message={alertMessage} visible={isAlert} onPress={closePopup} />
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  altLoginWrap: {
    marginTop: 20,
    alignItems: 'center',
  },
});

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoaderAction(data));
    },
  };
};

export default connect(null, mapDispatchToProps)(SignIn);
