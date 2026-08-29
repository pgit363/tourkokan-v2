import {BackHandler, ToastAndroid} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import STRING from './Constants/STRINGS';
import {showThemedAlert} from '../Components/Common/GlobalAlert';
import {createLogger} from './Logger';

const log = createLogger('CommonMethods');

let lastBackPressed = 0;

export const goBackHandler = navigation => {
  return BackHandler.addEventListener(STRING.EVENT.HARDWARE_BACK_PRESS, () =>
    backPage(navigation),
  );
};

export const backPage = navigation => {
  // Always return true so the press is consumed — if this ever returned a
  // falsy/undefined (e.g. goBack threw on a stale navigation ref), the event
  // would fall through to the OS and CLOSE THE APP. Guard with canGoBack so a
  // root screen no-ops instead of erroring.
  try {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else if (navigation?.goBack) {
      navigation.goBack();
    }
  } catch (e) {
    log.warn('[backPage] goBack failed', e);
  }
  return true;
};

export const navigateTo = (navigation, page, params) => {
  navigation.navigate(page, params);
  return true;
};

export const checkLogin = async navigation => {
  const token = await AsyncStorage.getItem(STRING.STORAGE.ACCESS_TOKEN);
  if (!token) {
    try {
      navigation.reset({index: 0, routes: [{name: STRING.SCREEN.EMAIL}]});
    } catch (e) { log.warn("[caught]", e); }
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

export const showAlert = (title, message, type = 'info', buttons = null) => {
  showThemedAlert(title, message, type, buttons);
};
