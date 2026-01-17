import React, {useEffect, useState} from 'react';
import {ImageBackground, View} from 'react-native';
import COLOR from '../../Services/Constants/COLORS';
import styles from './Styles';
import {useTranslation} from 'react-i18next';
import GlobalText from '../../Components/Customs/Text';
import {Dropdown} from 'react-native-element-dropdown';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import {navigateTo} from '../../Services/CommonMethods';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LangSelection = ({navigation}) => {
  const {t, i18n} = useTranslation();

  const [list, setList] = useState([
    {label: 'English', value: 'en'},
    {label: 'मराठी', value: 'mr'},
  ]);
  const [language, setLanguage] = useState('en');
  const [isFocus, setIsFocus] = useState(false);

  useEffect(() => {
    saveToken();
  }, []);

  const saveLang = () => {
    i18n.changeLanguage(language);
    navigateTo(navigation, t('SCREEN.EMAIL'));
  };

  const saveToken = async () => {
    ToNavigate();
  };

  const ToNavigate = async () => {
    if (
      (await AsyncStorage.getItem(t('STORAGE.ACCESS_TOKEN'))) == null ||
      (await AsyncStorage.getItem(t('STORAGE.ACCESS_TOKEN'))) == ''
    ) {
      navigateTo(navigation, t('SCREEN.LANG_SELECTION'));
    } else {
      navigateTo(navigation, t('SCREEN.HOME'));
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLOR.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <ImageBackground
        style={styles.loginImage}
        source={require('../../Assets/Images/Intro/login_background.png')}
      />
      <View>
        <GlobalText
          text={t('CHIPS.SELECT_LANGUAGE')}
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
          title={t('BUTTON.CONTINUE')}
          buttonView={styles.langButtonStyle}
          titleStyle={styles.buttonTitleStyle}
          onPress={saveLang}
        />
      </View>
    </View>
  );
};

export default LangSelection;
