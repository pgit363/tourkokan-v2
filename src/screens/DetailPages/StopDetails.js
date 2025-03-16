import React, {useState, useEffect} from 'react';
import {View, ScrollView, Text} from 'react-native';
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

const StopDetails = ({navigation, route, ...props}) => {
  const [stop, setStop] = useState([]); // State to store city
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
    comnPost(`v2/stop/${route.params.id}`, props.access_token)
      .then(res => {
        setStop(res.data.data); // Update city state with response data
        props.setLoader(false);
      })
      .catch(error => {
        setError(error.message); // Update error state with error message
        props.setLoader(false);
      });
  };

  return (
    <ScrollView>
      <Loader />
      <Header
        name={stop.name}
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
          <GlobalText text={stop.name} />
          <GlobalText text={JSON.stringify(stop)} />
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

export default connect(mapStateToProps, mapDispatchToProps)(StopDetails);
