import React, {useEffect} from 'react';
import {View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../Components/Common/Header';
import COLOR from '../Services/Constants/COLORS';
import DIMENSIONS from '../Services/Constants/DIMENSIONS';
import {backPage, checkLogin, goBackHandler} from '../Services/CommonMethods';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';

const BusTimings = ({navigation}) => {
  const {t} = useTranslation();

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    return () => {
      backHandler.remove();
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: COLOR.white}}>
      <Header
        name={t('HEADER.BUS_TIMINGS')}
        startIcon={
          <Ionicons
            name="chevron-back-outline"
            color={COLOR.black}
            size={DIMENSIONS.userIconSize}
            onPress={() => backPage(navigation)}
          />
        }
      />
    </SafeAreaView>
  );
};

export default BusTimings;
