import axios from 'axios';
import { Alert, BackHandler } from 'react-native';

let isMaintenanceAlertVisible = false;

export const setupAxiosInterceptors = () => {
  // Add a response interceptor
  axios.interceptors.response.use(
    (response) => {
      // Check if the API returned 503 (Maintenance) even if status is 200 (depending on backend wrapper)
      if (response.status === 503) {
        handleMaintenanceMode();
        return Promise.reject(new Error('Maintenance Mode'));
      }
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 503) {
        handleMaintenanceMode();
      }
      return Promise.reject(error);
    }
  );
};

const handleMaintenanceMode = () => {
  if (isMaintenanceAlertVisible) return;

  isMaintenanceAlertVisible = true;
  Alert.alert(
    'Maintenance Mode',
    'App is in maintenance mode. Please try again later.',
    [{ text: 'Close App', onPress: () => { isMaintenanceAlertVisible = false; BackHandler.exitApp(); } }],
    { cancelable: false }
  );
};