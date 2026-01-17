import React, {useEffect} from 'react';
import {View} from 'react-native';
import {checkLogin, goBackHandler} from '../Services/CommonMethods';

const SearchScreen = () => {
  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    return () => {
      backHandler.remove();
    };
  }, []);

  return <View></View>;
};

export default SearchScreen;
