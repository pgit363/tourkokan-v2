import {BackHandler, Platform, ToastAndroid} from 'react-native';
import {CommonActions} from '@react-navigation/native';
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


/**
 * Run a navigation action AFTER any RN <Modal> on screen has finished
 * dismissing. The app-wide Loader (react-native-loading-spinner-overlay) and
 * the alert Popup are both RN Modals; on iOS, a navigate/reset dispatched in
 * the same tick as the modal's dismissal is silently dropped by native-stack —
 * which is exactly "login succeeded but never left the screen". Android does
 * not have this constraint, so it runs immediately there.
 */
export const afterModalDismissed = fn => {
  setTimeout(fn, Platform.OS === 'ios' ? 500 : 0);
};


/**
 * Land on Home after a successful login, REPLACING the auth screen rather than
 * pushing on top of it.
 *
 * navigate('Home') leaves the login screen underneath in the stack. Android has
 * no back gesture there so it never showed, but on iOS the swipe-back gesture
 * pops Home and drops a logged-in user back on the login page. reset() clears
 * the history so there is nothing behind Home to swipe back to.
 *
 * Wrapped in afterModalDismissed because the login screens dispatch this while
 * an RN <Modal> (the spinner overlay or the alert Popup) is dismissing, and iOS
 * silently drops a navigation issued in that same tick.
 */
export const resetToHome = (navigation, homeRouteName) => {
  afterModalDismissed(() =>
    navigation.dispatch(
      CommonActions.reset({index: 0, routes: [{name: homeRouteName}]}),
    ),
  );
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
    // ToastAndroid is undefined on iOS — calling it throws. iOS has no
    // hardware back button so this path is Android-only in practice, but guard
    // it so a stray call can never crash the app.
    if (Platform.OS === 'android') {
      ToastAndroid.show(STRING.PRESS_BACK, ToastAndroid.SHORT);
    }
    lastBackPressed = currentTime;
    return true;
  }
};

export const showAlert = (title, message, type = 'info', buttons = null) => {
  showThemedAlert(title, message, type, buttons);
};
