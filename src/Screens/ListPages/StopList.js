import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image } from 'react-native';
import SmallCard from '../../Components/Customs/SmallCard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import { connect } from 'react-redux';
import Loader from '../../Components/Customs/Loader';
import Header from '../../Components/Common/Header';
import { setLoader } from '../../Reducers/CommonActions';
import { backPage, navigateTo } from '../../Services/CommonMethods';
import styles from './Styles';
import Path from '../../Services/Api/BaseUrl';
import { useTranslation } from 'react-i18next';

const StopList = ({ navigation, ...props }) => {
  const { t } = useTranslation();

  const [stops, setStops] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    props.setLoader(true);

    comnPost('v2/stops', {}, navigation)
      .then(res => {
        setStops(res.data.data.data);
        props.setLoader(false);
      })
      .catch(error => {
        props.setLoader(false);
        setError(error.message);
      });
  }, []);

  const handleSmallCardClick = id => {
    navigateTo(navigation, t('SCREEN.PLACE_DETAILS'), { id });
  };

  return (
    <ScrollView>
      <View style={{ flex: 1, alignItems: 'center' }}>
        
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
          {stops.map((stop) => (
            <SmallCard
              key={stop.id?.toString()}    // ✅ FIXED HERE
              style={styles.stopsCard}
              Icon={
                <Image
                  source={{ uri: Path.API_PATH + stop.icon }}
                  style={{ width: 40, height: 40 }} // ✅ Image requires style
                  resizeMode="contain"
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

const mapStateToProps = state => ({
  access_token: state.commonState.access_token,
});

const mapDispatchToProps = dispatch => ({
  setLoader: data => dispatch(setLoader(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(StopList);
