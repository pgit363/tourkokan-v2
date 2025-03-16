import React, {useState, useEffect} from 'react';
import {View, ScrollView, ImageBackground, FlatList} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {
  checkTokenExpired,
  comnPost,
  dataSync,
  saveToStorage,
} from '../../Services/Api/CommonServices';
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

const Explore = ({route, navigation, ...props}) => {
  const {t} = useTranslation();

  const [places, setPlaces] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState(null);
  const [isEnabled, setIsEnabled] = useState(route.name == t('SCREEN.CITIES'));
  const [isLandingDataFetched, setIsLandingDataFetched] = useState(false);
  const [nextPage, setNextPage] = useState(1);
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

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(false);

      dataSync(t('STORAGE.CITIES_RESPONSE'), getCities(), props.mode).then(
        resp => {
          let res = JSON.parse(resp);
          if (res.data && res.data.data) {
            setCities(res.data.data.data);
          } else if (resp) {
            setOffline(true);
          }
        },
      );

      // dataSync(t("STORAGE.PLACES_RESPONSE"), getPlaces(), props.mode)
      //   .then(resp => {
      //     let res = JSON.parse(resp)
      //     if (res.data && res.data.data) {
      //       setPlaces([...places, ...res.data.data.data]);
      //     } else if (resp) {
      //       setOffline(true)
      //     }
      //   })
      // removeFromStorage(t("STORAGE.LANDING_RESPONSE"))
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, []);

  const getPlaces = ifNext => {
    setIsLoading(true);
    comnPost(
      `v2/places?page=${ifNext ? nextPage : nextPage - 1}`,
      props.access_token,
    )
      .then(res => {
        checkTokenExpired(res);
        if (res && res.data.data)
          saveToStorage(t('STORAGE.PLACES_RESPONSE'), JSON.stringify(res));
        setPlaces([...places, ...res.data.data.data]);
        setIsLoading(false);
        let nextUrl = res.data.data.next_page_url;
        setNextPage(nextUrl[nextUrl.length - 1]);
      })
      .catch(error => {
        setIsLoading(false);
      });
  };

  const getCities = () => {
    setIsLoading(true);
    let data = {
      apitype: 'list',
      // parent_id: 1,
      category: 'city',
    };
    comnPost('v2/sites', data, navigation)
      .then(res => {
        if (res && res.data.data)
          saveToStorage(t('STORAGE.CITIES_RESPONSE'), JSON.stringify(res));
        setCities(res.data.data.data);
        setSelectedCity(res.data.data.data[0].name);
        setSelectedCityId(res.data.data.data[0].id);
        setSelectedSites(res.data.data.data[0].sites);
        // setSelectedSites(res.data.data.data[0].sites)
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
      });
  };

  const goToNext = () => {
    // setIsLoading(true)
    getPlaces(true);
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

  const getCityDetails = id => {
    navigateTo(navigation, t('SCREEN.CITY_DETAILS'), {id});
  };

  return (
    <View style={{flex: 1, justifyContent: 'flex-start'}}>
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
      <View
        style={{
          paddingBottom: 10,
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
        {isLoading ? (
          <View style={styles.flexAroundSkeleton}>
            <Skeleton
              animation="pulse"
              variant="text"
              style={{width: 100, height: 30}}
            />
            <Skeleton
              animation="pulse"
              variant="text"
              style={{width: 100, height: 30}}
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
      <View
        style={{
          minHeight: DIMENSIONS.screenHeight,
          alignItems: 'center',
        }}>
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
          <View style={{marginTop: 20}}>
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
