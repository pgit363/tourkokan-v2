/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {View, ScrollView, ImageBackground, FlatList} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {comnPost, dataSyncResult, saveToStorage} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {setLoader} from '../../Reducers/CommonActions';
import styles from './Styles';
import Header from '../../Components/Common/Header';
import {
  backPage,
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import GlobalText from '../../Components/Customs/Text';
import NetInfo from '@react-native-community/netinfo';
import CheckNet from '../../Components/Common/CheckNet';
import ImageButton from '../../Components/Customs/Buttons/ImageButton';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import ImageButtonSkeleton from '../../Components/Customs/Buttons/ImageButtonSkeleton';
import {Skeleton} from '@rneui/themed';
import CityCardSkeleton from '../../Components/Cards/CityCardSkeleton';
import {useTranslation} from 'react-i18next';

const screenContainerStyle = {flex: 1, justifyContent: 'flex-start'};
const sectionHeaderRowStyle = {
  paddingBottom: 10,
  flexDirection: 'row',
  justifyContent: 'center',
};
const sitesContainerStyle = {
  minHeight: DIMENSIONS.screenHeight,
  alignItems: 'center',
};
const skeletonButtonStyle = {width: 100, height: 30};
const emptyStateStyle = {marginTop: 20};

const Explore = ({navigation, ...props}) => {
  const {t} = useTranslation();

  const [cities, setCities] = useState([]);
  const [offline, setOffline] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedSites, setSelectedSites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    props.setLoader(true);
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    setIsLoading(true);

    const unsubscribe = NetInfo.addEventListener(() => {
      setOffline(false);

      dataSyncResult(t('STORAGE.CITIES_RESPONSE'), getCities, props.mode).then(
        result => {
          const resp = result.data;
          if (resp && resp.data && resp.data.data) {
            setCities(resp.data.data.data);
            return;
          }

          if (typeof resp === 'string') {
            const parsedResp = JSON.parse(resp);
            if (parsedResp.data && parsedResp.data.data) {
              setCities(parsedResp.data.data.data);
              return;
            }
          }

          if (result.offline) {
            setOffline(true);
          }
        },
      );
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, []);

  const getCities = () => {
    setIsLoading(true);
    const data = {
      apitype: 'list',
      category: 'city',
    };
    return comnPost('v2/sites', data, navigation)
      .then(res => {
        if (res && res.data.data) {
          saveToStorage(t('STORAGE.CITIES_RESPONSE'), JSON.stringify(res));
        }
        setCities(res.data.data.data);
        setSelectedCity(res.data.data.data[0].name);
        setSelectedCityId(res.data.data.data[0].id);
        setSelectedSites(res.data.data.data[0].sites);
        setIsLoading(false);
        return res;
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  const seeMore = () => {
    navigateTo(navigation, t('SCREEN.CITY_LIST'), {
      parent_id: selectedCityId,
    });
  };

  const renderItem = ({item}) => {
    return (
      <View style={styles.placesCard}>
        <GlobalText text={item.name} />
      </View>
    );
  };

  const handleCityPress = city => {
    setSelectedCity(city.name);
    setSelectedCityId(city.id);
    setSelectedSites(cities.find(item => item.name === city.name).sites);
  };

  return (
    <View style={screenContainerStyle}>
      <CheckNet isOff={offline} />
      <Header
        name={t('SCREEN.CITIES')}
        startIcon={
          <Ionicons
            name="chevron-back-outline"
            color={COLOR.black}
            size={DIMENSIONS.userIconSize}
            onPress={() => backPage(navigation)}
          />
        }
      />
      <View style={styles.horizontalCityScroll}>
        <ScrollView horizontal style={styles.citiesButtonScroll}>
          {isLoading ? (
            <>
              <ImageButtonSkeleton />
              <ImageButtonSkeleton />
              <ImageButtonSkeleton />
              <ImageButtonSkeleton />
              <ImageButtonSkeleton />
            </>
          ) : (
            cities.map(city => (
              <ImageButton
                key={city.id}
                onPress={() => handleCityPress(city)}
                isSelected={selectedCity === city.name}
                image={city.image}
                imageButtonCircle={styles.citiesCircleButton}
                text={
                  <GlobalText text={city.name} style={styles.cityButtonText} />
                }
              />
            ))
          )}
        </ScrollView>
      </View>
      <View>
        {isLoading ? (
          <Skeleton
            animation="pulse"
            variant="text"
            style={styles.toggleView}
          />
        ) : (
          <View style={styles.toggleView}>
            <View style={styles.overlay} />
            <ImageBackground
              source={{
                uri: 'https://c4.wallpaperflare.com/wallpaper/766/970/409/cities-city-building-cityscape-wallpaper-preview.jpg',
              }}
              style={styles.exploreHeaderImage}
              imageStyle={styles.cityImageStyle}
              resizeMode="cover"
            />
            <View style={styles.details}>
              <GlobalText text={t('TO_EXPLORE')} style={styles.whiteText} />
            </View>
          </View>
        )}
      </View>
      <View style={sectionHeaderRowStyle}>
        {isLoading ? (
          <View style={styles.flexAroundSkeleton}>
            <Skeleton
              animation="pulse"
              variant="text"
              style={skeletonButtonStyle}
            />
            <Skeleton
              animation="pulse"
              variant="text"
              style={skeletonButtonStyle}
            />
          </View>
        ) : (
          <View style={styles.flexAround}>
            <GlobalText text={t('VILLAGES')} style={styles.sectionTitle} />
            <TextButton
              title={t('BUTTON.SEE_MORE')}
              buttonView={styles.buttonView}
              titleStyle={styles.titleStyle}
              raised={false}
              onPress={() => seeMore()}
            />
          </View>
        )}
      </View>
      <View style={sitesContainerStyle}>
        {isLoading ? (
          <View>
            <FlatList
              keyExtractor={item => item.id}
              data={selectedSites}
              renderItem={() => <CityCardSkeleton type={t('HEADER.PLACE')} />}
              numColumns={2}
            />
          </View>
        ) : selectedSites[0] ? (
          <View>
            <FlatList
              keyExtractor={item => item.id}
              data={selectedSites}
              renderItem={renderItem}
              numColumns={2}
            />
          </View>
        ) : (
          <View style={emptyStateStyle}>
            <GlobalText text={t('ADDED')} style={styles.boldText} />
          </View>
        )}
      </View>
    </View>
  );
};

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
    mode: state.commonState.mode,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoader(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Explore);
