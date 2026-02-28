/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {View, ScrollView} from 'react-native';
import SmallCard from '../../Components/Customs/SmallCard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {connect} from 'react-redux';
import Loader from '../../Components/Customs/Loader';
import Header from '../../Components/Common/Header';
import {setLoader} from '../../Reducers/CommonActions';
import {comnPost} from '../../Services/Api/CommonServices';
import {
  backPage,
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import {useTranslation} from 'react-i18next';

const contentContainerStyle = {flex: 1, alignItems: 'center'};
const cardsRowStyle = {flexDirection: 'row'};

const Place_catList = ({navigation, ...props}) => {
  const {t} = useTranslation();

  const [place_cats, setPlace_cats] = useState([]);

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    props.setLoader(true);
    getList();
    return () => {
      backHandler.remove();
    };
  }, []);

  const getList = () => {
    comnPost('v2/place_cats', props.access_token)
      .then(res => {
        setPlace_cats(res.data.data.data);
        props.setLoader(false);
      })
      .catch(() => {
        props.setLoader(false);
      });
  };

  const handleSmallCardClick = id => {
    navigateTo(navigation, t('SCREEN.STOP_DETAILS'), {id});
  };

  return (
    <ScrollView>
      <View style={contentContainerStyle}>
        <Loader />
        <Header
          name={t('HEADER.PLACE_CATEGORIES')}
          startIcon={
            <Ionicons
              name="chevron-back-outline"
              color={COLOR.black}
              size={DIMENSIONS.userIconSize}
              onPress={() => backPage(navigation)}
            />
          }
        />
        <View style={cardsRowStyle}>
          {place_cats.map(place_cat => (
            <SmallCard
              Icon={
                <Ionicons
                  name="bus"
                  color={COLOR.yellow}
                  size={DIMENSIONS.iconSize}
                />
              }
              title={place_cat.name}
              onPress={() => handleSmallCardClick(place_cat.id)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoader(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Place_catList);
