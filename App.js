import 'react-native-gesture-handler';
import {StatusBar} from 'expo-status-bar';
import React, {useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import store from './Store';
import {View, Image, BackHandler, Linking} from 'react-native';
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
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState(STRING.SCREEN.EMAIL);
  const [updateApp, setUpdateApp] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const [[isFirstTimeValue, token]] = await Promise.all([
        Promise.all([
          getFromStorage(STRING.STORAGE.IS_FIRST_TIME),
          getFromStorage(STRING.STORAGE.ACCESS_TOKEN),
        ]),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);
      setIsFirstTime(isFirstTimeValue);
      setInitialRoute(token ? STRING.SCREEN.HOME : STRING.SCREEN.EMAIL);
      setLoading(false);
      SplashScreen.hide();
    };
    bootstrap();
    setupAxiosInterceptors();
    callAPI();
  }, []);

  const callAPI = () => {
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
      const res = await comnPost('v2/landingpage', {site_id});
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
    saveToStorage(STRING.STORAGE.ROUTES_RESPONSE, JSON.stringify(resp.routes));
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

  if (loading) {
    return (
      <View style={{flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center'}}>
        <Image
          source={require('./src/Assets/Images/Logos/tourkokan-logo.png')}
          style={styles.introLogo}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (isFirstTime === 'false') {
    return (
      <Provider store={store}>
        <UpdateContext.Provider value={{isUpdatePending: updateApp}}>
          <SafeAreaProvider>
            <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
            <StackNavigator initialRoute={initialRoute} />
            <UpdateOverlay />
          </SafeAreaProvider>
        </UpdateContext.Provider>
      </Provider>
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
      <OnboardingScreen onComplete={() => setIsFirstTime('false')} />
      <UpdateOverlay />
    </>
  );
}
