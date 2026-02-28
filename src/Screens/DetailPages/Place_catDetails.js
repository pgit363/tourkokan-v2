/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {View, ScrollView} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {connect} from 'react-redux';
import {setLoader} from '../../Reducers/CommonActions';
import Loader from '../../Components/Customs/Loader';
import Header from '../../Components/Common/Header';
import {
  backPage,
  checkLogin,
  goBackHandler,
} from '../../Services/CommonMethods';
import GlobalText from '../../Components/Customs/Text';
import {comnPost} from '../../Services/Api/CommonServices';

const detailsContainerStyle = {flex: 1, alignItems: 'center'};
const detailsRowStyle = {flexDirection: 'row'};

const Place_catDetails = ({navigation, route, ...props}) => {
  const [place_cat, setPlace_cat] = useState([]);

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    props.setLoader(true);
    getDetails();
    return () => {
      backHandler.remove();
    };
  }, []);

  const getDetails = () => {
    comnPost(`v2/place_cat/${route.params.id}`, props.access_token)
      .then(res => {
        setPlace_cat(res.data.data);
        props.setLoader(false);
      })
      .catch(() => {
        props.setLoader(false);
      });
  };

  return (
    <ScrollView>
      <Loader />
      <Header
        name={place_cat.name}
        startIcon={
          <Ionicons
            name="chevron-back-outline"
            color={COLOR.black}
            size={DIMENSIONS.userIconSize}
            onPress={() => backPage(navigation)}
          />
        }
      />
      <View style={detailsContainerStyle}>
        <View style={detailsRowStyle}>
          <GlobalText text={place_cat.name} />
          <GlobalText text={JSON.stringify(place_cat)} />
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

export default connect(mapStateToProps, mapDispatchToProps)(Place_catDetails);
