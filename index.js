/**
 * @format
 */

import React, {Suspense} from 'react';
import {AppRegistry, View, Image} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import 'react-native-reanimated'; // this line can come after gesture-handler

const AppWithSuspense = () => (
  <Suspense
    fallback={
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff'}}>
        <Image
          source={require('./src/Assets/Images/Logos/tourkokan-logo.png')}
          style={{width: 200, height: 200, resizeMode: 'contain', marginBottom: 20}}
        />
      </View>
    }>
    <App />
  </Suspense>
);

AppRegistry.registerComponent(appName, () => AppWithSuspense);
