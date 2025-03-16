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
import {
  backPage,
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import {useTranslation} from 'react-i18next';

const Place_catList = ({navigation, ...props}) => {
  const {t} = useTranslation();

  const [place_cats, setPlace_cats] = useState([]); // State to store place_cats
  const [error, setError] = useState(null); // State to store error message

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
        setPlace_cats(res.data.data.data); // Update place_cats state with response data
        props.setLoader(false);
      })
      .catch(error => {
        props.setLoader(false);
        setError(error.message); // Update error state with error message
      });
  };

  const handleSmallCardClick = id => {
    navigateTo(navigation, t('SCREEN.STOP_DETAILS'), {id});
  };

  return (
    <ScrollView>
      <View style={{flex: 1, alignItems: 'center'}}>
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
        <View style={{flexDirection: 'row'}}>
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
