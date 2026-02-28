/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('@react-native-firebase/analytics', () => {
  return () => ({
    setAnalyticsCollectionEnabled: jest.fn(),
  });
});

jest.mock('@react-native-firebase/app', () => {
  return {};
});

jest.mock('react-native-android-location-enabler', () => ({
  checkLocationEnabled: jest.fn(),
  requestResolutionSettings: jest.fn(),
}));

jest.mock('react-native-version-check', () => ({
  needUpdate: jest.fn(() => Promise.resolve({isNeeded: false})),
  getCurrentVersion: jest.fn(() => '0.0.1'),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({isConnected: true})),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({})),
    signOut: jest.fn(() => Promise.resolve()),
  },
  GoogleSigninButton: () => null,
}));

jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn(() => '0.0.1'),
  getBuildNumber: jest.fn(() => '1'),
  getDeviceId: jest.fn(() => 'test-device'),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('@env', () => ({
  APP_URL: '',
  API_PATH: '',
  API_PATH_ADMIN: '',
  FTP_PATH: '',
  FTP_PATH1: '',
  GOOGLE_WEB_CLIENT_ID: '',
  GOOGLE_API: '',
  GOOGLE_API_KEY: '',
}), {virtual: true});
