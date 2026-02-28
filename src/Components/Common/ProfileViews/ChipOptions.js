import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import ProfileChip from '../ProfileChip';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import styles from './Styles';
import COLOR from '../../../Services/Constants/COLORS';
import GlobalText from '../../Customs/Text';
import {useTranslation} from 'react-i18next';
import CodeChip from '../CodeChip';

const ChipOptions = ({
  locationClick,
  profileClick,
  settingsClick,
  logoutClick,
  referralClick,
  uid,
  currentLanguage,
  changeLanguage,
}) => {
  const {t} = useTranslation();

  return (
    <View>
      <ProfileChip
        name={t('CHIPS.LANGUAGE')}
        icon={
          <View style={styles.chipIcon}>
            <FontAwesome name="language" size={20} color={COLOR.white} />
          </View>
        }
        rightElement={
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#E0E0E0',
              borderRadius: 20,
              padding: 3,
              alignItems: 'center',
            }}>
            <TouchableOpacity
              onPress={() => changeLanguage(true)}
              style={{
                backgroundColor:
                  currentLanguage === 'en' ? COLOR.themeBlue : 'transparent',
                borderRadius: 15,
                paddingVertical: 5,
                paddingHorizontal: 12,
              }}>
              <GlobalText
                text="English"
                style={{
                  color: currentLanguage === 'en' ? COLOR.white : COLOR.black,
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => changeLanguage(false)}
              style={{
                backgroundColor:
                  currentLanguage === 'mr' ? COLOR.themeBlue : 'transparent',
                borderRadius: 15,
                paddingVertical: 5,
                paddingHorizontal: 12,
              }}>
              <GlobalText
                text="मराठी"
                style={{
                  color: currentLanguage === 'mr' ? COLOR.white : COLOR.black,
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              />
            </TouchableOpacity>
          </View>
        }
      />
      {/* <ProfileChip
        name={t('CHIPS.UPDATE_LOCATION')}
        icon={
          <View style={styles.chipIcon}>
            <Ionicons name="location-outline" size={20} color={COLOR.white} />
          </View>
        }
        clickChip={locationClick}
      /> */}
      <ProfileChip
        name={t('CHIPS.UPDATE_PROFILE')}
        icon={
          <View style={styles.chipIcon}>
            <Feather name="user" size={20} color={COLOR.white} />
          </View>
        }
        clickChip={profileClick}
      />
      {/* <ProfileChip name={t("CHIPS.SETTINGS")}
                icon={
                    <View style={styles.chipIcon}>
                        <Ionicons
                            name="settings-outline"
                            size={20}
                            color={COLOR.white}
                        />
                    </View>
                }
                clickChip={settingsClick}
            /> */}
      <ProfileChip
        name={t('CHIPS.LOGOUT')}
        icon={
          <View style={styles.chipIcon}>
            <MaterialIcons name="logout" size={20} color={COLOR.white} />
          </View>
        }
        clickChip={logoutClick}
      />
      <CodeChip
        name={t('CHIPS.REFER_EARN')}
        icon={
          <View style={styles.chipIcon}>
            <Feather name="hash" size={20} color={COLOR.white} />
          </View>
        }
        clickChip={referralClick}
      />
    </View>
  );
};

export default ChipOptions;
