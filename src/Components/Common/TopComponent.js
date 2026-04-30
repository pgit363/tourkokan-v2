import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';
import {getFromStorage} from '../../Services/Api/CommonServices';
import {FTP_PATH} from '@env';
import STRING from '../../Services/Constants/STRINGS';

const {width: SW} = Dimensions.get('window');

const C = {
  oceanDeep: '#0D3D4A',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.15)',
  glassBorder: 'rgba(255,255,255,0.22)',
  whiteDim: 'rgba(255,255,255,0.7)',
};

const BTN = 44;

const TopComponent = ({
  navigation,
  currentCity,
  gotoProfile,
  showCities,
  onToggleCities,
  unreadCount = 0,
}) => {
  const {t} = useTranslation();
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      const picture = JSON.parse(
        await getFromStorage(t('STORAGE.PROFILE_PICTURE')),
      );
      setProfilePhoto(picture);
    };
    fetchProfilePhoto();
  }, [t]);

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      <View style={s.row}>
        {/* Left: menu + location */}
        <View style={s.left}>
          <TouchableOpacity
            style={s.glassBtn}
            onPress={() => navigation.openDrawer()}
            activeOpacity={0.75}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="menu" size={22} color={C.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.locationPill}
            onPress={onToggleCities}
            activeOpacity={0.75}>
            <MaterialIcons name="location-pin" size={16} color={C.white} />
            <Text style={s.locationText} numberOfLines={1}>
              {currentCity || t('CITY.SINDHUDURG')}
            </Text>
            <Ionicons
              name={showCities ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={C.whiteDim}
            />
          </TouchableOpacity>
        </View>

        {/* Right: bell + profile */}
        <View style={s.right}>
          <TouchableOpacity
            style={s.glassBtn}
            onPress={() => navigation.navigate(STRING.SCREEN.INBOX)}
            activeOpacity={0.75}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Image
              source={require('../../Assets/Images/bell_icon.webp')}
              style={s.bellIcon}
              resizeMode="contain"
            />
            {unreadCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.profileBtn}
            onPress={gotoProfile}
            activeOpacity={0.8}>
            {profilePhoto ? (
              <Image
                source={{uri: `${FTP_PATH}${profilePhoto}`}}
                style={s.profileImg}
              />
            ) : (
              <Ionicons name="person" size={20} color={C.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: C.oceanDeep,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glassBtn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    width: 30,
    height: 30,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: C.oceanDeep,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.white,
    lineHeight: 12,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 50,
    paddingHorizontal: 13,
    paddingVertical: 9,
    maxWidth: SW * 0.45,
    minWidth: 80,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.white,
    flexShrink: 1,
  },
  profileBtn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImg: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
  },
});

export default TopComponent;
