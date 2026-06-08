import React, {useState} from 'react';
import {View} from 'react-native';
import {ProfileFields} from '../../../Services/Constants/FIELDS';
import TextField from '../../Customs/TextField';
import styles from './Styles';
import TextButton from '../../Customs/Buttons/TextButton';
import Feather from 'react-native-vector-icons/Feather';
import {useTranslation} from 'react-i18next';
import {comnPost} from '../../../Services/Api/CommonServices';
import Popup from '../Popup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connect} from 'react-redux';
import {useConnectivityGate} from '../useConnectivityGate';

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
  const [isSaving, setIsSaving] = useState(false);
  const {modal: connectivityModal, ensureOnline} = useConnectivityGate();

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
    // Offline mode / no internet → standard "Go Online" gate (same as everywhere).
    ensureOnline(() => {
      setIsSaving(true);
      setTimeout(async () => {
        setLoader(true);
        const data = {
          email,
          ...(mobile && {mobile}), // Only include mobile if available
          profile_picture: uploadImage,
        };
        try {
          const res = await comnPost('v2/updateProfile', data);
          if (res.data.success) {
            await AsyncStorage.setItem('isUpdated', 'true');
            refreshOption(res.data.data);
          } else {
            setIsAlert(true);
            setAlertMessage(
              res.data.message?.email ||
                res.data.message?.mobile ||
                res.data?.message ||
                t('NETWORK'),
            );
          }
        } catch (err) {
          setIsAlert(true);
          setAlertMessage(t('ALERT.WENT_WRONG'));
        } finally {
          setLoader(false);
          setIsSaving(false);
        }
      }, 100);
    });
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
      {connectivityModal}
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
