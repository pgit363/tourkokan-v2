import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import ComingSoon from './ComingSoon';
import {useTranslation} from 'react-i18next';

const CheckNet = ({isOff}) => {
  const {t} = useTranslation();

  const [isConnected, setIsConnected] = useState(isOff);

  return (
    <View>
      <ComingSoon
        message={t('NO_INTERNET')}
        visible={isConnected}
        toggleOverlay={() => setIsConnected(false)}
      />
    </View>
  );
};

export default CheckNet;
