import React, {useState, useEffect} from 'react';
import {View, TouchableOpacity, ScrollView} from 'react-native';
import Header from '../Components/Common/Header';
import COLOR from '../Services/Constants/COLORS';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  comnPost,
  dataSync,
  saveToStorage,
} from '../Services/Api/CommonServices';
import {connect} from 'react-redux';
import Loader from '../Components/Customs/Loader';
import {setLoader} from '../Reducers/CommonActions';
import {Image} from '@rneui/themed';
import styles from './Styles';
import {
  checkLogin,
  backPage,
  goBackHandler,
  navigateTo,
} from '../Services/CommonMethods';
import GlobalText from '../Components/Customs/Text';
import {ProfileFields} from '../Services/Constants/FIELDS';
import TextButton from '../Components/Customs/Buttons/TextButton';
import TextField from '../Components/Customs/TextField';
import Path from '../Services/Api/BaseUrl';
import {launchImageLibrary} from 'react-native-image-picker';
import Popup from '../Components/Common/Popup';
import NetInfo from '@react-native-community/netinfo';
import CheckNet from '../Components/Common/CheckNet';
import Feather from 'react-native-vector-icons/Feather';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FTP_PATH} from '@env';

const Profile = ({navigation, ...props}) => {
  const {t} = useTranslation();

  const [profile, setProfile] = useState([]);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [profile_picture, setPicture] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [imageSource, setImageSource] = useState(null);
  const [uploadImage, setUploadImage] = useState(null);
  const [offline, setOffline] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    props.setLoader(true);
    // getUserProfile();

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(false);
      dataSync(
        t('STORAGE.PROFILE_RESPONSE'),
        getUserProfile(),
        props.mode,
      ).then(resp => {
        let res = JSON.parse(resp);
        if (res.data && res.data.data) {
          setProfile(res.data.data);
          setName(res.data.data.name);
          setEmail(res.data.data.email);
          setMobile(res.data.data.mobile);
          setPicture(res.data.data.profile_picture);
        } else if (resp) {
          setOffline(true);
        }
        props.setLoader(false);
      });
      // removeFromStorage(t("STORAGE.LANDING_RESPONSE"))
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, []);

  const getUserProfile = () => {
    comnPost('v2/user-profile', props.access_token)
      .then(res => {
        if (res && res.data.data)
          saveToStorage(
            t('STORAGE.PROFILE_RESPONSE'),
            JSON.stringify(res.data.data),
          );
        setProfile(res.data.data); // Update places state with response data
        props.setLoader(false);
        setName(res.data.data.name);
        setEmail(res.data.data.email);
        setMobile(res.data.data.mobile);
        setPicture(res.data.data.profile_picture);
      })
      .catch(error => {
        setError(error.message); // Update error state with error message
        props.setLoader(false);
      });
  };

  const setValue = (val, isVal, index) => {
    switch (index) {
      case 0:
        setName(val);
        break;
      case 1:
        setMobile(val);
        break;
      case 2:
        setEmail(val);
        break;
      case 3:
        setPassword(val);
        break;
      case 4:
        setCPassword(val);
        break;
    }
  };

  const getValue = i => {
    switch (i) {
      case 0:
        return name;
      case 1:
        return mobile;
      case 2:
        return email;
      case 3:
        return password;
      case 4:
        return cPassword;
    }
  };

  const handleImageUpload = () => {
    launchImageLibrary(
      {
        mediaType: t('TYPE.PHOTO'),
        includeBase64: true, // Set to true to include base64 data
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

  const updateProfile = () => {
    props.setLoader(true);
    let data = {
      email,
      mobile,
      profile_picture: uploadImage,
      password,
      password_confirmation: cPassword,
    };

    comnPost('v2/updateProfile', data)
      .then(res => {
        AsyncStorage.setItem('isUpdated', 'true');
        setIsAlert(true);
        setAlertMessage(res.data.message);
        props.setLoader(false);
        if (res.data.success) setIsSuccess(true);
        else setIsSuccess(false);
      })
      .catch(err => {
        setIsAlert(true);
        setAlertMessage(t('ALERT.FAILED'));
        props.setLoader(false);
      });
  };

  const closePopup = () => {
    if (isSuccess) {
      navigateTo(navigation, t('SCREEN.PROFILE_VIEW'));
    }
    setIsAlert(false);
  };

  return (
    <View>
      <ScrollView>
        <CheckNet isOff={offline} />
        <Header
          style={{backgroundColor: 'transparent', zIndex: 10}}
          name={''}
          startIcon={
            <Ionicons
              name="chevron-back-outline"
              size={24}
              onPress={() => backPage(navigation)}
              color={COLOR.black}
            />
          }
          endIcon={<></>}
        />
        <Loader />
        <View>
          <TouchableOpacity
            style={styles.profileImageView}
            onPress={handleImageUpload}>
            {imageSource ? (
              <Image source={{uri: imageSource}} style={styles.profileImage} />
            ) : (
              <Image
                source={{
                  uri: `${
                    profile_picture
                      ? FTP_PATH + profile_picture
                      : 'https://api-private.atlassian.com/users/2143ab39b9c73bcab4fe6562fff8d23d/avatar'
                  }`,
                }}
                containerStyle={styles.profileImage}
              />
            )}
            <View style={styles.handPointer}>
              <FontAwesome
                name="hand-pointer-o"
                size={35}
                color={COLOR.black}
              />
              <GlobalText text={t('BUTTON.CLICK_TO_UPDATE')} />
            </View>
          </TouchableOpacity>
          <View style={styles.profileDetails}>
            {ProfileFields.map((field, index) => {
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
                  inputContainerStyle={styles.profileContainerStyle}
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
            <TextButton
              title={t('BUTTON.UPDATE')}
              buttonView={styles.buttonView}
              containerStyle={styles.buttonContainer}
              buttonStyle={styles.profileButtonStyle}
              titleStyle={styles.buttonTitle}
              disabled={false}
              raised={true}
              onPress={() => updateProfile()}
            />
          </View>
        </View>
      </ScrollView>

      <Popup message={alertMessage} visible={isAlert} onPress={closePopup} />
    </View>
  );
};

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
    mode: state.commonState.mode,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoader(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
