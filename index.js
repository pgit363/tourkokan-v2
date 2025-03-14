/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import 'react-native-reanimated'; // this line can come after gesture-handler

AppRegistry.registerComponent(appName, () => App);
