import React, {useEffect, useRef} from 'react';
import {useState} from 'react';
import {
  View,
  TouchableOpacity,
  BackHandler,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import styles from './Styles';
import {comnPost, saveToStorage} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {
  saveAccess_token,
  setLoader,
  setMode,
} from '../../Reducers/CommonActions';
import Loader from '../../Components/Customs/Loader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import {backPage, navigateTo} from '../../Services/CommonMethods';
import GlobalText from '../../Components/Customs/Text';
import Popup from '../../Components/Common/Popup';
import {useTranslation} from 'react-i18next';
import {CommonActions} from '@react-navigation/native';

const VerifyOTP = ({navigation, route, ...props}) => {
  const {t} = useTranslation();

  const [otp, setOtp] = useState(null);
  const [email, setEmail] = useState(route.params?.email);
  const [sec, setSec] = useState(30);
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const ref = useRef(null);

  useEffect(() => {
    // const backHandler = BackHandler.addEventListener(
    //   'hardwareBackPress', // This should be the event name
    //   () => {
    //     backPage(navigation);
    //     return true; // This is important to prevent the default back action
    //   },
    // );

    return () => {
      // if (backHandler && typeof backHandler.remove === 'function') {
      //   backHandler.remove(); // Check if remove is a function before calling it
      // }
      setIsAlert(false);
      setAlertMessage('');
    };
  }, [navigation, t]);

  useEffect(() => {
    let timerInterval;
    if (sec > 0) {
      timerInterval = setInterval(() => {
        setSec(prevSec => prevSec - 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [sec]);

  const loginClick = () => {
    props.setLoader(true);
    const data = {email, otp};

    comnPost('v2/auth/verifyOtp', data)
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
          // props.saveAccess_token(res.data.data.access_token);
          props.setLoader(false);
          AsyncStorage.setItem(
            t('STORAGE.IS_FIRST_TIME'),
            JSON.stringify(true),
          );
          saveToStorage(t('STORAGE.MODE'), JSON.stringify(true));
          props.setMode(true);
          navigateTo(navigation, t('SCREEN.HOME'));
          // navigation.dispatch(
          //   CommonActions.reset({
          //     index: 0,
          //     routes: [{name: t('SCREEN.HOME')}],
          //   }),
          // );
        } else {
          setIsAlert(true);
          setAlertMessage(res.data.message?.otp || res.data.message);
          props.setLoader(false);
        }
      })
      .catch(() => {
        setIsAlert(true);
        setAlertMessage(t('ALERT.WENT_WRONG'));
        props.setLoader(false);
      });
  };

  const closePopup = () => setIsAlert(false);

  const resend = () => {
    props.setLoader(true);
    const data = {email};
    setOtp(null);
    comnPost('v2/auth/sendOtp', data)
      .then(() => {
        props.setLoader(false);
        setSec(30);
      })
      .catch(() => props.setLoader(false));
  };

  return (
    <View style={{flex: 1, backgroundColor: COLOR.white}}>
      <ImageBackground
        style={styles.loginImage}
        source={require('../../Assets/Images/Intro/login_background.png')}
      />
      <View>
        <Loader />
        <GlobalText text={t('WELCOME')} style={styles.welcomeText} />
        <GlobalText text={t('APPNAME')} style={styles.boldKokan} />
      </View>

      <View style={styles.middleFlex}>
        <View>
          <GlobalText text={t('LOG_IN')} style={styles.loginText} />
          <CodeField
            style={{flexDirection: 'row', alignSelf: 'center'}}
            ref={ref}
            value={otp}
            onChangeText={setOtp}
            cellCount={6}
            rootStyle={styles.codeFieldRoot}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete={Platform.select({
              android: 'sms-otp',
              default: 'one-time-code',
            })}
            testID="my-code-input"
            renderCell={({index, symbol, isFocused}) => (
              <Text
                key={index}
                style={[styles.cell, isFocused && styles.focusCell]}>
                {symbol || (isFocused ? <Cursor /> : null)}
              </Text>
            )}
          />
        </View>
        <TextButton
          title={t('BUTTON.LOGIN')}
          disabled={false}
          raised={true}
          onPress={loginClick}
        />
        <View style={styles.haveAcc}>
          {sec >= 1 ? (
            <GlobalText
              text={`${t('RESEND_WITHIN').replace(
                '_',
                sec > 9 ? sec : '0' + sec,
              )}`}
            />
          ) : (
            <View style={{flexDirection: 'row'}}>
              <GlobalText text={t('DIDNT_RECEIVE')} />
              <TouchableOpacity onPress={resend}>
                <GlobalText text={t('RESEND')} style={styles.sendOTPText} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <KeyboardAvoidingView behavior="height" style={{flex: 1}} />
      <Popup message={alertMessage} visible={isAlert} onPress={closePopup} />
    </View>
  );
};

const mapStateToProps = state => ({
  access_token: state.commonState.access_token,
  loader: state.commonState.loader,
});

const mapDispatchToProps = dispatch => ({
  saveAccess_token: data => dispatch(saveAccess_token(data)),
  setLoader: data => dispatch(setLoader(data)),
  setMode: data => dispatch(setMode(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(VerifyOTP);
