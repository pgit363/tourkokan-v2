import axios from 'axios';
import Path from './BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import STRING from '../Constants/STRINGS';
import NetInfo from '@react-native-community/netinfo';
import {navigateTo} from '../CommonMethods';
import {API_PATH} from '@env';

export const comnGet = async (url, apiToken, navigation) => {
  let myUrl = API_PATH + url;
  const config = {
    headers: {Authorization: `Bearer ${apiToken}`},
  };
  console.log('url:: ', myUrl);
  try {
    const res = await axios.get(myUrl, config);
    return res;
  } catch (err) {
    if (err.response?.status == 401) {
      await AsyncStorage.clear();
      navigateTo(navigation, STRING.SCREEN.LANG_SELECTION);
    }
    return err;
  }
};

export const comnPost = async (url, data, navigation) => {
  const myUrl = API_PATH + url;
  const token = await AsyncStorage.getItem(STRING.STORAGE.ACCESS_TOKEN);
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  console.log(myUrl);
  try {
    const res = await axios.post(myUrl, data, config);
    return res;
  } catch (err) {
    if (err.response?.status == 401) {
      await AsyncStorage.clear();
      if (navigation) {
        navigateTo(navigation, STRING.SCREEN.LANG_SELECTION);
      }
    }
    return err;
  }
};

export const comnPut = async (url, data, navigation) => {
  const myUrl = API_PATH + url;
  const token = await AsyncStorage.getItem(STRING.STORAGE.ACCESS_TOKEN);
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  console.log(myUrl);
  try {
    const res = await axios.put(myUrl, data, config);
    return res;
  } catch (err) {
    if (err.response?.status == 401) {
      await AsyncStorage.clear();
      navigateTo(navigation, STRING.SCREEN.LANG_SELECTION);
    }
    return err;
  }
};

export const comnDel = async (url, data, navigation) => {
  const myUrl = API_PATH + url;
  const token = await AsyncStorage.getItem(STRING.STORAGE.ACCESS_TOKEN);
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  console.log(myUrl);
  try {
    const res = await axios.delete(myUrl, {data, ...config});
    return res;
  } catch (err) {
    if (err.response?.status == 401) {
      await AsyncStorage.clear();
      navigateTo(navigation, STRING.SCREEN.LANG_SELECTION);
    }
    return err;
  }
};

export const login = async () => {
  let data = {
    email: 'test@gmail.com',
    password: 'Test@123',
  };
  try {
    const res = await axios.post('/auth/login', data);
    return res.data.access_token;
  } catch (err) {
    console.error('Login error: ', err);
    return err;
  }
};

export const isOffline = async () => {
  const state = await NetInfo.fetch();
  return !state.isConnected;
};

export const saveToStorage = async (name, data) => {
  try {
    await AsyncStorage.setItem(name, data);
    return true;
  } catch (err) {
    console.error('Storage error: ', err);
    return false;
  }
};

export const getFromStorage = async name => {
  try {
    return await AsyncStorage.getItem(name);
  } catch (err) {
    console.error('Get from storage error: ', err);
    return null;
  }
};

export const removeFromStorage = async name => {
  try {
    await AsyncStorage.removeItem(name);
    return true;
  } catch (err) {
    console.error('Remove from storage error: ', err);
    return false;
  }
};

export const dataSync = async (name, callBack, online) => {
  console.log(
    ' = = = ',
    (await isOffline()) || !online,
    '  ',
    await isOffline(),
    '  ',
    !online,
  );

  if ((await isOffline()) || !online) {
    console.log('name, ', name);
    const storedData = await getFromStorage(name);
    if (storedData) {
      return storedData;
    } else {
      return await isOffline();
    }
  } else {
    // Check if callBack is a function before calling it
    if (typeof callBack === 'function') {
      try {
        callBack();
      } catch (err) {
        console.error('Error in callBack execution: ', err);
      }
    } else {
      console.error('Error: callBack is not a function');
    }
  }
};
