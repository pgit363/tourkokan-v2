import 'react-native-gesture-handler';
import {StatusBar} from 'expo-status-bar';
import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import store from './Store';
import {
  Image,
  LogBox,
  StyleSheet,
  View,
  ActivityIndicator,
  TextInput,
  Button,
  PermissionsAndroid,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import StackNavigator from './src/Navigators/StackNavigator';
import COLOR from './src/Services/Constants/COLORS';
import AppIntroSlider from 'react-native-app-intro-slider';
import GlobalText from './src/Components/Customs/Text';
import DIMENSIONS from './src/Services/Constants/DIMENSIONS';
import STRING from './src/Services/Constants/STRINGS';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextButton from './src/Components/Customs/Buttons/TextButton';
import Feather from 'react-native-vector-icons/Feather';
import styles from './src/Screens/Styles';
import analytics from '@react-native-firebase/analytics';
import Ionicons from 'react-native-vector-icons/Ionicons';
import './src/localization/i18n';
import firebase from '@react-native-firebase/app';
import {
  comnPost,
  dataSync,
  getFromStorage,
  saveToStorage,
} from './src/Services/Api/CommonServices';
import {useTranslation} from 'react-i18next';
import {Dropdown} from 'react-native-element-dropdown';
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
import {navigateTo} from './src/Services/CommonMethods';
import TextField from './src/Components/Customs/TextField';
import {CheckBox, Switch} from '@rneui/themed';
import PrivacyPolicy from './src/Components/Common/PrivacyPolicy';
// import LocationEnabler from 'react-native-android-location-enabler';
import {
  checkLocationEnabled,
  requestResolutionSettings,
} from 'react-native-android-location-enabler';
import * as LocationEnabler from 'react-native-android-location-enabler';

// LogBox.ignoreAllLogs();
// LogBox.ignoreLogs(['Warning: ...', 'Possible Unhandled Promise Rejection']);
const Stack = createNativeStackNavigator();

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp();
}

analytics().setAnalyticsCollectionEnabled(true);

const slides = [
  {
    key: 1,
    title: STRING.ALERT.SELECT_LANG,
    image: require('./src/Assets/Images/Intro/4-min.png'),
    backgroundColor: COLOR.white,
    type: 'language',
  },
  {
    key: 2,
    title: STRING.ALERT.ENTER_REFERRAL,
    image: require('./src/Assets/Images/Intro/5-min.png'),
    backgroundColor: COLOR.white,
    type: 'referral',
  },
  {
    key: 3,
    title: STRING.ALERT.ENABLE_LOC,
    image: require('./src/Assets/Images/Intro/7-min.png'),
    backgroundColor: COLOR.white,
    type: 'location',
  },
  {
    key: 4,
    title: STRING.ALERT.ACCEPT_TERMS,
    image: null,
    backgroundColor: COLOR.white,
    type: 'terms',
  },
  // {
  //   key: 5,
  //   title: STRING.ALERT.SELECT_MODE,
  //   image: null,
  //   backgroundColor: COLOR.white,
  //   type: 'mode',
  // },
];

export default function App() {
  // const { i18n } = useTranslation();
  const sliderRef = React.useRef(null);

  const [isFirstTime, setIsFirstTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textValues, setTextValues] = useState({
    1: '',
    2: '',
    3: '',
    4: '',
    5: '',
  });
  const [latitude, setCurrentLatitude] = useState(null);
  const [longitude, setCurrentLongitude] = useState(null);
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const languagesList = [
    {label: 'English', value: 'en'},
    {label: 'मराठी', value: 'mr'},
  ];
  const [isLoading, setIsLoading] = useState(false); // State to manage loading spinner
  const [locationStatus, setLocationStatus] = useState('Share Location');
  const [buttonColor, setButtonColor] = useState(COLOR.themeBlue);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [referral, setReferral] = useState('');

  useEffect(() => {
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
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    const checkFirstTime = async () => {
      const isFirstTimeValue = await getFromStorage(
        STRING.STORAGE.IS_FIRST_TIME,
      );
      setIsFirstTime(isFirstTimeValue);
      setLoading(false);
    };
    checkFirstTime();
    const apiCalling = async () => {
      const access_token = await getFromStorage(STRING.STORAGE.ACCESS_TOKEN);

      if (access_token) {
        callAPI();
      }
    };

    apiCalling();
  }, []);

  const handleInputChange = (key, value) => {
    setTextValues(prev => ({...prev, [key]: value}));
  };

  // const handleNextButton = () => {
  //   if (currentIndex < slides.length - 1) {
  //     setCurrentIndex(currentIndex + 1);
  //     if (sliderRef.current) sliderRef.current.goToSlide(currentIndex + 1);
  //   }
  // };

  const checkValidation = async index => {
    if ((!latitude || !longitude) && index >= 3) {
      alert(STRING.ALERT.SHARE_LOCATION);
      setCurrentIndex(2);
      if (sliderRef.current) sliderRef.current.goToSlide(2);
      return;
    } else if (!textValues[4] && index >= 4) {
      alert(STRING.ALERT.TNC);
      setCurrentIndex(3);
      if (sliderRef.current) sliderRef.current.goToSlide(3);
      return;
    } else {
      if (latitude && longitude && textValues[4]) {
        setIsFirstTime('false');
      }
    }
  };

  const handleNextButton = () => {
    // Check when on the third slide for Terms and Conditions acceptance and location sharing
    if (currentIndex === 3) {
      if (!textValues[4]) {
        alert(STRING.ALERT.TNC);
        return;
      }

      if (!latitude || !longitude) {
        alert(STRING.ALERT.SHARE_LOCATION);
        return;
      }
    }

    // Check when on the second slide for location sharing
    if (currentIndex === 2 && (!latitude || !longitude)) {
      alert(STRING.ALERT.SHARE_LOCATION);
      return;
    }

    // Proceed to the next slide
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      if (sliderRef.current) sliderRef.current.goToSlide(currentIndex + 1);
    }
  };

  const callAPI = () => {
    dataSync(STRING.STORAGE.LANDING_RESPONSE, callLandingPageAPI, true).then(
      resp => {},
    );
  };

  const callLandingPageAPI = async site_id => {
    try {
      let data = {site_id};
      const res = await comnPost('v2/landingpage', data);
      if (res && res.data.data) {
        setOfflineData(res.data.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      console.log('finally');
    }
  };

  const setOfflineData = resp => {
    saveToStorage(STRING.STORAGE.LANDING_RESPONSE, JSON.stringify(resp));
    saveToStorage(
      STRING.STORAGE.CATEGORIES_RESPONSE,
      JSON.stringify(resp.categories),
    );
    saveToStorage(STRING.STORAGE.ROUTES_RESPONSE, JSON.stringify(resp.routes));
    saveToStorage(STRING.STORAGE.CITIES_RESPONSE, JSON.stringify(resp.cities));
    saveToStorage(STRING.STORAGE.EMERGENCY, JSON.stringify(resp.emergencies));
    saveToStorage(STRING.STORAGE.QUERIES, JSON.stringify(resp.queries));
    saveToStorage(STRING.STORAGE.GALLERY, JSON.stringify(resp.gallery));
    saveToStorage(STRING.STORAGE.PROFILE_RESPONSE, JSON.stringify(resp.user));
    saveToStorage(STRING.STORAGE.USER_NAME, resp.user.name);
    saveToStorage(STRING.STORAGE.USER_ID, JSON.stringify(resp.user.id));
    saveToStorage(STRING.STORAGE.USER_EMAIL, resp.user.email);
  };

  // const handleNextButton = () => {
  //   // Call the `onNext` function of the current slide
  //   slides[currentIndex].onNext();

  //   // Move to the next slide
  //   if (currentIndex < slides.length - 1) {
  //     setCurrentIndex(currentIndex + 1);
  //   }
  // };

  // const handleInputChange = (key, value) => {
  //   setTextValues(prev => ({ ...prev, [key]: value }));
  // };

  const enableLocationService = async () => {
    try {
      setIsLoading(true); // Start loading spinner
      setIsButtonDisabled(true); // Disable the button while processing

      // Check if location is already enabled
      const isLocationEnabled = await LocationEnabler.isLocationEnabled();

      if (isLocationEnabled) {
        console.log(STRING.ALERT.LOC_ENABLED);
        getOneTimeLocation();
      } else {
        LocationEnabler.promptForEnableLocationIfNeeded()
          .then(() => {
            console.log(STRING.ALERT.LOCATION_ENABLED);
            Alert.alert('Success', STRING.ALERT.LOCATION_ENABLED);
            getOneTimeLocation();
          })
          .catch(error => {
            console.error(STRING.ALERT.LOC_ERROR, error);
            Alert.alert('Error', STRING.ALERT.LOC_FAILED);
            setIsLoading(false); // Stop loading spinner
            setIsButtonDisabled(false); // Re-enable the button
          });
      }
    } catch (error) {
      Alert.alert('Error', STRING.ALERT.WENT_WRONG);
      setIsLoading(false); // Stop loading spinner
      setIsButtonDisabled(false); // Re-enable the button
    }
  };

  const getOneTimeLocation = async () => {
    try {
      const currentLatitude = 17.985222;
      const currentLongitude = 48.6658998;

      setCurrentLatitude(currentLatitude);
      setCurrentLongitude(currentLongitude);
      setLocationStatus(STRING.ALERT.LOC_ENABLE); // Update button text
      setButtonColor('#28a745'); // Set color to green after success
      setIsLoading(false); // Stop loading spinner
      setIsButtonDisabled(true); // Keep the button disabled
      // Geolocation.getCurrentPosition(
      //   position => {
      //     const currentLatitude = position.coords.latitude;
      //     const currentLongitude = position.coords.longitude;

      //     console.log(
      //       'Latitude:',
      //       currentLatitude,
      //       'Longitude:',
      //       currentLongitude,
      //     );
      //     setCurrentLatitude(currentLatitude);
      //     setCurrentLongitude(currentLongitude);
      //     setLocationStatus(STRING.ALERT.LOC_ENABLE); // Update button text
      //     setButtonColor('#28a745'); // Set color to green after success
      //     setIsLoading(false); // Stop loading spinner
      //     setIsButtonDisabled(true); // Keep the button disabled
      //   },
      //   error => {
      //     setLocationStatus(STRING.ALERT.ENABLE_LOC); // Reset text
      //     setButtonColor(COLOR.red); // Change to red color on error
      //     setIsLoading(false); // Stop loading spinner
      //     setIsButtonDisabled(false); // Enable button again
      //     console.error('Location Error:', error);
      //   },
      //   {enableHighAccuracy: false, timeout: 30000, maximumAge: 1000},
      // );
    } catch (error) {
      setLocationStatus(STRING.ALERT.ENABLE_LOC); // Reset text
      setButtonColor(COLOR.red); // Change to red color on error
      setIsLoading(false);
      setIsButtonDisabled(false); // Enable button again
      console.error('Error fetching location:', error);
    }
  };

  const privacyClicked = () => {
    setIsPrivacyChecked(!isPrivacyChecked);
    setTextValues({...textValues, 4: !textValues[4]});
  };

  const renderItem = ({item}) => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <ScrollView contentContainerStyle={{flexGrow: 1}}>
          <View style={[styles.slide, {backgroundColor: item.backgroundColor}]}>
            {item.image && <Image source={item.image} style={styles.image} />}

            <View style={styles.bottomFields}>
              {item.type === 'language' ? (
                <Dropdown
                  style={styles.dropdown}
                  selectedTextStyle={styles.selectedTextStyle}
                  itemTextStyle={styles.itemTextStyle}
                  dropdownTextStyle={styles.dropdownText}
                  data={languagesList}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Language"
                  value={language}
                  onChange={item => setLanguage(item.value)}
                />
              ) : item.type === 'referral' ? (
                <TextField
                  fieldType={'text'}
                  style={[
                    styles.searchPanelFieldNew,
                    {
                      marginTop: isKeyboardVisible ? -400 : 0,
                      borderWidth: isKeyboardVisible ? 3 : 1,
                      textAlign: 'center',
                    },
                  ]}
                  inputContainerStyle={styles.inputContainerStyle}
                  placeholder="Enter Referral Code"
                  placeholderTextColor="#000"
                  value={referral}
                  setChild={(v, i) => setReferral(v)}
                />
              ) : item.type === 'location' ? (
                <View>
                  <TextButton
                    title={
                      isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        locationStatus
                      )
                    } // Show spinner instead of text when loading
                    buttonView={[
                      styles.locButtonView,
                      {backgroundColor: buttonColor},
                    ]}
                    isDisabled={isButtonDisabled}
                    raised={true}
                    onPress={enableLocationService}></TextButton>
                </View>
              ) : item.type === 'terms' ? (
                <View>
                  {/* <TextInput
                style={styles.checkbox}
                placeholder="Accept Terms and Conditions"
                value={textValues[item.key]}
                onChangeText={text => handleInputChange(item.key, text)}
              /> */}
                  <PrivacyPolicy
                  // acceptClick={acceptClick}
                  // cancelClick={closePopup}
                  />
                  <CheckBox
                    title={STRING.ACCEPT_TNC}
                    onPress={() => privacyClicked()}
                    checked={isPrivacyChecked}
                    textStyle={{fontSize: 12.5}}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderDoneButton = () => (
    <View style={styles.buttonCircle}>
      <Ionicons name="checkmark" color={COLOR.white} size={30} />
    </View>
  );

  const renderNextButton = () => (
    <View style={styles.buttonCircle}>
      <Ionicons
        name="arrow-forward"
        color={COLOR.white}
        size={30}
        onPress={handleNextButton}
      />
    </View>
  );

  const renderNewButton = () => (
    <View style={styles.backCircle}>
      <Ionicons
        name="arrow-back"
        color={COLOR.white}
        size={30}
        onPress={handleBackButton}
      />
    </View>
  );

  const onDone = async () => {
    // Save the user's preferences
    await checkValidation(4);
    await saveToStorage(STRING.STORAGE.IS_FIRST_TIME, 'true');
    await saveToStorage(STRING.STORAGE.LANGUAGE, language);
    await saveToStorage(STRING.STORAGE.REFERRAL_CODE, referral);
    await saveToStorage(
      STRING.STORAGE.CURRENT_LATITUDE,
      JSON.stringify(latitude),
    );
    await saveToStorage(
      STRING.STORAGE.CURRENT_LONGITUDE,
      JSON.stringify(longitude),
    );
    await saveToStorage(
      STRING.STORAGE.TERMS_ACCEPTED,
      JSON.stringify(textValues[4] || false),
    );
  };

  const handleBackButton = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      sliderRef.current.goToSlide(currentIndex - 1);
    }
  };

  // const renderNextButton = () => {
  //   return (
  //     <View style={styles.buttonCircle}>
  //       <Ionicons name="arrow-forward" color={COLOR.white} size={30} onPress={() => {
  //           if (sliderRef.current && currentIndex < slides.length - 1) {
  //             sliderRef.current.goToSlide(currentIndex + 1); // Navigate to the next slide
  //             slides[currentIndex].onNext();  // Trigger slide-specific action
  //           }
  //         }}
  //       />
  //     </View>
  //   );
  // };

  // const renderDoneButton = () => {
  //   return (
  //     <View style={styles.buttonCircle}>
  //       <Ionicons name="checkmark" color={COLOR.white} size={30} />
  //     </View>
  //   );
  // };

  const onSlideChange = index => {
    // Update the current index and trigger specific actions for the slide.
    setCurrentIndex(index);
    // Trigger any actions specific to the new slide
    // slides[index].onNext();
    checkValidation(index);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR.themeBlue} />
      </View>
    );
  }

  if (isFirstTime === 'false') {
    return (
      <Provider store={store}>
        <SafeAreaProvider>
          <StackNavigator />
        </SafeAreaProvider>
      </Provider>
    );
  }

  return (
    <>
      <StatusBar backgroundColor={COLOR.loginImageBlue} />
      <AppIntroSlider
        ref={sliderRef}
        nextButtonTextColor={'#000'}
        renderItem={renderItem}
        data={slides}
        onDone={onDone}
        activeDotColor={COLOR.themeBlue}
        dotStyle={{
          width: 10,
          height: 10,
          borderRadius: 7.5,
          backgroundColor: '#C0C0C0',
        }}
        activeDotStyle={{
          width: 15,
          height: 15,
          borderRadius: 10,
          backgroundColor: COLOR.themeBlue,
        }}
        renderDoneButton={renderDoneButton}
        renderNextButton={renderNextButton}
        // renderPrevButton={renderPrevButton}
        onSlideChange={onSlideChange}
        // scrollEnabled={false}
        // dotClickEnabled={false}
      />
      {currentIndex > 0 && renderNewButton()}
    </>
  );
}
