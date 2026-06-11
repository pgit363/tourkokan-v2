import 'react-native-gesture-handler';
import {LogBox} from 'react-native';
import {StatusBar} from 'expo-status-bar';

LogBox.ignoreLogs(['useInsertionEffect must not schedule updates']);
import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import store from './Store';
import {View, Image, BackHandler, Linking, AppState, StyleSheet} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import StackNavigator from './src/Navigators/StackNavigator';
import STRING from './src/Services/Constants/STRINGS';
import styles from './src/Screens/Styles';
import analytics from '@react-native-firebase/analytics';
import './src/localization/i18n';
import {
  comnPost,
  dataSync,
  getFromStorage,
  saveToStorage,
} from './src/Services/Api/CommonServices';
import {useTranslation} from 'react-i18next';
import {Overlay} from '@rneui/themed';
import {initializeApp, getApps} from 'firebase/app';
import {setupAxiosInterceptors} from './src/Services/Api/AxiosInterceptor';
import VersionCheck from 'react-native-version-check';
import {APP_URL} from '@env';
import {UpdateContext} from './src/Context/UpdateContext';
import GlobalText from './src/Components/Customs/Text';
import TextButton from './src/Components/Customs/Buttons/TextButton';
import OnboardingScreen from './src/Screens/OnboardingScreen';
import {GlobalAlertProvider} from './src/Components/Common/GlobalAlert';
import ErrorBoundary from './src/Components/Common/ErrorBoundary';
import OrientationNotice from './src/Components/Common/OrientationNotice';

const firebaseConfig = {
  apiKey: 'AIzaSyDT01wLV3kMfc6OuQwK5f1UwAeZGOFviR4',
  authDomain: 'tourkokan-658d1.firebaseapp.com',
  projectId: 'tourkokan-658d1',
  storageBucket: 'tourkokan-658d1.appspot.com',
  appId: '1:941471956439:android:24306c81153b4a533c5f92',
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

analytics().setAnalyticsCollectionEnabled(true);

export default function App() {
  const {t} = useTranslation();

  const [isFirstTime, setIsFirstTime] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState(STRING.SCREEN.EMAIL);
  const [updateApp, setUpdateApp] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);
  const [appInBackground, setAppInBackground] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      setAppInBackground(state !== 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      console.log('[FLOW][App] bootstrap: start');
      const [[isFirstTimeValue, token]] = await Promise.all([
        Promise.all([
          getFromStorage(STRING.STORAGE.IS_FIRST_TIME),
          getFromStorage(STRING.STORAGE.ACCESS_TOKEN),
        ]),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);
      console.log('[FLOW][App] bootstrap: isFirstTime=', isFirstTimeValue, 'hasToken=', !!token);
      setIsFirstTime(isFirstTimeValue);
      setHasToken(!!token);
      setInitialRoute(token ? STRING.SCREEN.HOME : STRING.SCREEN.EMAIL);
      setLoading(false);
      SplashScreen.hide();
      if (token) {
        console.log('[FLOW][App] bootstrap: token present → callAPI() [landingpage trigger #App-bootstrap]');
        callAPI();
      } else {
        console.log('[FLOW][App] bootstrap: no token → NOT calling landingpage');
      }
    };
    bootstrap();
    setupAxiosInterceptors();
  }, []);

  const callAPI = () => {
    console.log('[FLOW][App] callAPI → dataSync(landingpage)');
    dataSync(STRING.STORAGE.LANDING_RESPONSE, callLandingPageAPI, true).then(() => {});
  };

  const needUpdate = (current, latest) => {
    if (!current || !latest) return false;
    const v1 = current.split('.').map(Number);
    const v2 = latest.split('.').map(Number);
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num1 < num2) return true;
      if (num1 > num2) return false;
    }
    return false;
  };

  const exitUpdate = () => {
    if (isForceUpdate) {
      BackHandler.exitApp();
    } else {
      setUpdateApp(false);
    }
  };

  const continueUpdate = () => {
    setUpdateApp(false);
    Linking.openURL(APP_URL);
  };

  const callLandingPageAPI = async site_id => {
    try {
      console.log('[FLOW][App] ►► HITTING v2/landingpage (App.callLandingPageAPI) site_id=', site_id);
      const res = await comnPost('v2/landingpage', {site_id});
      console.log('[FLOW][App] ◄◄ v2/landingpage returned (App.callLandingPageAPI)');
      if (res && res.data && res.data.data) {
        setOfflineData(res.data.data);

        if (res.data.data.version) {
          const currentVersion = VersionCheck.getCurrentVersion();
          const latestVersion = res.data.data.version.version_number;
          const minSupportedVersion = res.data.data.version.min_supported_version;

          if (needUpdate(currentVersion, latestVersion)) {
            let shouldForce = false;
            if (minSupportedVersion) {
              shouldForce = needUpdate(currentVersion, minSupportedVersion);
            } else {
              const v1 = currentVersion.split('.').map(Number);
              const v2 = latestVersion.split('.').map(Number);
              shouldForce = v2[0] > v1[0];
            }
            setIsForceUpdate(shouldForce);
            setUpdateApp(true);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const setOfflineData = resp => {
    saveToStorage(STRING.STORAGE.LANDING_RESPONSE, JSON.stringify(resp));
    saveToStorage(STRING.STORAGE.CATEGORIES_RESPONSE, JSON.stringify(resp.categories));
    saveToStorage(STRING.STORAGE.CITIES_RESPONSE, JSON.stringify(resp.cities));
    saveToStorage(STRING.STORAGE.EMERGENCY, JSON.stringify(resp.emergencies));
    saveToStorage(STRING.STORAGE.QUERIES, JSON.stringify(resp.queries));
    saveToStorage(STRING.STORAGE.GALLERY, JSON.stringify(resp.gallery));
    saveToStorage(STRING.STORAGE.PROFILE_RESPONSE, JSON.stringify(resp.user));
    saveToStorage(STRING.STORAGE.USER_NAME, resp.user.name);
    saveToStorage(STRING.STORAGE.USER_ID, JSON.stringify(resp.user.id));
    saveToStorage(STRING.STORAGE.USER_EMAIL, resp.user.email);
  };

  const UpdateOverlay = () => (
    <Overlay
      style={styles.locationModal}
      isVisible={updateApp}
      onBackdropPress={() => !isForceUpdate && setUpdateApp(false)}>
      <GlobalText
        text={
          isForceUpdate
            ? t('ALERT.MAJOR_UPDATE') || 'Major update available. Please update to continue.'
            : t('ALERT.APP_VERSION')
        }
        style={styles.locationModal}
      />
      <View style={styles.flexRow}>
        <TextButton
          title={isForceUpdate ? t('BUTTON.CLOSE_APP') || 'Close App' : t('BUTTON.LATER') || 'Later'}
          buttonView={styles.logoutButtonStyle}
          titleStyle={styles.locButtonTitle}
          raised={false}
          onPress={() => exitUpdate()}
        />
        <TextButton
          title={t('BUTTON.UPDATE_NOW') || 'Update Now'}
          buttonView={styles.logoutButtonStyle}
          titleStyle={styles.locButtonTitle}
          raised={false}
          onPress={() => continueUpdate()}
        />
      </View>
    </Overlay>
  );

  // Covers the app whenever it leaves the foreground — prevents App Switcher
  // from capturing screen content, and blocks iOS screen recording previews.
  const SecurityOverlay = () =>
    appInBackground ? (
      <View style={secureStyles.overlay}>
        <Image
          source={require('./src/Assets/Images/Logos/tourkokan-logo.png')}
          style={secureStyles.logo}
          resizeMode="contain"
        />
      </View>
    ) : null;

  if (loading) {
    return (
      <View style={{flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center'}}>
        <Image
          source={require('./src/Assets/Images/Logos/tourkokan-logo.png')}
          style={{width: 220, height: 220}}
          resizeMode="contain"
        />
      </View>
    );
  }

  // A logged-in user (token present) has already onboarded — never show the
  // intro again, even if isFirstTime got re-armed to 'true' by the login flow.
  if (isFirstTime === 'false' || hasToken) {
    return (
      <ErrorBoundary>
        <Provider store={store}>
          <UpdateContext.Provider value={{isUpdatePending: updateApp}}>
            <SafeAreaProvider>
              <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
              <StackNavigator initialRoute={initialRoute} />
              <UpdateOverlay />
              <SecurityOverlay />
              <OrientationNotice />
              <GlobalAlertProvider />
            </SafeAreaProvider>
          </UpdateContext.Provider>
        </Provider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
        <OnboardingScreen onComplete={() => setIsFirstTime('false')} />
        <UpdateOverlay />
        <SecurityOverlay />
        <OrientationNotice />
        <GlobalAlertProvider />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const secureStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  logo: {
    width: 180,
    height: 180,
  },
});
