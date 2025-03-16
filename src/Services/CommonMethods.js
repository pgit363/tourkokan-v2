import {BackHandler, ToastAndroid} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import STRING from './Constants/STRINGS';

let lastBackPressed = 0;

export const goBackHandler = navigation => {
  return BackHandler.addEventListener(STRING.EVENT.HARDWARE_BACK_PRESS, () =>
    backPage(navigation),
  );
};

export const backPage = navigation => {
  navigation.goBack();
  return true;
};

export const navigateTo = (navigation, page, params) => {
  navigation.navigate(page, params);
  return true;
};

export const checkLogin = async navigation => {
  if (
    (await AsyncStorage.getItem(STRING.STORAGE.ACCESS_TOKEN)) == null ||
    (await AsyncStorage.getItem(STRING.STORAGE.ACCESS_TOKEN)) == ''
  ) {
    navigateTo(navigation, STRING.SCREEN.LANG_SELECTION);
  }
};

export const exitApp = () => {
  const currentTime = new Date().getTime();

  if (currentTime - lastBackPressed < 2000) {
    BackHandler.exitApp();
    return false;
  } else {
    ToastAndroid.show(STRING.PRESS_BACK, ToastAndroid.SHORT);
    lastBackPressed = currentTime;
    return true;
  }
};
