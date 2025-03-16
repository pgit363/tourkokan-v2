import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import GlobalText from '../../Customs/Text';
import {Dropdown} from 'react-native-element-dropdown';
import styles from './Styles';
import TextButton from '../../Customs/Buttons/TextButton';
import {useTranslation} from 'react-i18next';
import {comnPost, getFromStorage} from '../../../Services/Api/CommonServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ComingSoon from '../ComingSoon';
import {connect} from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import Popup from '../Popup';

const ChangeLang = ({refreshOption, setLoader, ...props}) => {
  const {t, i18n} = useTranslation();

  const [list, setList] = useState([
    {label: 'English', value: 'en'},
    {label: 'मराठी', value: 'mr'},
  ]);
  const [language, setLanguage] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [showOnlineMode, setShowOnlineMode] = useState(false);

  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    setLanguage(t('LANG'));
  }, []);

  const saveLang = async () => {
    const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
    // Check the internet connectivity state
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;

    // Combined condition for all three cases
    if (
      (isConnected && !mode) || // Case 1: Internet is available but mode is offline
      (!isConnected && !mode) || // Case 2: Internet is not available and mode is offline
      (!isConnected && mode) // Case 3: Internet is not available but mode is online
    ) {
      // The user should be alerted based on their mode and connectivity status
      setIsAlert(true);
      setAlertMessage(
        !isConnected && !mode
          ? t('ALERT.NETWORK') // Alert: Network is available but mode is offline
          : !isConnected && mode
          ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE') // Alert: Mode is offline, you need to set it to online
          : isConnected && !mode
          ? t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE') // Alert: No internet available but mode is online
          : '', // Default case (optional), if none of the conditions match
      );

      return;
    }

    if (props.mode) {
      setLoader(true);
      let data = {
        language,
      };
      comnPost('v2/updateProfile', data)
        .then(res => {
          AsyncStorage.setItem('isUpdated', 'true');
        })
        .catch(err => {});
      i18n.changeLanguage(language);
      AsyncStorage.setItem('isLangChanged', 'true');
      refreshOption();
    } else {
      setShowOnlineMode(true);
    }
  };

  const closePopup = () => {
    setIsAlert(false);
  };

  return (
    <View>
      <GlobalText
        text={t('CHIPS.CHANGE_LANGUAGE')}
        style={{textAlign: 'left'}}
      />
      <Dropdown
        style={[styles.dropdown, isFocus && {borderColor: 'blue'}]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        itemTextStyle={styles.itemTextStyle}
        dropdownTextStyle={styles.dropdownText}
        iconStyle={styles.dropdownIcon}
        data={list}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? 'Select item' : '...'}
        value={language}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={item => {
          setLanguage(item.value);
          setIsFocus(false);
        }}
      />
      <TextButton
        title={t('BUTTON.SAVE')}
        buttonView={styles.langButtonStyle}
        titleStyle={styles.buttonTitleStyle}
        onPress={saveLang}
      />
      <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />
      <ComingSoon
        message={t('ON_UPDATE_PROFILE')}
        visible={showOnlineMode}
        toggleOverlay={() => setShowOnlineMode(false)}
      />
    </View>
  );
};

const mapStateToProps = state => {
  return {
    mode: state.commonState.mode,
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(ChangeLang);
