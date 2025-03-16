import React, {useEffect, useState} from 'react';
import {EmailOtpFields} from '../../../Services/Constants/FIELDS';
import {TouchableOpacity, View} from 'react-native';
import TextField from '../../../Components/Customs/TextField';
import TextButton from '../../../Components/Customs/Buttons/TextButton';
import Feather from 'react-native-vector-icons/Feather';
import styles from '../Styles';
import COLOR from '../../../Services/Constants/COLORS';
import GlobalText from '../../../Components/Customs/Text';
import {useTranslation} from 'react-i18next';

const EmailOtp = ({
  setValue,
  getValue,
  Login,
  changeChoice,
  isOtpSent,
  resend,
}) => {
  const {t} = useTranslation();

  const [sec, setSec] = useState(30);
  const [otpSent, setOtpSent] = useState(isOtpSent);

  const sendOtp = () => {
    setSec(30);
    resend();
    setOtpSent(true);
  };

  useEffect(() => {
    let intervalId;
    if (otpSent) {
      intervalId = setInterval(timer, 1000);
    }
    return () => clearInterval(intervalId);
  }, [otpSent, sec]);

  const timer = () => {
    if (sec) {
      setSec(sec - 1);
    }
  };

  return (
    <View style={{justifyContent: 'center', alignItems: 'center'}}>
      <TouchableOpacity onPress={changeChoice}>
        <GlobalText text={t('CHANGE')} style={styles.changeOption} />
      </TouchableOpacity>
      {EmailOtpFields.map((field, index) => {
        return (
          <TextField
            name={field.name}
            label={field.name}
            placeholder={field.placeholder}
            fieldType={field.type}
            length={field.length}
            required={field.required}
            disabled={index == 1 && !otpSent}
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
      <View style={{marginVertical: 10}}>
        {otpSent ? (
          sec >= 1 ? (
            <GlobalText
              text={`${t('RESEND_WITHIN')}${sec > 9 ? sec : '0' + sec})`}
              style={styles.whiteText}
            />
          ) : (
            <View>
              <GlobalText style={styles.whiteText} text={t('DIDNT_RECEIVE')} />
              <TouchableOpacity onPress={() => resend()}>
                <GlobalText text={t('RESEND')} style={styles.whiteText} />
              </TouchableOpacity>
            </View>
          )
        ) : (
          <TextButton
            title={t('BUTTON.SEND_OTP')}
            buttonView={styles.buttonView}
            containerStyle={styles.buttonContainer}
            buttonStyle={styles.buttonStyle}
            titleStyle={styles.buttonTitle}
            disabled={false}
            raised={true}
            onPress={() => sendOtp()}
          />
        )}
      </View>
      <TextButton
        title={t('BUTTON.LOGIN')}
        buttonView={styles.buttonView}
        containerStyle={styles.buttonContainer}
        buttonStyle={styles.buttonStyle}
        titleStyle={styles.buttonTitle}
        disabled={false}
        raised={true}
        onPress={() => Login()}
      />
    </View>
  );
};

export default EmailOtp;
