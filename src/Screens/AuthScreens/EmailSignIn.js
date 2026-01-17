import React, {useEffect} from 'react';
import {useState} from 'react';
import {
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
  getFromStorage,
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
// import SQLite from 'react-native-sqlite-storage';
import Popup from '../../Components/Common/Popup';
import Feather from 'react-native-vector-icons/Feather';
import {CommonActions} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

const EmailSignIn = ({navigation, route, ...props}) => {
  const {t} = useTranslation();

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

  useEffect(() => {
    // openDB()
    // createUserTable();
    const backHandler = BackHandler.addEventListener(
      t('EVENT.HARDWARE_BACK_PRESS'),
      () => navigateTo(navigation, t('SCREEN.LANG_SELECTION')),
    );
    return () => {
      backHandler.remove();
      setIsAlert(false);
      setAlertMessage('');
    };
  }, []);

  // const openDB = () => {
  //   const db = SQLite.openDatabase({
  //     name: 'mydb.db',
  //     createFromLocation: '~mydata.db',
  //   });
  //   if (db) {
  //     // Database initialization successful, proceed with queries
  //   } else {
  //     console.error('Failed to initialize the database.');
  //   }
  // };

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
      case 1:
        setPassword(val);
        setOtp(val);
        break;
    }
    setIsButtonDisabled(false);
    // if ((val !== '' || val !== null) && isVal) setIsButtonDisabled(false);
    // else setIsButtonDisabled(true);
  };

  const getValue = i => {
    switch (i) {
      case 0:
        return email;
      case 1:
        return password;
    }
  };

  // const getOtpValue = i => {
  //   switch (i) {
  //     case 0:
  //       return email;
  //     case 1:
  //       return otp;
  //   }
  // };

  // const verifyOtp = () => {
  //   props.setLoader(true);
  //   const data = {
  //     email,
  //     otp,
  //   };
  //   comnPost('v2/auth/verifyOtp', data)
  //     .then(res => {
  //       if (res.data.success) {
  //         // setIsAlert(true);
  //         // setAlertMessage(res.data.message);
  //         AsyncStorage.setItem(
  //           t('STORAGE.ACCESS_TOKEN'),
  //           res.data.data.access_token,
  //         );
  //         AsyncStorage.setItem(
  //           t('STORAGE.USER_ID'),
  //           JSON.stringify(res.data.data.user.id),
  //         );
  //         props.saveAccess_token(res.data.data.access_token);
  //         props.setLoader(false);
  //         // setIsSuccess(true)
  //         AsyncStorage.setItem(
  //           t('STORAGE.IS_FIRST_TIME'),
  //           JSON.stringify(true),
  //         );
  //         navigation.dispatch(
  //           CommonActions.reset({
  //             index: 0,
  //             routes: [{name: t('SCREEN.HOME')}],
  //           }),
  //         );
  //       } else {
  //         setIsAlert(true);
  //         setAlertMessage(
  //           res.data.message.email ? res.data.message.email : res.data.message,
  //         );
  //         props.setLoader(false);
  //         setIsSuccess(false);
  //       }
  //     })
  //     .catch(err => {
  //       setIsAlert(true);
  //       setIsSuccess(false);
  //       setAlertMessage(t('ALERT.WENT_WRONG'));
  //       props.setLoader(false);
  //     });
  // };

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

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = password => {
    return password.length >= 6;
  };

  const login = () => {
    props.setLoader(true);

    if (!validateEmail(email)) {
      setIsAlert(true);
      setAlertMessage(t('ALERT.INVALID_EMAIL'));
      props.setLoader(false);
      return;
    }

    if (!validatePassword(password)) {
      setIsAlert(true);
      setAlertMessage(t('ALERT.INVALID_PASSWORD'));
      props.setLoader(false);
      return;
    }

    const data = {
      email,
      password,
    };
    // createUser()
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
          setAlertMessage(
            res.data.message.email
              ? res.data.message.email
              : res.data.message.password
              ? res.data.message.password
              : res.data.message,
          );
          props.setLoader(false);
          // setIsSuccess(false);
        }
      })
      .catch(err => {
        setIsAlert(true);
        // setIsSuccess(false);
        setAlertMessage(t('ALERT.WENT_WRONG'));
        props.setLoader(false);
      });
  };

  const selectPassword = () => {
    navigateTo(navigation, t('SCREEN.PASSWORD_LOGIN'), {email});
  };

  return (
    <View style={{flex: 1, backgroundColor: COLOR.white}}>
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
              isSecure={field.isSecure}
              rightIcon={
                field.type == `${t('TYPE.PASSWORD')}` && (
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
        <TouchableOpacity
          onPress={() => navigateTo(navigation, t('SCREEN.EMAIL'))}>
          <GlobalText
            text={t('BUTTON.LOGIN_WITH_OTP')}
            style={styles.loginSubText}
          />
        </TouchableOpacity>
        <View style={{alignItems: 'center'}}>
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
      <KeyboardAvoidingView
        behavior="height"
        style={{flex: 1}}></KeyboardAvoidingView>
      <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />
    </View>
  );
};

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
    loader: state.commonState.loader,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    saveAccess_token: data => dispatch(saveAccess_token(data)),
    setLoader: data => dispatch(setLoader(data)),
    setMode: data => dispatch(setMode(data)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EmailSignIn);
