import React, {useEffect} from 'react';
import {View} from 'react-native';
import {checkLogin, goBackHandler} from '../Services/CommonMethods';

const SearchScreen = ({navigation}) => {
  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  return <View />;
};

export default SearchScreen;
