import React, {useEffect, useRef} from 'react';
import {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  Image,
  StatusBar,
} from 'react-native';
import TextField from '../../Components/Customs/TextField';
import {EmailField} from '../../Services/Constants/FIELDS';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import styles from './Styles';
import {
  comnPost,
  getFromStorage,
  saveToStorage,
} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {
  saveAccess_token,
  setLoader,
  setMode,
} from '../../Reducers/CommonActions';
import Loader from '../../Components/Customs/Loader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLOR from '../../Services/Constants/COLORS';
import {navigateTo} from '../../Services/CommonMethods';
import GlobalText from '../../Components/Customs/Text';
import AnimatedTagline from '../../Components/Common/AnimatedTagline';
// import SQLite from 'react-native-sqlite-storage';
import Popup from '../../Components/Common/Popup';
import Feather from 'react-native-vector-icons/Feather';
import {CommonActions} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {color} from 'react-native-reanimated';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import AntDesign from 'react-native-vector-icons/AntDesign';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {GOOGLE_WEB_CLIENT_ID} from '@env';
import STRING from '../../Services/Constants/STRINGS';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const Email = ({navigation, route, ...props}) => {
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOtp, setIsOtp] = useState(route.params?.isOtp || false);
  const [isPassword, setIsPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleSigningIn = useRef(false);

  GoogleSignin.configure({
    scopes: ['profile', 'email'],
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  const signInWithGoogle = async () => {
    if (googleSigningIn.current) return;
    googleSigningIn.current = true;
    try {
      props.setLoader(true);
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

      let lat = await getFromStorage(t('STORAGE.CURRENT_LATITUDE'));
      let long = await getFromStorage(t('STORAGE.CURRENT_LONGITUDE'));
      let referral_code = await getFromStorage(t('STORAGE.REFERRAL_CODE'));

      const userInfo = await GoogleSignin.signIn();
      console.log('ID TOKEN:', userInfo?.data?.idToken ?? userInfo?.idToken);

      const idToken = userInfo?.data?.idToken ?? userInfo?.idToken;
      if (!idToken) {
        throw new Error('idToken missing from Google sign-in response');
      }

      const payload = {
        token: idToken,
        userName: userInfo?.data?.user?.name ?? userInfo?.user?.name,
        userPhoto: userInfo?.data?.user?.photo ?? userInfo?.user?.photo,
        userEmail: userInfo?.data?.user?.email ?? userInfo?.user?.email,
        referral_code: referral_code,
        latitude: lat === null ? '' : lat.toString(),
        longitude: long === null ? '' : long.toString(),
        language: t('LANG'),
      };

      console.log(payload);
      
      const res = await comnPost('v2/auth/googleAuth', payload);
      const resData = res?.data ?? res?.response?.data;

      if (resData?.success) {
        AsyncStorage.setItem(t('STORAGE.ACCESS_TOKEN'), resData.data.access_token);
        AsyncStorage.setItem(t('STORAGE.USER_ID'), JSON.stringify(resData.data.user.id));
        AsyncStorage.setItem(t('STORAGE.USER_EMAIL'), resData.data.user.email || '');
        AsyncStorage.setItem(t('STORAGE.USER_NAME'), resData.data.user.name || '');
        props.setLoader(false);
        AsyncStorage.setItem(t('STORAGE.IS_FIRST_TIME'), JSON.stringify(true));
        const isGuestValGoogle = !!resData.data.isGuest;
        AsyncStorage.setItem('IS_GUEST', JSON.stringify(isGuestValGoogle));
        saveToStorage(t('STORAGE.MODE'), JSON.stringify(true));
        props.setMode(true);
        navigateTo(navigation, t('SCREEN.HOME'));
      } else {
        setIsAlert(true);
        const raw = resData?.message;
        setAlertMessage((typeof raw === 'object' ? Object.values(raw).flat().join('\n') : raw) || t('ALERT.WENT_WRONG'));
        props.setLoader(false);
      }
    } catch (error) {
      props.setLoader(false);
      if (
        error?.code === statusCodes.SIGN_IN_CANCELLED ||
        error?.code === statusCodes.IN_PROGRESS ||
        error?.code === 'ASYNC_OP_IN_PROGRESS' ||
        error?.code === 12502
      ) {
        return;
      }
      setIsAlert(true);
      setAlertMessage(error?.message || t('ALERT.WENT_WRONG'));
    } finally {
      googleSigningIn.current = false;
    }
  };

  useEffect(() => {
    getAsyncValues();
    const backHandler = BackHandler.addEventListener(
      t('EVENT.HARDWARE_BACK_PRESS'),
      () => ToNavigate(),
    );
    return () => {
      backHandler.remove();
      setIsAlert(false);
      setAlertMessage('');
    };
  }, [props.mode]);

  const getAsyncValues = async () => {
    let language = await getFromStorage(t('STORAGE.LANGUAGE'));
    let mode = await getFromStorage(t('STORAGE.MODE'));
    i18n.changeLanguage(language);
    props.setMode(mode);
  };

  const createUserTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)',
      );
    });
  };

  const createUser = () => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        ['John Doe', 'john@example.com'],
        (tx, results) => {
          if (results.rowsAffected > 0) {
            console.log('Record inserted successfully.');
          } else {
            console.log('Failed to insert record.');
          }
        },
      );
    });
  };

  const getUserData = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM users', [], (tx, results) => {
        const len = results.rows.length;
        for (let i = 0; i < len; i++) {
          const {id, name, email} = results.rows.item(i);
          console.log(`User ${id}: ${name} (${email})`);
        }
      });
    });
  };

  const setValue = (val, isVal, index) => {
    switch (index) {
      case 0:
        setEmail(val.trim());
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
    if (isSuccess) {
      AsyncStorage.setItem(t('STORAGE.IS_FIRST_TIME'), JSON.stringify(true));
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: t('SCREEN.HOME')}],
        }),
      );
    }
    setIsAlert(false);
  };

  const signUpScreen = () => {
    navigateTo(navigation, t('SCREEN.SIGN_UP'));
  };

  const loginWithPassScreen = () => {
    navigateTo(navigation, t('SCREEN.EMAIL_SIGN_IN'));
  };

  const ToNavigate = async () => {
    if (
      (await getFromStorage(t('STORAGE.ACCESS_TOKEN'))) == null ||
      (await getFromStorage(t('STORAGE.ACCESS_TOKEN'))) == ''
    ) {
      BackHandler.exitApp();
    } else {
      navigateTo(navigation, t('SCREEN.HOME'));
    }
  };

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const generateOtp = () => {
    props.setLoader(true);
    if (!validateEmail(email)) {
      setIsAlert(true);
      setAlertMessage(t('ALERT.INVALID_EMAIL'));
      props.setLoader(false);
      return;
    }
    const data = {email};
    comnPost('v2/auth/sendOtp', data)
      .then(res => {
        if (res.data?.success) {
          props.setLoader(false);
          navigateTo(navigation, t('SCREEN.VERIFY_OTP'), {email});
        } else {
          setIsAlert(true);
          setIsSuccess(false);
          setAlertMessage(
            res.data?.message.email
              ? res.data?.message.email
              : res.data?.message
              ? res.data?.message
              : t('NETWORK'),
          );
          props.setLoader(false);
        }
      })
      .catch(err => {
        setIsAlert(true);
        setIsSuccess(false);
        setAlertMessage(t('ALERT.WENT_WRONG'));
        props.setLoader(false);
      });
  };

  const selectPassword = () => {
    navigateTo(navigation, t('SCREEN.PASSWORD_LOGIN'), {email});
  };

  const guestLogin = () => {
    props.setLoader(true);
    const data = {
      is_guest: true,
      name: `Guest_${Math.floor(Math.random() * 100000)}`,
    };

    comnPost('v2/auth/register', data)
      .then(res => {
        if (res.data.success) {
          AsyncStorage.setItem(t('STORAGE.ACCESS_TOKEN'), res.data.data.access_token);
          AsyncStorage.setItem(t('STORAGE.USER_ID'), JSON.stringify(res.data.data.user.id));
          AsyncStorage.setItem(t('STORAGE.USER_EMAIL'), res.data.data.user.email || '');
          AsyncStorage.setItem(t('STORAGE.USER_NAME'), res.data.data.user.name || '');
          const isGuestVal = !!res.data.data.isGuest;
          console.log('[GuestLogin] IS_GUEST =', isGuestVal, '| raw isGuest =', res.data.data.isGuest);
          AsyncStorage.setItem('IS_GUEST', JSON.stringify(isGuestVal));
          props.setLoader(false);
          AsyncStorage.setItem(t('STORAGE.IS_FIRST_TIME'), JSON.stringify(true));
          saveToStorage(t('STORAGE.MODE'), JSON.stringify(true));
          props.setMode(true);
          navigateTo(navigation, t('SCREEN.HOME'));
        } else {
          props.setLoader(false);
          setIsAlert(true);
          setAlertMessage(res.data.message || t('ALERT.WENT_WRONG'));
        }
      })
      .catch(err => {
        props.setLoader(false);
        setIsAlert(true);
        setAlertMessage(t('ALERT.WENT_WRONG'));
      });
  };

  return (
    <View style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <Loader />

      {/* Background image — top half */}
      <Image
        source={require('../../Assets/Images/beach_bg.jpg')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: DIMENSIONS.screenWidth,
          height: DIMENSIONS.screenHeight * 0.52,
        }}
        resizeMode="cover"
      />

      {/* Logo section — top half of screen */}
      <View style={styles.authContentContainer}>
        <View style={styles.logoSection}>
          <Image
            source={require('../../Assets/Images/Logos/tourkokan-logo.png')}
            style={styles.loginLogo}
            resizeMode="contain"
          />
          <AnimatedTagline text="Sun, Sand & Serenity" />
        </View>
      </View>

      {/* White card pinned to bottom */}
      <View style={{
        position: 'absolute',
        top: DIMENSIONS.screenHeight * 0.48,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingBottom: insets.bottom + 32,
      }}>
        {/* gold notch */}
        <View style={{width: 44, height: 5, borderRadius: 3, backgroundColor: '#C4972A', alignSelf: 'center', marginTop: 12, marginBottom: 20}} />

        <View style={styles.loginSection}>
          <GlobalText text="Welcome to Kokan" style={styles.loginTitle} />

          {/* Google Button */}
          <TouchableOpacity
            style={styles.customGoogleBtn}
            onPress={() => signInWithGoogle()}
            activeOpacity={0.8}>
            <View style={{backgroundColor: '#FFFFFF', borderRadius: 50, padding: 5}}>
              <Image
                source={{uri: 'https://developers.google.com/identity/images/g-logo.png'}}
                style={{width: 20, height: 20}}
              />
            </View>
            <GlobalText
              text="Continue with Google"
              style={styles.googleBtnText}
            />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <GlobalText text="OR" style={styles.dividerText} />
            <View style={styles.dividerLine} />
          </View>

          {/* Guest Button */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => guestLogin()}
            activeOpacity={0.8}>
            <Ionicons name="person-outline" size={20} color={COLOR.themeBlue} />
            <GlobalText
              text="Continue as Guest"
              style={styles.guestBtnText}
            />
          </TouchableOpacity>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureBadge}>
              <Ionicons name="map-outline" size={14} color={COLOR.themeBlue} />
              <GlobalText text="Offline Maps" style={styles.featureText} />
            </View>
            <View style={styles.featureBadge}>
              <Ionicons name="bus-outline" size={14} color={COLOR.themeBlue} />
              <GlobalText text="MSRTC Buses" style={styles.featureText} />
            </View>
            <View style={styles.featureBadge}>
              <Ionicons name="image-outline" size={14} color={COLOR.themeBlue} />
              <GlobalText text="Kokan Places" style={styles.featureText} />
            </View>
          </View>
        </View>
      </View>

      <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />
    </View>
  );
};

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    saveAccess_token: data => {
      dispatch(saveAccess_token(data));
    },
    setLoader: data => {
      dispatch(setLoader(data));
    },
    setMode: data => {
      dispatch(setMode(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Email);
