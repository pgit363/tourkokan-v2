import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import STRING from '../Constants/STRINGS';
import NetInfo from '@react-native-community/netinfo';
import {navigateTo} from '../CommonMethods';
import {API_PATH} from '@env';

let accessTokenCache = null;
let isAccessTokenHydrated = false;

const getAccessToken = async () => {
  if (isAccessTokenHydrated) {
    return accessTokenCache;
  }
  accessTokenCache = await AsyncStorage.getItem(STRING.STORAGE.ACCESS_TOKEN);
  isAccessTokenHydrated = true;
  return accessTokenCache;
};

const invalidateAccessTokenCache = () => {
  accessTokenCache = null;
  isAccessTokenHydrated = false;
};

const handleUnauthorized = async navigation => {
  invalidateAccessTokenCache();
  await AsyncStorage.clear();
  if (navigation) {
    navigateTo(navigation, STRING.SCREEN.LANG_SELECTION);
  }
};

export const comnGet = async (url, apiToken, navigation) => {
  let myUrl = API_PATH + url;
  const config = {
    headers: {Authorization: `Bearer ${apiToken}`},
  };
  try {
    const res = await axios.get(myUrl, config);
    return res;
  } catch (err) {
    if (err.response?.status === 401) {
      await handleUnauthorized(navigation);
    }
    return err;
  }
};

export const comnPost = async (url, data, navigation) => {
  const myUrl = API_PATH + url;
  const token = await getAccessToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  try {
    const res = await axios.post(myUrl, data, config);
    return res;
  } catch (err) {
    if (err.response?.status === 401) {
      await handleUnauthorized(navigation);
    }
    return err;
  }
};

export const comnPut = async (url, data, navigation) => {
  const myUrl = API_PATH + url;
  const token = await getAccessToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  try {
    const res = await axios.put(myUrl, data, config);
    return res;
  } catch (err) {
    if (err.response?.status === 401) {
      await handleUnauthorized(navigation);
    }
    return err;
  }
};

export const comnDel = async (url, data, navigation) => {
  const myUrl = API_PATH + url;
  const token = await getAccessToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  try {
    const res = await axios.delete(myUrl, {data, ...config});
    return res;
  } catch (err) {
    if (err.response?.status === 401) {
      await handleUnauthorized(navigation);
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
    if (data === null || data === undefined) {
      return false;
    }
    await AsyncStorage.setItem(name, data);
    if (name === STRING.STORAGE.ACCESS_TOKEN) {
      accessTokenCache = data;
      isAccessTokenHydrated = true;
    }
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
    if (name === STRING.STORAGE.ACCESS_TOKEN) {
      invalidateAccessTokenCache();
    }
    return true;
  } catch (err) {
    console.error('Remove from storage error: ', err);
    return false;
  }
};

// export const dataSync = async (name, callBack, online) => {
//   console.log(
//     ' = = = ',
//     (await isOffline()) || !online,
//     '  ',
//     await isOffline(),
//     '  ',
//     !online,
//   );

//   if ((await isOffline()) || !online) {
//     console.log('name, ', name);
//     const storedData = await getFromStorage(name);
//     if (storedData) {
//       return storedData;
//     } else {
//       return await isOffline();
//     }
//   } else {
//     // Check if callBack is a function before calling it
//     if (typeof callBack === 'function') {
//       try {
//         callBack();
//       } catch (err) {
//         console.error('Error in callBack execution: ', err);
//       }
//     } else {
//       console.error('Error: callBack is not a function');
//     }
//   }
// };


export const dataSyncResult = async (name, callBack = () => {}, online) => {
  const offline = await isOffline();
  const canCall = typeof callBack === 'function';

  if (offline || !online) {
    const storedData = await getFromStorage(name);
    return {
      ok: Boolean(storedData),
      source: 'cache',
      data: storedData,
      offline: true,
    };
  }

  if (!canCall) {
    return {
      ok: false,
      source: 'invalid_callback',
      data: null,
      offline: false,
    };
  }

  try {
    const liveData = await callBack();
    if (liveData !== null && liveData !== undefined) {
      return {
        ok: true,
        source: 'network',
        data: liveData,
        offline: false,
      };
    }

    const cachedData = await getFromStorage(name);
    return {
      ok: Boolean(cachedData),
      source: cachedData ? 'cache_fallback' : 'empty',
      data: cachedData,
      offline: false,
    };
  } catch (err) {
    console.warn('Error in callBack execution: ', err);
    const cachedData = await getFromStorage(name);
    return {
      ok: Boolean(cachedData),
      source: cachedData ? 'cache_fallback' : 'error',
      data: cachedData,
      offline: false,
    };
  }
};

export const dataSync = async (name, callBack = () => {}, online) => {
  const result = await dataSyncResult(name, callBack, online);
  if (result.data !== null && result.data !== undefined) {
    return result.data;
  }
  return result.offline || null;
};
