import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  BackHandler,
  ImageBackground,
  Animated,
  PermissionsAndroid,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {SignUpFields} from '../../Services/Constants/FIELDS';
import TextField from '../../Components/Customs/TextField';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import styles from './Styles';
import {comnGet, comnPost} from '../../Services/Api/CommonServices';
import Loader from '../../Components/Customs/Loader';
import {connect} from 'react-redux';
import {setLoader, saveAccess_token} from '../../Reducers/CommonActions';
import {navigateTo} from '../../Services/CommonMethods';
import {launchImageLibrary} from 'react-native-image-picker';
import GlobalText from '../../Components/Customs/Text';
import COLOR from '../../Services/Constants/COLORS';
import Popup from '../../Components/Common/Popup';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import Feather from 'react-native-vector-icons/Feather';
import Geolocation from '@react-native-community/geolocation';
import {Dropdown} from 'react-native-element-dropdown';
import {useTranslation} from 'react-i18next';
import {CheckBox} from '@rneui/themed';
import PrivacyPolicy from '../../Components/Common/PrivacyPolicy';
import DeviceInfo from 'react-native-device-info';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {GOOGLE_WEB_CLIENT_ID, API_PATH} from '@env';

const SignUp = ({navigation, ...props}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const {t, i18n} = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [referral, setReferral] = useState('');
  const [password, setPassword] = useState('');
  const [cpassword, setCpassword] = useState('');
  const [role, setRole] = useState('');
  const [roles, setRoles] = useState([]);
  const [otp, setOtp] = useState([]);
  const [errMsg, setErrorMsg] = useState('');
  const [imageSource, setImageSource] = useState(null);
  const [uploadImage, setUploadImage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [latitude, setCurrentLatitude] = useState(null);
  const [longitude, setCurrentLongitude] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [watchID, setWatchID] = useState('');
  const [sec, setSec] = useState(30);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [nameErr, setNameErr] = useState(false);
  const [emailErr, setEmailErr] = useState(false);
  const [refErr, setRefErr] = useState(false);
  const [mobileErr, setMobileErr] = useState(false);
  const [passErr, setPassErr] = useState(false);
  const [cPassErr, setCPassErr] = useState(false);
  const [notValid, setNotValid] = useState(false);
  const [noPrivacy, setNoPrivacy] = useState(false);
  const [fetchingText, setFetchingText] = useState('');
  const [list, setList] = useState([
    {label: 'English', value: 'en'},
    {label: 'मराठी', value: 'mr'},
  ]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      // Send userInfo.idToken to your Laravel backend
      const response = await fetch(API_PATH + 'v2/auth/googleAuth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({token: userInfo.idToken}),
      });

      // Handle authentication response
      const result = await response.json();
      // Store result token if successful
    } catch (error) {
      console.error('error- - ', error);
    }
  };

  const openLocationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:root=LOCATION_SERVICES'); // iOS location settings
    } else {
      Linking.openSettings(); // Android general settings (location can be found here)
    }
  };

  useEffect(() => {
    let valid = true;
    let errorMessage = '';

    // Inner async function to handle async logic
    const checkLocationAndSetupListeners = async () => {
      const locationEnabled = await checkLocationServices();

      // If location services are disabled, show an alert
      if (!locationEnabled) {
        errorMessage = t('ALERT.LOCATION_SERVICES_DISABLED');
        valid = false;
      }

      if (!valid) {
        // Prompt the user to enable location services
        Alert.alert(
          t('ALERT.LOCATION_REQUIRED'), // Title of the alert
          t('ALERT.ENABLE_LOCATION_SERVICES'), // Message to user
          [
            // { text: t('ALERT.CANCEL'), style: 'cancel' }, // Cancel option
            {
              text: t('ALERT.OPEN_SETTINGS'),
              onPress: () => openLocationSettings(), // Open location settings
            },
          ],
        );

        setAlertMessage(errorMessage);
        setIsAlert(true);
        setShowPrivacy(false);
      }
    };

    // Call the async function
    checkLocationAndSetupListeners();

    // Set up event listeners for hardware back button and keyboard visibility
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigateTo(navigation, t('SCREEN.EMAIL'));
        return true; // Return true to prevent default behavior
      },
    );

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    // Cleanup function to remove listeners when the component unmounts
    return () => {
      backHandler.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [navigation, t]);

  useEffect(() => {
    const animateRipple = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start(animateRipple);
    };

    animateRipple();

    return () => {
      // Cleanup on component unmount
      Animated.timing(opacity).stop();
    };
  }, [opacity]);

  const getRoles = () => {
    comnGet('v2/roleDD')
      .then(res => {
        if (res.data.success) {
          props.setLoader(false);
          setRoles(res.data.data);
        } else {
          props.setLoader(false);
        }
      })
      .catch(err => {
        props.setLoader(false);
      });
  };

  const setValue = (val, isVal, index) => {
    switch (index) {
      case 0:
        setName(val);
        if (isVal) setNameErr(false);
        else setNameErr(true);
        break;
      case 1:
        setEmail(val.trim());
        if (isVal) setEmailErr(false);
        else setEmailErr(true);
        break;
      case 2:
        setMobile(val);
        if (isVal) setMobileErr(false);
        else setMobileErr(true);
        break;
      case 3:
        setReferral(val.trim());
        if (isVal) setRefErr(false);
        else setRefErr(true);
        break;
      default:
        setRole(val);
        break;
    }
  };

  const getValue = i => {
    switch (i) {
      case 0:
        return name;
      case 1:
        return email;
      case 2:
        return mobile;
      case 3:
        return referral;
      default:
        return role;
    }
  };

  const handleImageUpload = () => {
    launchImageLibrary(
      {
        mediaType: `${t('TYPE.PHOTO')}`,
        includeBase64: true,
        maxHeight: 200,
        maxWidth: 200,
      },
      response => {
        if (response.assets) {
          // Upload the image to the API
          setUploadImage(
            `data:${response.assets[0].type};base64,${response.assets[0].base64}`,
          );
          setImageSource(response.assets[0].uri);
        }
      },
    );
  };

  const checkValidation = () => {
    let valid = true;
    let errorMessage = '';

    // Validate name
    if (name.trim() === '') {
      errorMessage = t('ALERT.PLEASE_ENTER_NAME');
      valid = false;
    } else if (email.trim() === '' || !validateEmail(email)) {
      errorMessage = t('ALERT.PLEASE_ENTER_VALID_EMAIL');
      valid = false;
    } else if (mobile.trim() !== '' && !validateMobile(mobile)) {
      // Only validate mobile if it has a value
      errorMessage = t('ALERT.PLEASE_ENTER_VALID_MOBILE');
      valid = false;
    } else if (referral.trim() !== '' && !validateReferral(referral)) {
      // Only validate referral if it has a value
      errorMessage = t('ALERT.PLEASE_ENTER_VALID_REFERRAL');
      valid = false;
    } else if (latitude === null || longitude === null) {
      errorMessage = t('ALERT.PLEASE_ENABLE_LOCATION'); // New validation message
      valid = false;
    } else if (!isPrivacyChecked) {
      errorMessage = t('ALERT.PLEASE_ACCEPT_PRIVACY');
      valid = false;
    }

    if (!valid) {
      setAlertMessage(errorMessage);
      setIsAlert(true);
      setShowPrivacy(false);
    } else {
      setIsAlert(false);
      setShowPrivacy(false);
      setAlertMessage('');
      setNotValid(false);
      Register(latitude, longitude);
    }
  };

  const validateEmail = email => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validateMobile = mobile => {
    // Adjust the regex as per your mobile number requirements
    const re = /^[0-9]{10}$/;
    return re.test(String(mobile));
  };

  const Register = (lat, long) => {
    props.setLoader(true);

    const data = {
      name: name,
      email: email,
      mobile: mobile,
      referral_code: referral,
      // password: password,
      // password_confirmation: cpassword,
      // role_id: role.id,
      profile_picture: uploadImage,
      latitude: lat.toString(),
      longitude: long.toString(),
      language: t('LANG'),
    };
    comnPost('v2/auth/register', data)
      .then(res => {
        if (res.data.success) {
          props.setLoader(false);
          setIsSuccess(true);
          setIsAlert(true);
          setAlertMessage(res.data.message);
        } else {
          props.setLoader(false);
          setAlertMessage(
            res.data.message.email
              ? res.data.message.email
              : res.data.message.mobile
              ? res.data.message.mobile
              : res.data.message.referral_code
              ? res.data.message.referral_code
              : res.data.message
              ? res.data.message
              : t('NETWORK'),
          );
          setIsSuccess(false);
          setIsAlert(true);
        }
      })
      .catch(err => {
        props.setLoader(false);
        setIsAlert(true);
        setIsSuccess(false);
        setAlertMessage(t('ALERT.WENT_WRONG'));
      });
  };

  const signInScreen = () => {
    navigateTo(navigation, t('SCREEN.EMAIL'));
  };

  const closePopup = () => {
    if (
      (alertMessage &&
        alertMessage[0] &&
        alertMessage[0].includes(t('TAKEN'))) ||
      isSuccess
    ) {
      props.setLoader(true);
      const data = {
        email,
      };
      comnPost('v2/auth/sendOtp', data)
        .then(res => {
          if (res.data?.success) {
            props.setLoader(false);
            navigateTo(navigation, t('SCREEN.VERIFY_OTP'), {
              email,
            });
          }
        })
        .catch(err => {});
    }
    setIsAlert(false);
    setAlertMessage(''); // Reset the alert message here
  };

  const checkLocationServices = async () => {
    const enabled = await DeviceInfo.isLocationEnabled();
    setIsLocationEnabled(enabled);
    return enabled;
  };

  const myLocationPress = async () => {
    props.setLoader(true);

    let valid = true;
    let errorMessage = '';

    // Inner async function to handle async logic
    const checkLocationAndSetupListeners = async () => {
      const locationEnabled = await checkLocationServices();

      // If location services are disabled, show an alert
      if (!locationEnabled) {
        errorMessage = t('ALERT.LOCATION_SERVICES_DISABLED');
        valid = false;
      }

      if (!valid) {
        // Prompt the user to enable location services
        Alert.alert(
          t('ALERT.LOCATION_REQUIRED'), // Title of the alert
          t('ALERT.ENABLE_LOCATION_SERVICES'), // Message to user
          [
            // { text: t('ALERT.CANCEL'), style: 'cancel' }, // Cancel option
            {
              text: t('ALERT.OPEN_SETTINGS'),
              onPress: () => openLocationSettings(), // Open location settings
            },
          ],
        );

        setAlertMessage(errorMessage);
        setIsAlert(true);
        setShowPrivacy(false);
      }
    };

    // Call the async function
    checkLocationAndSetupListeners();

    if (Platform.OS === 'ios') {
      getOneTimeLocation();
      subscribeLocation();
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('LOCATION_ACCESS_REQUIRED'),
            message: t('NEEDS_TO_ACCESS'),
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // To Check, If Permission is granted
          getOneTimeLocation();
          subscribeLocation();
        } else {
          setLocationStatus(t('PERMISSION_DENIED'));
          props.setLoader(false);
        }
      } catch (err) {
        console.warn(err);
        props.setLoader(false);
      }
    }
  };

  const getOneTimeLocation = () => {
    props.setLoader(true);
    setFetchingText(t('ALERT.FETCHING_TEXT'));
    setLocationStatus(t('GETTING_LOCATION'));
    Geolocation.getCurrentPosition(
      position => {
        setLocationStatus(t('YOU_ARE_HERE'));
        const currentLatitude = position.coords.latitude;
        const currentLongitude = position.coords.longitude;
        setCurrentLatitude(currentLatitude);
        setCurrentLongitude(currentLongitude);
        setShowPrivacy(false);
        setFetchingText('');
      },
      error => {
        setLocationStatus(error.message);
        props.setLoader(false);
      },
      {enableHighAccuracy: false, timeout: 30000, maximumAge: 1000},
    );
  };

  const subscribeLocation = () => {
    let WatchID = Geolocation.watchPosition(
      position => {
        setLocationStatus(t('YOU_ARE_HERE'));
        const currentLatitude = position.coords.latitude;
        const currentLongitude = position.coords.longitude;
        setCurrentLatitude(currentLatitude);
        setCurrentLongitude(currentLongitude);
        props.setLoader(false);
      },
      error => {
        setLocationStatus(error.message);
        props.setLoader(false);
      },
      {enableHighAccuracy: false, maximumAge: 1000},
    );
    setWatchID(WatchID);
  };

  const privacyClicked = () => {
    if (isPrivacyChecked) {
      setIsPrivacyChecked(!isPrivacyChecked);
    } else {
      setShowPrivacy(true);
      setIsAlert(true);
      setAlertMessage(t('PRIVACY_POLICY'));
    }
  };

  const acceptClick = () => {
    setIsPrivacyChecked(!isPrivacyChecked);
    closePopup();
  };

  return (
    <View style={{flex: 1, backgroundColor: COLOR.white}}>
      <ImageBackground
        style={styles.loginImage}
        source={require('../../Assets/Images/Intro/login_background.png')}
      />

      <View style={{display: isKeyboardVisible ? 'none' : 'flex'}}>
        <Loader text={fetchingText} />
        <GlobalText text={t('WELCOME')} style={styles.welcomeText} />
        <GlobalText text={t('APPNAME')} style={styles.boldKokan} />
      </View>

      <ScrollView>
        <GlobalText text={t('SIGN_UP')} style={styles.loginText} />
        <View style={{alignItems: 'center'}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              width: '100%',
            }}></View>

          {SignUpFields.map((field, index) => {
            return (
              <TextField
                key={index}
                name={field.name}
                label={field.name}
                leftIcon={
                  <Feather
                    name={field.leftIcon}
                    size={24}
                    style={styles.leftIcon}
                  />
                }
                placeholder={field.placeholder}
                fieldType={field.type}
                length={field.length}
                required={field.required}
                disabled={field.disabled}
                value={getValue(index)}
                setChild={(v, i) => setValue(v, i, index)}
                style={styles.signUpContainerStyle}
                inputContainerStyle={styles.inputContainerStyle}
                isSecure={field.isSecure}
                rightIcon={
                  field.type === `${t('TYPE.PASSWORD')}` && (
                    <Feather
                      name={field.isSecure ? 'eye' : 'eye-off'}
                      size={24}
                      color={COLOR.themeBlue}
                      onPress={() => {
                        field.isSecure = !showPassword;
                        setShowPassword(!showPassword);
                      }}
                      style={styles.eyeIcon}
                    />
                  )
                }
              />
            );
          })}
          <TextButton
            title={t('BUTTON.LOCATION')}
            buttonView={styles.buttonView}
            isDisabled={false}
            raised={true}
            onPress={() => myLocationPress()}
          />

          <View
            style={{
              justifyContent: 'flex-start',
              width: DIMENSIONS.bannerWidth,
            }}>
            <CheckBox
              title={t('PRIVACY_POLICY')}
              onPress={() => privacyClicked()}
              checked={isPrivacyChecked}
            />
          </View>

          <TextButton
            title={t('BUTTON.REGISTER')}
            buttonView={styles.buttonView}
            isDisabled={false}
            raised={true}
            onPress={() => checkValidation()}
          />
          <View style={styles.haveAcc}>
            <GlobalText text={t('HAVE_ACC')} />
            <TouchableOpacity onPress={() => signInScreen()}>
              <GlobalText text={t('SIGN_IN')} style={styles.blueBold} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <KeyboardAvoidingView
        behavior="height"
        style={{flex: 1}}></KeyboardAvoidingView>
      <Popup
        message={alertMessage}
        visible={isAlert}
        onPress={closePopup}
        Component={
          showPrivacy && (
            <PrivacyPolicy acceptClick={acceptClick} cancelClick={closePopup} />
          )
        }
        noButton={showPrivacy}
      />
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
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SignUp);
