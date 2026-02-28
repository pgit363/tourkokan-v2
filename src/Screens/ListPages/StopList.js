/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, StyleSheet } from 'react-native';
import SmallCard from '../../Components/Customs/SmallCard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import { connect } from 'react-redux';
import Loader from '../../Components/Customs/Loader';
import Header from '../../Components/Common/Header';
import { setLoader } from '../../Reducers/CommonActions';
import { backPage, navigateTo } from '../../Services/CommonMethods';
import { comnPost } from '../../Services/Api/CommonServices';
import styles from './Styles';
import Path from '../../Services/Api/BaseUrl';
import { useTranslation } from 'react-i18next';

const StopList = ({ navigation, ...props }) => {
  const { t } = useTranslation();

  const [stops, setStops] = useState([]);

  useEffect(() => {
    props.setLoader(true);

    comnPost('v2/stops', props.access_token)
      .then(res => {
        setStops(res.data.data.data);
        props.setLoader(false);
      })
      .catch(fetchError => {
        props.setLoader(false);
        console.error('Failed to load stops:', fetchError);
      });
  }, []);

  const handleSmallCardClick = id => {
    navigateTo(navigation, t('SCREEN.PLACE_DETAILS'), { id });
  };

  return (
    <ScrollView>
      <View style={localStyles.container}>
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
          {stops.map(stop => (
            <SmallCard
              key={stop.id?.toString()}
              style={styles.stopsCard}
              Icon={
                <Image
                  source={{ uri: Path.API_PATH + stop.icon }}
                  style={localStyles.stopIcon}
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

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  stopIcon: {
    width: 40,
    height: 40,
  },
});

const mapStateToProps = state => ({
  access_token: state.commonState.access_token,
});

const mapDispatchToProps = dispatch => ({
  setLoader: data => dispatch(setLoader(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(StopList);
