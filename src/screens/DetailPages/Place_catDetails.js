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

const Place_catDetails = ({navigation, route, ...props}) => {
  const [place_cat, setPlace_cat] = useState([]); // State to store city
  const [error, setError] = useState(null); // State to store error message

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
      .catch(error => {
        setError(error.message);
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
      <View style={{flex: 1, alignItems: 'center'}}>
        <View style={{flexDirection: 'row'}}>
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
