import axios from 'axios';
import { BackHandler } from 'react-native';
import { showAlert } from '../CommonMethods';

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
  showAlert(
    'Maintenance Mode',
    'App is in maintenance mode. Please try again later.',
    'error',
    [{ text: 'Close App', onPress: () => { isMaintenanceAlertVisible = false; BackHandler.exitApp(); } }],
  );
};