import React, {useState} from 'react';
import {View} from 'react-native';
import {ProfileFields} from '../../../Services/Constants/FIELDS';
import TextField from '../../Customs/TextField';
import styles from './Styles';
import TextButton from '../../Customs/Buttons/TextButton';
import Feather from 'react-native-vector-icons/Feather';
import {useTranslation} from 'react-i18next';
import {comnPost, getFromStorage} from '../../../Services/Api/CommonServices';
import Popup from '../Popup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connect} from 'react-redux';
import ComingSoon from '../ComingSoon';
import NetInfo from '@react-native-community/netinfo';

const UpdateProfile = ({
  user,
  phone,
  uploadImage,
  refreshOption,
  setLoader,
  offline,
  ...props
}) => {
  const {t} = useTranslation();

  const [email, setEmail] = useState(user);
  const [mobile, setMobile] = useState(phone);
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showOnlineMode, setShowOnlineMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const setValue = (val, isVal, index) => {
    switch (index) {
      case 0:
        setEmail(val);
        break;
      case 1:
        setMobile(val);
        break;
    }
  };

  const getValue = i => {
    switch (i) {
      case 0:
        return email;
      case 1:
        return mobile;
    }
  };

  const save = () => {
    if (isSaving) return;
    setIsSaving(true);

    setTimeout(async () => {
      setLoader(true);
      try {
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
          setLoader(false);
          setIsSaving(false);
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

        // Proceed with the rest of the save logic if mode is online
        if (mode) {
          let data = {
            email,
            ...(mobile && {mobile}), // Only include mobile if available
            profile_picture: uploadImage,
          };

          try {
            const res = await comnPost('v2/updateProfile', data);

            if (res.data.success) {
              await AsyncStorage.setItem('isUpdated', 'true');
              setLoader(false);
              setIsSaving(false);
              refreshOption(res.data.data);
            } else {
              setIsAlert(true);
              setAlertMessage(
                res.data.message?.email ||
                  res.data.message?.mobile ||
                  res.data?.message ||
                  t('NETWORK'),
              );
              setLoader(false);
              setIsSaving(false);
            }
          } catch (err) {
            setIsAlert(true);
            setAlertMessage(t('ALERT.WENT_WRONG'));
            setLoader(false);
            setIsSaving(false);
          }
        } else {
          setShowOnlineMode(true);
          setLoader(false);
          setIsSaving(false);
        }
      } catch (error) {
        setLoader(false);
        setIsSaving(false);
      }
    }, 100);
  };

  const closePopup = () => {
    setIsAlert(false);
  };

  return (
    <View>
      {ProfileFields.map((field, index) => {
        return (
          <TextField
            key={field.id || index.toString()}
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
            leftIcon={
              <Feather
                name={field.leftIcon}
                size={24}
                style={styles.leftIcon}
              />
            }
          />
        );
      })}

      <View>
        <TextButton
          title={t('BUTTON.SAVE')}
          buttonView={styles.profileButtonStyle}
          titleStyle={styles.buttonTitleStyle}
          onPress={save}
          disabled={isSaving}
        />
      </View>
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

export default connect(mapStateToProps, mapDispatchToProps)(UpdateProfile);
