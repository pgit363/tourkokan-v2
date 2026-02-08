import React, {useEffect, useState, useRef, useContext} from 'react';
import {
  View,
  ScrollView,
  LogBox,
  BackHandler,
  KeyboardAvoidingView,
  RefreshControl,
  Keyboard,
  Platform,
  Linking,
  Animated,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import SearchPanel from '../Components/Common/SearchPanel';
import TopComponent from '../Components/Common/TopComponent';
import Banner from '../Components/Customs/Banner';
import styles from './Styles';
import COLOR from '../Services/Constants/COLORS';
import Feather from 'react-native-vector-icons/Feather';
import {
  comnPost,
  dataSync,
  getFromStorage,
  saveToStorage,
} from '../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {
  saveAccess_token,
  setDestination,
  setLoader,
  setMode,
  setSource,
} from '../Reducers/CommonActions';
// import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextButton from '../Components/Customs/Buttons/TextButton';
import {exitApp, navigateTo} from '../Services/CommonMethods';
import GlobalText from '../Components/Customs/Text';
import BottomSheet from '../Components/Customs/BottomSheet';
import LocationSheet from '../Components/Common/LocationSheet';
import RouteHeadCard from '../Components/Cards/RouteHeadCard';
import CheckNet from '../Components/Common/CheckNet';
import NetInfo from '@react-native-community/netinfo';
import RouteHeadCardSkeleton from '../Components/Cards/RouteHeadCardSkeleton';
import {Overlay, Skeleton} from '@rneui/themed';
import SearchPanelSkeleton from '../Components/Common/SearchPanelSkeleton';
import TopComponentSkeleton from '../Components/Common/TopComponentSkeleton';
import CityCardSmall from '../Components/Cards/CityCardSmall';
import CityCardSmallSkeleton from '../Components/Cards/CityCardSmallSkeleton';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import BannerSkeleton from '../Components/Customs/BannerSkeleton';
import Loader from '../Components/Customs/Loader';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import DIMENSIONS from '../Services/Constants/DIMENSIONS';
import ComingSoon from '../Components/Common/ComingSoon';
import Popup from '../Components/Common/Popup';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import {FTP_PATH} from '@env';
import PackageCard from '../Components/Cards/PackageCard';
import PackageCardSkeleton from '../Components/Cards/PackageCardSkeleton';
import ProjectCard from '../Components/Cards/ProjectCard';
import { UpdateContext } from '../Context/UpdateContext';
import TrendingSkeleton from '../Components/Customs/TrendingSkeleton';

// SplashScreen.preventAutoHideAsync();

const HomeScreen = ({navigation, route, ...props}) => {
  const {t, i18n} = useTranslation();
  const refRBSheet = useRef();

  const [searchValue, setSearchValue] = useState('');
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stops, setStops] = useState([]);
  const [place_category, setPlace_category] = useState([]);
  const [places, setPlaces] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState(null);
  const [cityList, setCityList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLandingDataFetched, setIsLandingDataFetched] = useState(false);
  const [offline, setOffline] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [bannerImages, setBannerImages] = useState([
    {
      id: 1,
      name: 'Angnewadi Yatra 2024',
      image:
        'https://c4.wallpaperflare.com/wallpaper/766/970/409/cities-city-building-cityscape-wallpaper-preview.jpg',
    },
    {
      id: 2,
      name: 'Angnewadi Yatra 2024',
      image:
        'https://c4.wallpaperflare.com/wallpaper/631/683/713/nature-bridge-sky-city-wallpaper-preview.jpg',
    },
    {
      id: 3,
      name: 'Angnewadi Yatra 2024',
      image:
        'https://c4.wallpaperflare.com/wallpaper/977/138/381/tbilisi-georgia-wallpaper-preview.jpg',
    },
    {
      id: 4,
      name: 'Angnewadi Yatra 2024',
      image: 'https://4kwallpapers.com/images/walls/thumbs_3t/912.jpg',
    },
  ]);
  const [bannerObject, setBannerObject] = useState({});
  const [showSplash, setShowSplash] = useState(false);
  const [splashBanner, setSplashBanner] = useState([]);
  const splashShownRef = useRef(false);
  const [currentCity, setCurrentCity] = useState(null);
  const [sindhudurg, setSindh] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [modePopup, setModePopup] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [showOnlineMode, setShowOnlineMode] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [scaleValue] = useState(new Animated.Value(1));
  const [mode, setMode] = useState(true);
  const [trending, setTrending] = useState({});
  const [activeTab, setActiveTab] = useState(null);
  
  const { isUpdatePending } = useContext(UpdateContext);
  const isUpdatePendingRef = useRef(isUpdatePending);

  const validTrendingKeys = trending ? Object.keys(trending).filter(key => trending[key] && trending[key].length > 0) : [];

  useEffect(() => {
    isUpdatePendingRef.current = isUpdatePending;
    if (isUpdatePending) {
      setShowSplash(false);
      setModePopup(false);
      setIsAlert(false);
      setShowOffline(false);
      setShowOnlineMode(false);
    }
  }, [isUpdatePending]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      t('EVENT.HARDWARE_BACK_PRESS'),
      () => ToNavigate(),
    );
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        setKeyboardOffset(event.endCoordinates.height);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardOffset(0);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      backHandler.remove();
    };
  }, []);

  const ToNavigate = async () => {
    if (
      (await AsyncStorage.getItem(t('STORAGE.ACCESS_TOKEN'))) == null ||
      (await AsyncStorage.getItem(t('STORAGE.ACCESS_TOKEN'))) == ''
    ) {
      navigateTo(navigation, t('SCREEN.EMAIL'));
    } else {
      navigateTo(navigation, t('SCREEN.HOME'));
    }
  };

  // const setAppMode = async () => {
  //     let mode = await getFromStorage(t("STORAGE.MODE"))
  //     props.setMode(mode)
  // }

  const getSelectedCity = async () => {
    try {
      // Retrieve and parse the selected city ID and city name from storage
      const selectedCityId = JSON.parse(
        await getFromStorage(t('STORAGE.SELECTED_CITY_ID')),
      );
      const selectedCityName = JSON.parse(
        await getFromStorage(t('STORAGE.SELECTED_CITY_NAME')),
      );

      // If both city ID and name are present, return them as an object
      if (selectedCityId && selectedCityName) {
        return {id: selectedCityId, name: selectedCityName};
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true; // flag to track if the component is mounted

    const init = async () => {
      setIsLoading(true);
      const selectedCity = await getSelectedCity();
      if (selectedCity) {
        setSindh({
          id: 0,
          name: t('CITY.SINDHUDURG'),
        });
        setCurrentCity(selectedCity.name);
      } else {
        setSindh({
          id: 0,
          name: t('CITY.SINDHUDURG'),
        });
        setCurrentCity(t('CITY.SINDHUDURG'));
      }

      props.setLoader(true);
      await AsyncStorage.setItem('isUpdated', 'false'); // Ensure await here
      checkToken(); // Ensure checkToken is a promise or add await if it's async

      // Only call landing page API once if data isn't fetched
      if (!isLandingDataFetched && props.access_token) {
        // await callLandingPageAPI();
        setIsLandingDataFetched(true);
      }

      // Subscribe to back button and network info changes
      const backHandler = BackHandler.addEventListener(
        t('EVENT.HARDWARE_BACK_PRESS'),
        exitApp,
      );

      const unsubscribe = NetInfo.addEventListener(async state => {
        if (!isMounted) return; // Prevents updating state after component unmount

        setOffline(!state.isConnected);
        // Avoid setting loading on every network change unless needed

        const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
        setMode(mode);
        if (!state.isConnected) {
          if (mode) {
            await offlineClick();
          }
          setIsLoading(false); // No loading if offline
        }

        dataSync(
          t('STORAGE.LANDING_RESPONSE'),
          () => callLandingPageAPI(),
          mode,
        ).then(resp => {
          try {
            if (resp) {
              const res = JSON.parse(resp);
              if (res && res.cities) {
                setCities(res.cities);
                setRoutes(res.routes);
                setBannerObject(res.banners);
                if (res.trending) {
                  setTrending(res.trending);
                  const validKeys = Object.keys(res.trending).filter(k => res.trending[k]?.length > 0);
                  if (validKeys.length > 0)
                    setActiveTab(validKeys[0]);
                }
                setIsFetching(false);
                setIsLoading(false);
                props.setLoader(false);
              }
            } else {
              setOffline(true);
              setIsFetching(false);
              setIsLoading(false);
            }
          } catch (error) {
            console.error('Error parsing response:', error);
            setIsFetching(false);
            setIsLoading(false);
            setOffline(true);
          }

          props.setLoader(false);
        });
      });

      return () => {
        // Clean up listeners and async operations
        backHandler.remove();
        unsubscribe();
        isMounted = false; // Unmount flag
      };
    };

    init();
  }, [props.access_token]);

  const onRefresh = () => {
    props.setSource('');
    props.setDestination('');
    setRefreshing(true);
    if (mode) {
      callLandingPageAPI();
    } else {
      setShowOnlineMode(true);
    }
    setRefreshing(false);
  };
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        const isUpdated = await AsyncStorage.getItem('isUpdated');
        checkToken();
        if (isUpdated === 'true' && props.mode) {
          setCities([]);
          props.setLoader(true);
          await callLandingPageAPI(); // make sure to `await` this if it’s async
          const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
          setMode(mode);
        }
      };

      fetchData();

      // Optional cleanup function (if needed)
      return () => {};
    }, [props.mode, isInitialLoad]),
  );

  const callLandingPageAPI = async site_id => {
    try {
      let isFirstTime = await getFromStorage(t('STORAGE.IS_FIRST_TIME'));
      let mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));

      if (mode) {
        const selectedCity = await getSelectedCity();
        let data;
        if (selectedCity) {
          data = {
            site_id: selectedCity.id, // Use the selected city ID as site_id
          };
        } else {
          data = {
            site_id, // Fallback to default site_id
          };
        }
        props.setLoader(true);

        const res = await comnPost('v2/landingpage', data, navigation);

        if (res && res.data.data) {
          setOfflineData(res.data.data);
          i18n.changeLanguage(res.data.language);
          setCities(res.data.data.cities);
          // setProjects(res.data.data.projects);
          setRoutes(res.data.data.routes);
          setBannerObject(res.data.data.banners);

          if (
            res.data.data.banners?.APP_SPLASH?.length > 0 &&
            !splashShownRef.current &&
            !isUpdatePendingRef.current
          ) {
            setSplashBanner(res.data.data.banners.APP_SPLASH);
            setShowSplash(true);
            splashShownRef.current = true;
          }

          if (res.data.data.trending) {
            setTrending(res.data.data.trending);
            const validKeys = Object.keys(res.data.data.trending).filter(k => res.data.data.trending[k]?.length > 0);
            if (validKeys.length > 0)
              setActiveTab(validKeys[0]);
          }
          setIsFetching(false);
          setIsLoading(false);
          props.setLoader(false);
          setRefreshing(false);

          if (isFirstTime == 'true' && !isUpdatePendingRef.current) {
            // refRBSheet.current.open()
            setModePopup(true);
            await AsyncStorage.setItem(
              t('STORAGE.IS_FIRST_TIME'),
              JSON.stringify(false),
            );
          }
        }

        await AsyncStorage.setItem('isUpdated', 'false');
      }
    } catch (error) {
      setIsFetching(false);
      setIsLoading(false);
      props.setLoader(false);
      setRefreshing(false);
      setError(error.message);
    } finally {
      props.setLoader(false);
    }
  };

  const checkToken = async () => {
    if (
      (await AsyncStorage.getItem(t('STORAGE.ACCESS_TOKEN'))) == null ||
      (await AsyncStorage.getItem(t('STORAGE.ACCESS_TOKEN'))) == ''
    ) {
      navigateTo(navigation, t('SCREEN.EMAIL'));
    }
  };

  const setOfflineData = resp => {
    saveToStorage(t('STORAGE.LANDING_RESPONSE'), JSON.stringify(resp));
    saveToStorage(
      t('STORAGE.CATEGORIES_RESPONSE'),
      JSON.stringify(resp.categories),
    );
    saveToStorage(t('STORAGE.ROUTES_RESPONSE'), JSON.stringify(resp.routes));
    saveToStorage(t('STORAGE.CITIES_RESPONSE'), JSON.stringify(resp.cities));
    saveToStorage(t('STORAGE.EMERGENCY'), JSON.stringify(resp.emergencies));
    saveToStorage(t('STORAGE.QUERIES'), JSON.stringify(resp.queries));
    saveToStorage(t('STORAGE.GALLERY'), JSON.stringify(resp.gallery));
    saveToStorage(t('STORAGE.PROFILE_RESPONSE'), JSON.stringify(resp.user));
    saveToStorage(
      t('STORAGE.PROFILE_PICTURE'),
      JSON.stringify(resp.user.profile_picture),
    );
    AsyncStorage.setItem(t('STORAGE.USER_NAME'), resp.user.name);
    AsyncStorage.setItem(t('STORAGE.USER_ID'), JSON.stringify(resp.user.id));
    AsyncStorage.setItem(t('STORAGE.USER_EMAIL'), resp.user.email);
  };

  const getRoutesList = item => {
    navigateTo(navigation, t('SCREEN.ROUTES_LIST'), {item});
  };

  const showMore = (page, subCat) => {
    navigateTo(navigation, page, {from: t('SCREEN.HOME'), subCat});
  };

  const onSearchFocus = () => {
    navigateTo(navigation, t('SCREEN.CITY_PLACE_SEARCH'));
  };

  const openLocationSheet = () => {
    refRBSheet.current.open();
  };

  const closeLocationSheet = () => {
    refRBSheet.current.close();
  };

  const getCityDetails = city => {
    navigateTo(navigation, t('SCREEN.CITY_DETAILS'), {city});
  };

  const openProfile = () => {
    setIsLoading(true);
    navigateTo(navigation, t('SCREEN.PROFILE_VIEW'));
    setIsLoading(false);
  };

  const onCitySelect = async city => {
    // Retrieve previously selected city details
    const selectedCityId = JSON.parse(
      await getFromStorage(t('STORAGE.SELECTED_CITY_ID')),
    );
    const selectedCityName = JSON.parse(
      await getFromStorage(t('STORAGE.SELECTED_CITY_NAME')),
    );

    // Retrieve the app's mode
    const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));

    // Check the internet connectivity state
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;

    // Combined condition for all three cases
    if (
      (isConnected && !mode) || // Case 1: Internet is available but mode is offline
      (!isConnected && !mode) || // Case 2: Internet is not available and mode is offline
      (!isConnected && mode) && !isUpdatePendingRef.current // Case 3: Internet is not available but mode is online
    ) {
      // Alert the user based on their mode and connectivity status
      setIsAlert(true);
      setAlertMessage(
        !isConnected && !mode
          ? t('ALERT.NETWORK') // No internet and mode is offline
          : !isConnected && mode
          ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE') // No internet but mode is online
          : isConnected && !mode
          ? t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE') // Internet is available but mode is offline
          : '', // Default case (optional)
      );

      return; // Exit the function early
    }

    // Update to the newly selected city
    setCurrentCity(city.name);
    await saveToStorage(t('STORAGE.SELECTED_CITY_ID'), JSON.stringify(city.id));
    await saveToStorage(
      t('STORAGE.SELECTED_CITY_NAME'),
      JSON.stringify(city.name),
    );

    // Call the API with the new city ID
    callLandingPageAPI(city.id);
  };

  const onlineClick = () => {
    saveToStorage(t('STORAGE.MODE'), JSON.stringify(true));
    props.setMode(true);
    setModePopup(false);
  };

  const offlineClick = () => {
    saveToStorage(t('STORAGE.MODE'), JSON.stringify(false));
    props.setMode(false);
    setModePopup(false);
    setShowOffline(true);
  };

  const closePopup = () => {
    setIsAlert(false);
  };

  const changeMode = val => {
    saveToStorage(t('STORAGE.MODE'), JSON.stringify(val));
    setMode(val);
    Animated.spring(scaleValue, {
      toValue: 1.1,
      friction: 2,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 2,
        useNativeDriver: true,
      }).start();
    });
    setModePopup(false);
    if (!val) {
      setShowOffline(true);
    }
  };

  const getTabIcon = key => {
    let iconName = '';
    switch (key.toLowerCase()) {
      case 'hotels':
        iconName = 'hotel';
        break;
      case 'restaurants':
        iconName = 'utensils';
        break;
      case 'resorts':
        iconName = 'umbrella-beach';
        break;
      default:
        return null;
    }
    return (
      <FontAwesome5Icon
        name={iconName}
        size={14}
        color={activeTab === key ? COLOR.themeBlue : '#666'}
        style={{marginRight: 8}}
      />
    );
  };

  return (
    <>
      {isLoading ? (
        <TopComponentSkeleton />
      ) : (
        <TopComponent
          mode={mode}
          setMode={v => setMode(v)}
          cities={[sindhudurg, ...cities]}
          currentCity={currentCity}
          setCurrentCity={v => onCitySelect(v)}
          navigation={navigation}
          openLocationSheet={() => openLocationSheet()}
          gotoProfile={() => openProfile()}
        />
      )}
      <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />

      <KeyboardAwareScrollView
        extraHeight={DIMENSIONS.halfHeight}
        enableOnAndroid={true}
        stickyHeaderIndices={[0]}
        style={{backgroundColor: COLOR.white}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <CheckNet isOff={offline} />
        {/* <MyAnimatedLoader isVisible={isLoading} /> */}
        {!isLoading && <Loader />}
        <View style={{flex: 1, alignItems: 'center'}}>
          {isLoading ? (
            <BannerSkeleton />
          ) : bannerObject?.HOME_HERO && bannerObject.HOME_HERO.length > 0 ? (
            <Banner
              bannerImages={bannerObject.HOME_HERO}
              style={{height: DIMENSIONS.windowWidth / 1.5}}
            />
          ) : (
            <Banner
              bannerImages={bannerImages}
              style={{height: DIMENSIONS.windowWidth / 1.5}}
            />
          )}
          <View style={{marginTop: 30, width: '100%'}}>
            {isLoading ? (
              <TrendingSkeleton />
            ) : trending && validTrendingKeys.length > 0 ? (
              <View style={{width: '100%'}}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{paddingHorizontal: 10}}
                  style={{marginBottom: 10}}>
                  {validTrendingKeys.map((key, index) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setActiveTab(key)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        marginRight: 5,
                        borderBottomWidth: activeTab === key ? 2 : 0,
                        borderBottomColor:
                          activeTab === key ? COLOR.themeBlue : 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      {getTabIcon(key)}
                      <GlobalText
                        text={key.charAt(0).toUpperCase() + key.slice(1)}
                        style={{
                          color: activeTab === key ? COLOR.themeBlue : '#666',
                          fontWeight: activeTab === key ? 'bold' : 'normal',
                          fontSize: 14,
                        }}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{paddingHorizontal: 5, paddingBottom: 10}}>
                  {activeTab &&
                    trending[activeTab] &&
                    trending[activeTab].length > 0 &&
                    trending[activeTab].map((item, index) => (
                      <PackageCard
                        key={`${item.id}_${index}`}
                        data={item}
                        navigation={navigation}
                        isConnected={offline}
                        cardType={'small'}
                      />
                    ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
          {/* {CityName.map((field, index) => {
                            return (
                                <SearchBar
                                    style={styles.homeSearchBar}
                                    placeholder={field.placeholder}
                                    value={searchValue}
                                    onFocus={onSearchFocus}
                                />
                            );
                        })} */}
          <KeyboardAvoidingView
            style={{zIndex: 10}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={keyboardOffset}>
            {isLoading ? (
              <SearchPanelSkeleton />
            ) : (
              <SearchPanel
                route={route}
                navigation={navigation}
                from={t('SCREEN.HOME')}
              />
            )}
          </KeyboardAvoidingView>
          <View style={styles.headerContainer}>
            <View>
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
                  <GlobalText text={t('ROUTES')} style={styles.sectionTitle} />
                  <TextButton
                    title={t('BUTTON.SEE_ALL')}
                    onPress={() => showMore(t('SCREEN.ALL_ROUTES_SEARCH'))}
                    buttonView={styles.buttonView}
                    titleStyle={styles.titleStyle}
                  />
                </View>
              )}
            </View>
            <View style={styles.cardsWrap}>
              {isLoading ? (
                // Show skeleton loader when loading
                <>
                  <RouteHeadCardSkeleton key="route-skeleton-1" />
                  <RouteHeadCardSkeleton key="route-skeleton-2" />
                  <RouteHeadCardSkeleton key="route-skeleton-3" />
                </>
              ) : routes.length > 0 ? (
                // Show routes if available
                routes.map(
                  (route, index) =>
                    route && (
                      <RouteHeadCard
                        key={`${route?.id}_${index}`}
                        data={route}
                        bus={'Hirkani'}
                        cardClick={() => getRoutesList(route)}
                      />
                    ),
                )
              ) : (
                // Show "No Routes" message or card when routes are empty
                <View style={styles.noRoutesContainer}>
                  <GlobalText
                    text="No Routes Available"
                    style={styles.noRoutesText}
                  />
                </View>
              )}
            </View>
          </View>
          <View style={styles.sectionView}>
              {!isLoading &&
                  bannerObject?.HOME_MIDDLE &&
                  bannerObject.HOME_MIDDLE.length > 0 && (
                    <View style={{marginTop: 20, width: '100%'}}>
                      <Banner
                        bannerImages={bannerObject.HOME_MIDDLE}
                        style={{height: DIMENSIONS.windowWidth / 3, marginBottom: 0}}
                      />
                    </View>
              )}
          </View>
          {/* <View>
            {projects.map((project, index) => (
              <ProjectCard
                key={
                  project.id
                    ? `project-${project.id}`
                    : `project-index-${index}`
                }
                project={project}
              />
            ))}
          </View> */}
          <View style={[styles.sectionView, {paddingBottom: 25}]}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 20,
                width: '100%',
              }}>
              {!isLoading && (
                <View
                  style={{
                    width: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <GlobalText
                    text={t('CITIES')}
                    style={[
                      styles.sectionTitle,
                      {
                        transform: [{rotate: '-90deg'}],
                        width: 150,
                        textAlign: 'center',
                      },
                    ]}
                  />
                </View>
              )}
              <View style={{flex: 1}}>
                <ScrollView
                  horizontal
                  style={{marginLeft: 5}}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{paddingBottom: 25, paddingRight: 10}}>
                  {isLoading || cities.length === 0 ? (
                    // Show skeleton loader when loading or when there are no cities
                    <>
                      <PackageCardSkeleton
                        key="city-skeleton-1"
                        cardType={'small'}
                      />
                      <PackageCardSkeleton
                        key="city-skeleton-2"
                        cardType={'small'}
                      />
                      <PackageCardSkeleton
                        key="city-skeleton-3"
                        cardType={'small'}
                      />
                    </>
                  ) : (
                    // Show cities if available
                    cities.map((city, index) => (
                      <PackageCard
                        key={`${city.id}_${index}`}
                        data={city}
                        reload={() => {
                          callLandingPageAPI();
                        }}
                        navigation={navigation}
                        onClick={() => getCityDetails(city)}
                        isConnected={offline}
                        cardType={'small'}
                      />
                    ))
                  )}
                </ScrollView>
              </View>
            </View>

            {/* {isLoading || cities.length === 0 ? (
              <Skeleton
                animation="pulse"
                variant="text"
                style={styles.buttonSkeleton}
              />
            ) : (
              <TextButton
                title={t('BUTTON.SEE_MORE')}
                onPress={() => showMore(t('SCREEN.CITY_LIST'), 'city')}
                containerStyle={styles.showMore}
                buttonView={styles.buttonView}
                buttonStyle={styles.buttonStyle}
                titleStyle={styles.titleStyle}
                endIcon={
                  <Feather
                    name="chevrons-right"
                    size={24}
                    color={COLOR.themeBlue}
                  />
                }
              />
            )} */}
          </View>
        </View>
        <BottomSheet
          refRBSheet={refRBSheet}
          height={300}
          Component={
            <LocationSheet
              setCurrentCity={name => setCurrentCity(name)}
              openLocationSheet={() => openLocationSheet()}
              closeLocationSheet={() => closeLocationSheet()}
            />
          }
          openLocationSheet={() => openLocationSheet()}
          closeLocationSheet={() => closeLocationSheet()}
        />

        <Overlay
          style={styles.locationModal}
          isVisible={modePopup}
          onBackdropPress={() => setModePopup(false)}>
          <View style={styles.modeScreen}>
            <GlobalText text={t('APP_USAGE')} style={styles.sectionTitle} />
            <View
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: 20,
              }}>
              <View style={styles.toggleContainer}>
                <TouchableOpacity onPress={() => changeMode(true)}>
                  <Animated.View
                    style={[
                      styles.optionCard,
                      mode && styles.selectedCard,
                      {transform: [{scale: mode ? scaleValue : 1}]},
                    ]}>
                    <FontAwesome5Icon name="cloud" size={50} color="#4cd137" />
                    <GlobalText
                      style={styles.optionText}
                      text={t('BUTTON.ONLINE_MODE')}
                    />
                  </Animated.View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeMode(false)}>
                  <Animated.View
                    style={[
                      styles.optionCard,
                      !mode && styles.selectedCard,
                      {transform: [{scale: !mode ? scaleValue : 1}]},
                    ]}>
                    <Feather name="wifi-off" size={50} color="#f39c12" />
                    <GlobalText
                      style={styles.optionText}
                      text={t('BUTTON.OFFLINE_MODE')}
                    />
                  </Animated.View>
                </TouchableOpacity>
              </View>
              <GlobalText text={t('NOTE')} style={styles.note} />
            </View>
          </View>
        </Overlay>

        <ComingSoon
          message={t('OFFLINE_MODE')}
          visible={showOffline}
          toggleOverlay={() => setShowOffline(false)}
        />
        <ComingSoon
          message={t('ONLINE_MODE')}
          visible={showOnlineMode}
          toggleOverlay={() => setShowOnlineMode(false)}
        />
        {!isLoading &&
          bannerObject?.HOME_FOOTER &&
          bannerObject.HOME_FOOTER.length > 0 && (
            <View style={{width: '100%'}}>
              <Banner
                bannerImages={bannerObject.HOME_FOOTER}
                style={{height: DIMENSIONS.windowWidth / 3, marginBottom: 0}}
              />
            </View>
          )}
      </KeyboardAwareScrollView>
      <Overlay
        isVisible={showSplash}
        onBackdropPress={() => setShowSplash(false)}
        overlayStyle={{
          padding: 0,
          backgroundColor: 'transparent',
          elevation: 0,
        }}>
        <View
          style={{
            width: DIMENSIONS.screenWidth * 0.85,
            height: DIMENSIONS.screenHeight * 0.7,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <TouchableOpacity
            onPress={() => setShowSplash(false)}
            style={{
              position: 'absolute',
              top: -15,
              right: -15,
              zIndex: 10,
              backgroundColor: 'white',
              borderRadius: 20,
            }}>
            <Feather name="x-circle" size={30} color="black" />
          </TouchableOpacity>
          {splashBanner[0] && (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                if (splashBanner[0].redirect_url) {
                  Linking.openURL(splashBanner[0].redirect_url);
                  setShowSplash(false);
                }
              }}
              style={{width: '100%', height: '100%'}}>
            <Image
              source={{
                uri: splashBanner[0].image.startsWith('http')
                  ? splashBanner[0].image
                  : FTP_PATH + splashBanner[0].image,
              }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 10,
                resizeMode: 'cover',
              }}
            />
            </TouchableOpacity>
          )}
        </View>
      </Overlay>
    </>
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
    saveAccess_token: data => {
      dispatch(saveAccess_token(data));
    },
    setLoader: data => {
      dispatch(setLoader(data));
    },
    setMode: data => {
      dispatch(setMode(data));
    },
    setSource: data => {
      dispatch(setSource(data));
    },
    setDestination: data => {
      dispatch(setDestination(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);
