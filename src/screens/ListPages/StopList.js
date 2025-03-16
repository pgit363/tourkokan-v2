import React, {useState, useEffect} from 'react';
import {View, ScrollView, Image} from 'react-native';
import SmallCard from '../../Components/Customs/SmallCard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {connect} from 'react-redux';
import Loader from '../../Components/Customs/Loader';
import Header from '../../Components/Common/Header';
import {setLoader} from '../../Reducers/CommonActions';
import {backPage, navigateTo} from '../../Services/CommonMethods';
import styles from './Styles';
import Path from '../../Services/Api/BaseUrl';
import {useTranslation} from 'react-i18next';

const StopList = ({navigation, ...props}) => {
  const {t} = useTranslation();

  const [stops, setStops] = useState([]); // State to store stops
  const [error, setError] = useState(null); // State to store error message

  useEffect(() => {
    props.setLoader(true);
    comnPost('v2/stops', props.access_token)
      .then(res => {
        setStops(res.data.data.data); // Update stops state with response data
        props.setLoader(false);
      })
      .catch(error => {
        props.setLoader(false);
        setError(error.message); // Update error state with error message
      });
  }, []);

  const handleSmallCardClick = id => {
    navigateTo(navigation, t('SCREEN.PLACE_DETAILS'), {id});
  };

  return (
    <ScrollView>
      <View style={{flex: 1, alignItems: 'center'}}>
        <Loader />
        <Header
          name={t('HEADER.STOPS')}
          startIcon={
            <Ionicons
              name="chevron-back-outline"
              color={COLOR.black}
              size={DIMENSIONS.userIconSize}
              onPress={() => backPage(navigation)}
            />
          }
        />
        <View style={styles.cardsWrap}>
          {stops.map((stop, index) => (
            <SmallCard
              style={styles.stopsCard}
              key={index}
              Icon={
                <Image
                  source={{uri: Path.API_PATH + stop.icon}}
                  color={COLOR.yellow}
                  size={DIMENSIONS.iconSize}
                />
              }
              title={stop.name}
              onPress={() => handleSmallCardClick(stop.id)}
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

export default connect(mapStateToProps, mapDispatchToProps)(StopList);
