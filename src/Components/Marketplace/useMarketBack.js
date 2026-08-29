/**
 * Registers the app's hardware-back handler (goBackHandler → backPage) for the
 * screen's focused lifetime — the same pattern the add-site / list screens use.
 */
import {useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {goBackHandler} from '../../Services/CommonMethods';

export const useMarketBack = navigation => {
  useFocusEffect(
    useCallback(() => {
      const handler = goBackHandler(navigation);
      return () => handler.remove();
    }, [navigation]),
  );
};
