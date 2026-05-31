import React, {useState, useEffect} from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppIntroSlider from 'react-native-app-intro-slider';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Dropdown} from 'react-native-element-dropdown';
import {CheckBox} from '@rneui/themed';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TextButton from '../Components/Customs/Buttons/TextButton';
import TextField from '../Components/Customs/TextField';
import PrivacyPolicy from '../Components/Common/PrivacyPolicy';
import * as LocationEnabler from 'react-native-android-location-enabler';
import {saveToStorage} from '../Services/Api/CommonServices';
import {showAlert} from '../Services/CommonMethods';
import COLOR from '../Services/Constants/COLORS';
import STRING from '../Services/Constants/STRINGS';
import styles from './Styles';

const slides = [
  {
    key: 1,
    title: STRING.ALERT.SELECT_LANG,
    image: require('../Assets/Images/Intro/4-min.png'),
    backgroundColor: COLOR.white,
    type: 'language',
  },
  {
    key: 2,
    title: STRING.ALERT.ENTER_REFERRAL,
    image: require('../Assets/Images/Intro/5-min.png'),
    backgroundColor: COLOR.white,
    type: 'referral',
  },
  {
    key: 3,
    title: STRING.ALERT.ENABLE_LOC,
    image: require('../Assets/Images/Intro/7-min.png'),
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
];

const languagesList = [
  {label: 'English', value: 'en'},
  {label: 'मराठी', value: 'mr'},
];

const OnboardingScreen = ({onComplete}) => {
  const insets = useSafeAreaInsets();
  const sliderRef = React.useRef(null);

  const [language, setLanguage] = useState('en');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textValues, setTextValues] = useState({1: '', 2: '', 3: '', 4: '', 5: ''});
  const [latitude, setCurrentLatitude] = useState(null);
  const [longitude, setCurrentLongitude] = useState(null);
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Share Location');
  const [buttonColor, setButtonColor] = useState(COLOR.themeBlue);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [referral, setReferral] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const checkValidation = async index => {
    if ((!latitude || !longitude) && index >= 3) {
      showAlert('', STRING.ALERT.SHARE_LOCATION, 'warning');
      setCurrentIndex(2);
      if (sliderRef.current) sliderRef.current.goToSlide(2);
      return;
    } else if (!textValues[4] && index >= 4) {
      showAlert('', STRING.ALERT.TNC, 'warning');
      setCurrentIndex(3);
      if (sliderRef.current) sliderRef.current.goToSlide(3);
      return;
    } else {
      if (latitude && longitude && textValues[4]) {
        onComplete();
      }
    }
  };

  const handleNextButton = () => {
    if (currentIndex === 3) {
      if (!textValues[4]) {
        showAlert('', STRING.ALERT.TNC, 'warning');
        return;
      }
      if (!latitude || !longitude) {
        showAlert('', STRING.ALERT.SHARE_LOCATION, 'warning');
        return;
      }
    }
    if (currentIndex === 2 && (!latitude || !longitude)) {
      showAlert('', STRING.ALERT.SHARE_LOCATION, 'warning');
      return;
    }
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      if (sliderRef.current) sliderRef.current.goToSlide(currentIndex + 1);
    }
  };

  const handleBackButton = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      sliderRef.current.goToSlide(currentIndex - 1);
    }
  };

  const onSlideChange = index => {
    setCurrentIndex(index);
    checkValidation(index);
  };

  const enableLocationService = async () => {
    try {
      setIsLoading(true);
      setIsButtonDisabled(true);
      const isLocationEnabled = await LocationEnabler.isLocationEnabled();
      if (isLocationEnabled) {
        getOneTimeLocation();
      } else {
        LocationEnabler.promptForEnableLocationIfNeeded()
          .then(() => {
            showAlert('Success', STRING.ALERT.LOCATION_ENABLED, 'success');
            getOneTimeLocation();
          })
          .catch(error => {
            console.error(STRING.ALERT.LOC_ERROR, error);
            showAlert('Error', STRING.ALERT.LOC_FAILED, 'error');
            setIsLoading(false);
            setIsButtonDisabled(false);
          });
      }
    } catch (error) {
      showAlert('Error', STRING.ALERT.WENT_WRONG, 'error');
      setIsLoading(false);
      setIsButtonDisabled(false);
    }
  };

  const getOneTimeLocation = async () => {
    try {
      const currentLatitude = 17.985222;
      const currentLongitude = 48.6658998;
      setCurrentLatitude(currentLatitude);
      setCurrentLongitude(currentLongitude);
      setLocationStatus(STRING.ALERT.LOC_ENABLE);
      setButtonColor('#28a745');
      setIsLoading(false);
      setIsButtonDisabled(true);
    } catch (error) {
      setLocationStatus(STRING.ALERT.ENABLE_LOC);
      setButtonColor(COLOR.red);
      setIsLoading(false);
      setIsButtonDisabled(false);
      console.error('Error fetching location:', error);
    }
  };

  const privacyClicked = () => {
    setIsPrivacyChecked(!isPrivacyChecked);
    setTextValues({...textValues, 4: !textValues[4]});
  };

  const onDone = async () => {
    await checkValidation(4);
    await saveToStorage(STRING.STORAGE.IS_FIRST_TIME, 'true');
    await saveToStorage(STRING.STORAGE.LANGUAGE, language);
    await saveToStorage(STRING.STORAGE.REFERRAL_CODE, referral);
    await saveToStorage(STRING.STORAGE.CURRENT_LATITUDE, JSON.stringify(latitude));
    await saveToStorage(STRING.STORAGE.CURRENT_LONGITUDE, JSON.stringify(longitude));
    await saveToStorage(STRING.STORAGE.TERMS_ACCEPTED, JSON.stringify(textValues[4] || false));
  };

  const renderItem = ({item}) => (
    <KeyboardAwareScrollView
      contentContainerStyle={{flexGrow: 1}}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraHeight={150}>
      <View style={[styles.slide]}>
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
              onChange={i => setLanguage(i.value)}
            />
          ) : item.type === 'referral' ? (
            <TextField
              fieldType={'text'}
              style={[styles.searchPanelFieldNew, {borderWidth: 1, textAlign: 'center'}]}
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
                }
                buttonView={[styles.locButtonView, {backgroundColor: buttonColor}]}
                isDisabled={isButtonDisabled}
                raised={true}
                onPress={enableLocationService}
              />
            </View>
          ) : item.type === 'terms' ? (
            <View>
              <PrivacyPolicy />
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
    </KeyboardAwareScrollView>
  );

  const keyboardOpen = keyboardHeight > 0;

  const renderDoneButton = () =>
    keyboardOpen ? <View style={kb.placeholder} /> : (
      <View style={styles.buttonCircle}>
        <Ionicons name="checkmark" color={COLOR.white} size={30} />
      </View>
    );

  const renderNextButton = () =>
    keyboardOpen ? <View style={kb.placeholder} /> : (
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

  return (
    <View style={{flex: 1, paddingBottom: insets.bottom}}>
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
        onSlideChange={onSlideChange}
      />
      {currentIndex > 0 && !keyboardOpen && renderNewButton()}

      {/* Floating nav buttons above keyboard */}
      {keyboardOpen && (
        <View style={[kb.floatingRow, {bottom: keyboardHeight + Math.max(insets.bottom, 12)}]}>
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[kb.circle, {marginRight: 'auto'}]}
              onPress={() => { Keyboard.dismiss(); handleBackButton(); }}
              activeOpacity={0.8}>
              <Ionicons name="arrow-back" color={COLOR.white} size={26} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[kb.circle, {marginLeft: 'auto'}]}
            onPress={() => { Keyboard.dismiss(); handleNextButton(); }}
            activeOpacity={0.8}>
            <Ionicons name="arrow-forward" color={COLOR.white} size={26} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const kb = StyleSheet.create({
  placeholder: {width: 44, height: 44},
  floatingRow: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLOR.themeBlue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});

export default OnboardingScreen;
