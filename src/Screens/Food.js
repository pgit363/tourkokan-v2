/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect} from 'react';
import TopComponent from '../Components/Common/TopComponent';
import Loader from '../Components/Customs/Loader';
import {checkLogin, goBackHandler} from '../Services/CommonMethods';
import {SafeAreaView} from 'react-native-safe-area-context';
import COLOR from '../Services/Constants/COLORS';

const screenStyle = {flex: 1, backgroundColor: COLOR.white};

const Food = ({navigation, ...props}) => {
  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    return () => {
      backHandler.remove();
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={screenStyle}>
      <Loader />
      <TopComponent navigation={navigation} />
    </SafeAreaView>
  );
};

export default Food;
