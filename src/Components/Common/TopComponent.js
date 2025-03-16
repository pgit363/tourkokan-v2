import React, {useEffect, useState} from 'react';
import {StatusBar, View, TouchableOpacity, Image} from 'react-native';
import styles from './Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import GlobalText from '../Customs/Text';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Path from '../../Services/Api/BaseUrl';
import SearchDropdown from './SearchDropdown';
import {useTranslation} from 'react-i18next';
import {Switch} from '@rneui/themed';
import {connect} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getFromStorage, saveToStorage} from '../../Services/Api/CommonServices';

StatusBar.setBarStyle('dark-content');

const TopComponent = ({
  navigation,
  openLocationSheet,
  currentCity,
  gotoProfile,
  cities,
  setCurrentCity,
  mode,
  setMode,
  ...props
}) => {
  const {t} = useTranslation();
  // const { SettingsModule } = NativeModules;

  const [showCities, setShowCities] = useState(false);
  const [isOnline, setIsOnline] = useState(mode);
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(async () => {
    let picture = JSON.parse(
      await getFromStorage(t('STORAGE.PROFILE_PICTURE')),
    );
    setProfilePhoto(picture);
  }, []);

  const openDrawer = () => {
    navigation.openDrawer();
  };

  const openProfile = () => {
    gotoProfile();
  };

  const toggleCityDropdown = () => {
    setShowCities(!showCities);
  };

  const setCity = v => {
    toggleCityDropdown();
    setCurrentCity(v);
  };

  const changeMode = () => {
    saveToStorage(t('STORAGE.MODE'), JSON.stringify(!isOnline));
    setMode(!isOnline);
    setIsOnline(!isOnline);
  };

  // const openMobileDataSettings = () => {
  //     SettingsModule.openMobileDataSettings();
  //   };

  return (
    <View style={styles.topComponent}>
      <StatusBar backgroundColor={COLOR.white} />
      <View style={styles.topMenu}>
        <View style={styles.locationView}>
          <Ionicons
            name="menu"
            color={COLOR.black}
            size={DIMENSIONS.userIconSize}
            style={{marginRight: 10}}
            onPress={() => openDrawer()}
          />
          <TouchableOpacity
            onPress={() => toggleCityDropdown()}
            style={styles.locationPill}>
            <MaterialIcons
              name="location-pin"
              color={COLOR.themeBlue}
              size={DIMENSIONS.iconMedium}
              style={styles.routeCardIcons}
            />
            <GlobalText
              text={currentCity}
              style={{fontWeight: '500', textAlign: 'left'}}
            />
            <Ionicons
              name="chevron-down"
              color={COLOR.themeBlue}
              size={DIMENSIONS.iconMedium}
            />
          </TouchableOpacity>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <GlobalText
            text={mode ? t('BUTTON.ONLINE') : t('BUTTON.OFFLINE')}
            style={{fontSize: DIMENSIONS.textSizeSmall}}
          />
          <Switch
            thumbColor={mode ? COLOR.green : COLOR.red}
            trackColor={{
              false: COLOR.lightRed,
              true: COLOR.lightGreen,
            }}
            onChange={() => changeMode()}
            value={mode}
          />
        </View>
        <TouchableOpacity
          onPress={() => openProfile()}
          style={styles.profileIconView}>
          <Image
            source={{
              uri: `${
                profilePhoto
                  ? profilePhoto
                  : 'https://api-private.atlassian.com/users/2143ab39b9c73bcab4fe6562fff8d23d/avatar'
              }`,
            }}
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>

      {showCities && (
        <View>
          <SearchDropdown
            placesList={cities}
            style={styles.citiesDropdown}
            setPlace={v => setCity(v)}
            closeDropdown={() => toggleCityDropdown()}
            height={500}
          />
        </View>
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

export default TopComponent;
