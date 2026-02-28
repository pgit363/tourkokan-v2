/**
 * @format
 */

import React, {Suspense} from 'react';
import {AppRegistry, View, ActivityIndicator} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-reanimated';
import 'react-native-gesture-handler';

const suspenseFallbackStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
};

const AppWithSuspense = () => (
  <Suspense
    fallback={
      <View style={suspenseFallbackStyle}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    }>
    <App />
  </Suspense>
);

AppRegistry.registerComponent(appName, () => AppWithSuspense);
