import React, {useState, useEffect} from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useResponsive} from '../Services/responsive';
import AppIntroSlider from 'react-native-app-intro-slider';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Dropdown} from 'react-native-element-dropdown';
import {CheckBox} from '@rneui/themed';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TextButton from '../Components/Customs/Buttons/TextButton';
import PrivacyPolicy from '../Components/Common/PrivacyPolicy';
import * as LocationEnabler from 'react-native-android-location-enabler';
import {saveToStorage} from '../Services/Api/CommonServices';
import {showAlert} from '../Services/CommonMethods';
import COLOR from '../Services/Constants/COLORS';
import DIMENSIONS from '../Services/Constants/DIMENSIONS';
import STRING from '../Services/Constants/STRINGS';
import styles from './Styles';
import {createLogger} from '../Services/Logger';

const log = createLogger('OnboardingScreen');

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
  // One shared control width for every intro slide (dropdown, referral field,
  // location button, terms card) — live and capped on tablets.
  const {width: rWidth} = useResponsive();
  const fieldW = Math.min(rWidth - 40, 520);
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
            log.error(STRING.ALERT.LOC_ERROR, error);
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
      log.error('Error fetching location:', error);
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
              style={[styles.dropdown, {width: fieldW}]}
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
            // Rendered as a screen-level overlay (referralBar) so the same field
            // can float above the keyboard without duplicating the input.
            <View style={{height: 52}} />
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
                buttonView={[styles.locButtonView, {backgroundColor: buttonColor, width: fieldW}]}
                isDisabled={isButtonDisabled}
                raised={true}
                onPress={enableLocationService}
              />
            </View>
          ) : item.type === 'terms' ? (
            <View style={[styles.termsSlide, {paddingTop: insets.top}]}>
              <PrivacyPolicy
                containerStyle={[
                  styles.termsPolicyCard,
                  {
                    width: fieldW,
                    height:
                      DIMENSIONS.screenHeight -
                      (insets.top + insets.bottom + 185),
                  },
                ]}
              />
              <CheckBox
                title={STRING.ACCEPT_TNC}
                onPress={() => privacyClicked()}
                checked={isPrivacyChecked}
                checkedColor={COLOR.themeBlue}
                containerStyle={[styles.termsCheckboxContainer, {width: fieldW}]}
                textStyle={styles.termsCheckboxText}
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

      {/* The referral field lives here (not inside the slide) so the very same
          input can sit in the slide when the keyboard is closed, then become a
          solid compose bar docked to the keyboard when it's open. Keys keep the
          field mounted across that switch so focus isn't lost. */}
      {slides[currentIndex]?.type === 'referral' && (
        <View
          style={[
            keyboardOpen ? kb.composeBar : kb.closedBar,
            keyboardOpen
              ? {bottom: keyboardHeight + insets.bottom}
              : {bottom: Math.max(204 - DIMENSIONS.headerHeight, insets.bottom + 24)},
          ]}>
          {keyboardOpen && currentIndex > 0 && (
            <TouchableOpacity
              key="back"
              style={kb.backGhost}
              onPress={() => { Keyboard.dismiss(); handleBackButton(); }}
              activeOpacity={0.6}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="chevron-back" color={COLOR.themeBlue} size={28} />
            </TouchableOpacity>
          )}
          <View key="input" style={keyboardOpen ? kb.fieldWrapOpen : {width: fieldW}}>
            <TextInput
              style={keyboardOpen ? kb.composeInput : kb.closedInput}
              placeholder="Enter Referral Code"
              placeholderTextColor="#9A9A9A"
              value={referral}
              onChangeText={setReferral}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleNextButton();
              }}
              maxLength={20}
            />
          </View>
          {keyboardOpen && (
            <TouchableOpacity
              key="next"
              style={kb.nextCircle}
              onPress={() => { Keyboard.dismiss(); handleNextButton(); }}
              activeOpacity={0.8}>
              <Ionicons name="arrow-forward" color={COLOR.white} size={24} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const kb = StyleSheet.create({
  placeholder: {width: 44, height: 44},
  // Closed state: plain centered input sitting below the collage.
  closedBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  // Open state: solid bar docked to the top of the keyboard (inline compose).
  composeBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLOR.white,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: -2},
  },
  backGhost: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldWrapOpen: {
    flex: 1,
  },
  // Open state: full-width rounded compose pill, left-aligned like a chat input.
  composeInput: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F1F1',
    paddingHorizontal: 18,
    paddingVertical: 0,
    fontSize: 16,
    color: COLOR.black,
  },
  // Closed state: centered bordered pill sitting below the collage.
  closedInput: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: COLOR.themeBlue,
    backgroundColor: COLOR.white,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontSize: 16,
    color: COLOR.black,
    textAlign: 'center',
  },
  nextCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLOR.themeBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OnboardingScreen;
