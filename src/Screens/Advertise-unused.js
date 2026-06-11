import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {comnPost} from '../Services/Api/CommonServices';
import {navigateTo} from '../Services/CommonMethods';
import GlobalText from '../Components/Customs/Text';
import styles from './Styles';

const Advertise = ({navigation}) => {
  const [adv, setAdv] = useState('a');
  const [update, setUpdate] = useState('');

  useEffect(() => {
    firstAPI();
  });

  useEffect(() => {
    onUpdate('b');
  }, [adv]);

  const firstAPI = () => {
    comnPost('v1/', data, navigation).then(res => {
      setAdv(res);
    });
  };

  const onUpdate = () => {
    navigateTo(navigation, 'SCreen');
  };

  return (
    <View style={styles.advStyle}>
      <GlobalText text={adv} />
    </View>
  );
};

export default Advertise;
