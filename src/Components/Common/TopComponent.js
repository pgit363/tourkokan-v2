import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {StatusBar, View, TouchableOpacity, Image} from 'react-native';
import styles from './Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import GlobalText from '../Customs/Text';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SearchDropdown from './SearchDropdown';
import {useTranslation} from 'react-i18next';
import {Switch} from '@rneui/themed';
import {getFromStorage, saveToStorage} from '../../Services/Api/CommonServices';
import {FTP_PATH} from '@env';

StatusBar.setBarStyle('dark-content');

const TopComponent = ({
  navigation,
  currentCity,
  gotoProfile,
  cities,
  setCurrentCity,
  mode,
  setMode,
}) => {
  const {t} = useTranslation();

  const [showCities, setShowCities] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const menuIconStyle = {marginRight: 10};
  const cityNameStyle = {fontWeight: '500', textAlign: 'left'};
  const modeWrapStyle = {flexDirection: 'row', alignItems: 'center'};
  const modeTextStyle = {fontSize: DIMENSIONS.textSizeSmall};

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      const rawPicture = await getFromStorage(t('STORAGE.PROFILE_PICTURE'));
      if (!rawPicture) {
        return;
      }
      try {
        setProfilePhoto(JSON.parse(rawPicture));
      } catch {
        setProfilePhoto(rawPicture);
      }
    };
    fetchProfilePhoto();
  }, [t]);

  const openDrawer = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  const openProfile = useCallback(() => {
    gotoProfile();
  }, [gotoProfile]);

  const toggleCityDropdown = useCallback(() => {
    setShowCities(prev => !prev);
  }, []);

  const setCity = useCallback(v => {
    setShowCities(false);
    setCurrentCity(v);
  }, [setCurrentCity]);

  const changeMode = useCallback(() => {
    const nextMode = !mode;
    saveToStorage(t('STORAGE.MODE'), JSON.stringify(nextMode));
    setMode(nextMode);
  }, [mode, setMode, t]);

  const profileImageUri = useMemo(
    () =>
      profilePhoto
        ? FTP_PATH + profilePhoto
        : 'https://api-private.atlassian.com/users/2143ab39b9c73bcab4fe6562fff8d23d/avatar',
    [profilePhoto],
  );

  return (
    <View style={styles.topComponent}>
      <StatusBar backgroundColor={COLOR.white} />
      <View style={styles.topMenu}>
        <View style={styles.locationView}>
          <Ionicons
            name="menu"
            color={COLOR.black}
            size={DIMENSIONS.userIconSize}
            style={menuIconStyle}
            onPress={openDrawer}
          />
          <TouchableOpacity
            onPress={toggleCityDropdown}
            style={styles.locationPill}>
            <MaterialIcons
              name="location-pin"
              color={COLOR.themeBlue}
              size={DIMENSIONS.iconMedium}
              style={styles.routeCardIcons}
            />
            <GlobalText
              text={currentCity}
              style={cityNameStyle}
            />
            <Ionicons
              name="chevron-down"
              color={COLOR.themeBlue}
              size={DIMENSIONS.iconMedium}
            />
          </TouchableOpacity>
        </View>
        <View style={modeWrapStyle}>
          <GlobalText
            text={mode ? t('BUTTON.ONLINE') : t('BUTTON.OFFLINE')}
            style={modeTextStyle}
          />
          <Switch
            thumbColor={mode ? COLOR.green : COLOR.red}
            trackColor={{
              false: COLOR.lightRed,
              true: COLOR.lightGreen,
            }}
            onChange={changeMode}
            value={mode}
          />
        </View>
        <TouchableOpacity
          onPress={openProfile}
          style={styles.profileIconView}>
          <Image
            source={{
              uri: profileImageUri,
            }}
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>

      {showCities && (
        <SearchDropdown
          placesList={cities}
          style={styles.citiesDropdown}
          setPlace={setCity}
          closeDropdown={toggleCityDropdown}
          height={500}
        />
      )}
    </View>
  );
};

// const mapStateToProps = state => {
//   return {
//     access_token: state.commonState.access_token,
//     mode: state.commonState.mode,
//   };
// };

// const mapDispatchToProps = dispatch => {
//   return {
//     setLoader: data => {
//       dispatch(setLoader(data));
//     },
//   };
// };

export default React.memo(TopComponent);
