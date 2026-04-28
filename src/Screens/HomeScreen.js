import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useReducer,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StatusBar,
  StyleSheet,
  Dimensions,
  Image,
  RefreshControl,
  Linking,
  Alert,
  BackHandler,
  Modal,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect} from '@react-navigation/native';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {Overlay} from '@rneui/themed';
import {FTP_PATH} from '@env';

import TopComponent from '../Components/Common/TopComponent';
import TopComponentSkeleton from '../Components/Common/TopComponentSkeleton';
import HomeScreenSkeleton from '../Components/Common/HomeScreenSkeleton';
import Banner from '../Components/Customs/Banner';
import CheckNet from '../Components/Common/CheckNet';
import Popup from '../Components/Common/Popup';
import BottomSheet from '../Components/Customs/BottomSheet';
import LocationSheet from '../Components/Common/LocationSheet';
import PackageCard from '../Components/Cards/PackageCard';
import {KeyboardAwareFlatList} from 'react-native-keyboard-aware-scroll-view';

import {
  comnPost,
  dataSync,
  getFromStorage,
  saveToStorage,
} from '../Services/Api/CommonServices';
import {
  saveAccess_token,
  setDestination,
  setLoader,
  setMode,
  setSource,
} from '../Reducers/CommonActions';
import {exitApp, navigateTo} from '../Services/CommonMethods';
import {UpdateContext} from '../Context/UpdateContext';
import STRING from '../Services/Constants/STRINGS';
import DIMENSIONS from '../Services/Constants/DIMENSIONS';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanFoam: '#B8E4EA',
  sandMid: '#C4972A',
  sandPale: '#FBF3DC',
  forestMid: '#2E5C3A',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  glass: 'rgba(255,255,255,0.9)',
  glassBorder: 'rgba(0,0,0,0.05)',
};

const {width: SW} = Dimensions.get('window');
const BANNER_HEIGHT = Math.round(SW / 1.35);
const RADIUS = 18;

// ─── Static Data ───────────────────────────────────────────────────────────────

const STATIC_SPOTS = [
  // beaches
  {id: 1, name: 'Tarkarli Beach', location: 'Malvan', rating: 4.8, type: 'beaches', km: 12, emoji: '🏖️'},
  {id: 4, name: 'Devbagh Beach', location: 'Malvan', rating: 4.6, type: 'beaches', km: 15, emoji: '🏖️'},
  {id: 7, name: 'Nivati Beach', location: 'Devgad', rating: 4.5, type: 'beaches', km: 30, emoji: '🏖️'},
  // forts
  {id: 2, name: 'Sindhudurg Fort', location: 'Malvan', rating: 4.9, type: 'forts', km: 8, emoji: '🏰'},
  {id: 5, name: 'Vijaydurg Fort', location: 'Devgad', rating: 4.5, type: 'forts', km: 22, emoji: '🏰'},
  {id: 8, name: 'Padmadurg Fort', location: 'Malvan', rating: 4.3, type: 'forts', km: 20, emoji: '🏰'},
  // waterfalls
  {id: 3, name: 'Amboli Ghat', location: 'Sawantwadi', rating: 4.7, type: 'waterfalls', km: 35, emoji: '💧'},
  {id: 9, name: 'Hiranyakeshi Falls', location: 'Sawantwadi', rating: 4.4, type: 'waterfalls', km: 40, emoji: '💧'},
  // temples
  {id: 6, name: 'Kunkeshwar Temple', location: 'Devgad', rating: 4.4, type: 'temples', km: 18, emoji: '⛩️'},
  {id: 10, name: 'Redi Ganpati Temple', location: 'Vengurla', rating: 4.6, type: 'temples', km: 42, emoji: '⛩️'},
  // food
  {id: 11, name: 'Kokan Cuisine Hub', location: 'Kankavli', rating: 4.5, type: 'food', km: 5, emoji: '🍛'},
  {id: 12, name: 'Malvan Fish Market', location: 'Malvan', rating: 4.7, type: 'food', km: 9, emoji: '🐟'},
  {id: 13, name: 'Sol Kadhi Corner', location: 'Kudal', rating: 4.3, type: 'food', km: 14, emoji: '🥛'},
];

const STATIC_NEARBY = [
  {id: 1, name: 'Tarkarli Beach', emoji: '🏖️', category: 'Beach', distance: 12},
  {id: 2, name: 'Sindhudurg Fort', emoji: '🏰', category: 'Fort', distance: 8},
  {id: 3, name: 'Kunkeshwar Temple', emoji: '⛩️', category: 'Temple', distance: 18},
  {id: 4, name: 'Amboli Waterfalls', emoji: '💧', category: 'Waterfall', distance: 35},
];

// ─── Sub-components ────────────────────────────────────────────────────────────

// Taluka card (glassmorphism)
const TalukaCard = ({item, onPress}) => {
  const fallback = require('../Assets/Images/no-image.png');
  const uri = item.image
    ? `${FTP_PATH}${item.image}`
    : item.gallery?.[0]?.path
    ? `${FTP_PATH}${item.gallery[0].path}`
    : null;

  return (
    <TouchableOpacity style={ts.talukaCard} onPress={onPress} activeOpacity={0.85}>
      <View style={ts.talukaImgWrap}>
        {uri ? (
          <Image source={{uri}} style={ts.talukaImg} resizeMode="cover" />
        ) : (
          <Image source={fallback} style={ts.talukaImg} resizeMode="cover" />
        )}
        {/* Favourite heart overlay */}
        <View style={[ts.talukaHeart, item.is_favorite && ts.talukaHeartActive]}>
          <Ionicons
            name={item.is_favorite ? 'heart' : 'heart-outline'}
            size={14}
            color={item.is_favorite ? '#eb5757' : C.white}
          />
        </View>
      </View>
      <View style={ts.talukaInfo}>
        <Text style={ts.talukaName} numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text style={ts.talukaDesc} numberOfLines={2}>{item.description}</Text>
        ) : item.places_count != null ? (
          <Text style={ts.talukaDesc}>{item.places_count} places to explore</Text>
        ) : null}
        <View style={ts.talukaRating}>
          <Ionicons name="star" size={12} color={C.sandMid} />
          <Text style={ts.talukaRatingText}>
            {Number(item.rating_avg_rate) > 0
              ? Number(item.rating_avg_rate).toFixed(1)
              : '0.0'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Static spot card
const SpotCard = ({item}) => (
  <View style={ts.spotCard}>
    <View style={ts.spotImgWrap}>
      <Text style={ts.spotEmoji}>{item.emoji || '🏔️'}</Text>
      <View style={ts.spotBadge}>
        <Text style={ts.spotBadgeText}>⭐ {item.rating}</Text>
      </View>
    </View>
    <View style={ts.spotInfo}>
      <Text style={ts.spotName} numberOfLines={1}>{item.name}</Text>
      <Text style={ts.spotLocation}>📍 {item.location}</Text>
      <View style={ts.spotMeta}>
        <Text style={ts.spotMetaText}>⭐ {item.rating}</Text>
        <Text style={ts.spotMetaDot}>•</Text>
        <Text style={ts.spotMetaText}>{item.km} km</Text>
      </View>
    </View>
  </View>
);

// Nearby card — emoji + category
const NearbyCard = ({item}) => (
  <View style={ts.nearbyCard}>
    <Text style={ts.nearbyEmoji}>{item.emoji}</Text>
    <View style={ts.nearbyCategoryBadge}>
      <Text style={ts.nearbyCategoryText}>{item.category}</Text>
    </View>
    <Text style={ts.nearbyName} numberOfLines={2}>{item.name}</Text>
    <Text style={ts.nearbyDist}>{item.distance} km away</Text>
  </View>
);

// Ad banner — always shows dashed outline; dynamic banner inside or static placeholder
const AdBanner = ({bannerImages, label, size, bannerHeight}) => (
  <View style={ts.adBannerWrap}>
    <View style={ts.adLabelBadge}>
      <Text style={ts.adLabelText}>{label || 'Premium Ad'}</Text>
    </View>
    {bannerImages?.length > 0 ? (
      <Banner
        bannerImages={bannerImages}
        style={{height: bannerHeight || SW / 3, borderRadius: RADIUS - 2, overflow: 'hidden'}}
      />
    ) : (
      <View style={ts.adPlaceholder}>
        <Text style={ts.adIcon}>📢</Text>
        <Text style={ts.adText}>Ad Space Available</Text>
        <Text style={ts.adSize}>{size || '340×160px · Click to advertise'}</Text>
      </View>
    )}
  </View>
);


// ─── HomeScreen ────────────────────────────────────────────────────────────────

const HomeScreen = ({navigation, route, ...props}) => {
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();
  const refRBSheet = useRef();
  // Header height = status bar (insets.top) + row padding (10+10) + button height (44)
  // pill bottom = insets.top + paddingVertical(10) + BTN(44) = insets.top + 54
  const dropdownTop = insets.top + 54;

  // ── State ──
  const [offline, setOffline] = useState(false);
  const [currentCity, setCurrentCity] = useState(null);
  const [sindhudurg, setSindh] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [modePopup, setModePopup] = useState(false);
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLandingDataFetched, setIsLandingDataFetched] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [activeSpotTab, setActiveSpotTab] = useState('all');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [splashBanner, setSplashBanner] = useState([]);
  const splashShownRef = useRef(false);
  const isFetchingRef = useRef(false);
  const {isUpdatePending} = useContext(UpdateContext);
  const isUpdatePendingRef = useRef(isUpdatePending);

  const [mode, setMode] = useState(true);

  const [state, dispatch] = useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'SET_DATA':
          return {...prevState, ...action.payload, isLoading: false, isFetching: false};
        case 'SET_LOADING':
          return {...prevState, isLoading: action.payload};
        default:
          return prevState;
      }
    },
    {cities: [], routes: [], bannerObject: {}, trending: {}, isLoading: true, isFetching: true},
  );
  const {cities, bannerObject, trending, isLoading} = state;

  const validTrendingKeys = useMemo(
    () => (trending ? Object.keys(trending).filter(k => trending[k]?.length > 0) : []),
    [trending],
  );

  const topComponentCities = useMemo(
    () => [sindhudurg, ...cities],
    [sindhudurg, cities],
  );

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0)),
    [cities],
  );

  // Spot tabs: use trending keys from API if available, else use static tabs
  const SPOT_TABS = useMemo(() => {
    if (validTrendingKeys.length > 0) return validTrendingKeys;
    return ['all', 'beaches', 'forts', 'waterfalls', 'temples', 'food'];
  }, [validTrendingKeys]);

  const filteredSpots = useMemo(() => {
    if (activeSpotTab === 'all') return STATIC_SPOTS;
    return STATIC_SPOTS.filter(s => s.type === activeSpotTab);
  }, [activeSpotTab]);

  // ── Re-translate city label when language changes ──
  // `t` reference changes whenever i18n language switches — use it as the trigger
  useEffect(() => {
    setSindh({id: 0, name: t('CITY.SINDHUDURG')});
    getSelectedCity().then(selectedCity => {
      if (!selectedCity || selectedCity.id === 0) {
        setCurrentCity(t('CITY.SINDHUDURG'));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  // ── Update context ──
  useEffect(() => {
    isUpdatePendingRef.current = isUpdatePending;
    if (isUpdatePending) {
      setShowSplash(false);
      setModePopup(false);
      setIsAlert(false);
    }
  }, [isUpdatePending]);

  // ── Back handler ──
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      t('EVENT.HARDWARE_BACK_PRESS'),
      () => exitApp(),
    );
    return () => backHandler.remove();
  }, [t]);

  // ── Init ──
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const localData = await getFromStorage(t('STORAGE.LANDING_RESPONSE'));
      if (localData && isMounted) {
        try {
          const res = JSON.parse(localData);
          if (res?.cities) {
            let newActiveTab = activeTab;
            if (res.trending) {
              const validKeys = Object.keys(res.trending).filter(k => res.trending[k]?.length > 0);
              if (validKeys.length > 0) newActiveTab = validKeys[0];
            }
            setActiveTab(newActiveTab);
            dispatch({
              type: 'SET_DATA',
              payload: {cities: res.cities, routes: res.routes, bannerObject: res.banners, trending: res.trending || {}},
            });
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        dispatch({type: 'SET_LOADING', payload: true});
      }

      const selectedCity = await getSelectedCity();
      if (selectedCity) {
        setSindh({id: 0, name: t('CITY.SINDHUDURG')});
        setCurrentCity(selectedCity.name);
      } else {
        setSindh({id: 0, name: t('CITY.SINDHUDURG')});
        setCurrentCity(t('CITY.SINDHUDURG'));
      }

      await AsyncStorage.setItem('isUpdated', 'false');
      checkToken();

      if (!isLandingDataFetched && props.access_token) {
        setIsLandingDataFetched(true);
      }

      // ── Show mode popup on first-time launch (independent of API call) ──
      const isFirstTime = await getFromStorage(t('STORAGE.IS_FIRST_TIME'));
      if (isFirstTime === 'true' && !isUpdatePendingRef.current) {
        setModePopup(true);
        await AsyncStorage.setItem(t('STORAGE.IS_FIRST_TIME'), JSON.stringify(false));
      }

      const unsubscribe = NetInfo.addEventListener(async netState => {
        if (!isMounted) return;
        setOffline(!netState.isConnected);

        const storedMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
        setMode(storedMode);

        if (!netState.isConnected) {
          dispatch({type: 'SET_LOADING', payload: false});
        }

        dataSync(t('STORAGE.LANDING_RESPONSE'), () => callLandingPageAPI(), storedMode).then(resp => {
          try {
            if (resp) {
              const res = JSON.parse(resp);
              if (res?.cities) {
                let newActiveTab = activeTab;
                if (res.trending) {
                  const validKeys = Object.keys(res.trending).filter(k => res.trending[k]?.length > 0);
                  if (validKeys.length > 0) newActiveTab = validKeys[0];
                }
                setActiveTab(newActiveTab);
                dispatch({
                  type: 'SET_DATA',
                  payload: {cities: res.cities, routes: res.routes, bannerObject: res.banners, trending: res.trending || {}},
                });
              }
            } else {
              setOffline(true);
              dispatch({type: 'SET_LOADING', payload: false});
            }
          } catch (err) {
            dispatch({type: 'SET_LOADING', payload: false});
            setOffline(true);
          }
        });
      });

      return () => {
        unsubscribe();
        isMounted = false;
      };
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.access_token]);

  // ── Focus sync ──
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        const isUpdated = await AsyncStorage.getItem('isUpdated');
        checkToken();

        const storedMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
        if (storedMode !== null && storedMode !== undefined) {
          setMode(storedMode);
          props.setMode(storedMode);
        }

        if (isUpdated === 'true' && props.mode) {
          dispatch({type: 'SET_LOADING', payload: true});
          await callLandingPageAPI();
        }
      };
      fetchData();
      return () => {};
    }, [props.mode, isInitialLoad, callLandingPageAPI]),
  );

  // ── API ──
  const callLandingPageAPI = useCallback(async site_id => {
    try {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      const storedMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
      if (!storedMode) return;

      const selectedCity = await getSelectedCity();
      const data = selectedCity ? {site_id: selectedCity.id} : {site_id};

      // Only show skeleton on initial load (no cached data).
      // When called as background refresh, update data silently.
      const res = await comnPost('v2/landingpage', data, navigation);
      console.log(res);
      
      if (res?.data?.data) {
        if (i18n.language !== res.data.language) i18n.changeLanguage(res.data.language);

        setSindh({id: 0, name: t('CITY.SINDHUDURG')});

        if (selectedCity?.id !== 0) {
          const foundCity = res.data.data.cities.find(c => c.id === selectedCity?.id);
          if (foundCity) {
            setCurrentCity(foundCity.name);
            saveToStorage(t('STORAGE.SELECTED_CITY_NAME'), JSON.stringify(foundCity.name));
          }
        } else {
          setCurrentCity(t('CITY.SINDHUDURG'));
        }

        let newActiveTab = activeTab;
        if (res.data.data.trending) {
          const validKeys = Object.keys(res.data.data.trending).filter(k => res.data.data.trending[k]?.length > 0);
          if (validKeys.length > 0) newActiveTab = validKeys[0];
        }
        setActiveTab(newActiveTab);

        dispatch({
          type: 'SET_DATA',
          payload: {cities: res.data.data.cities, routes: res.data.data.routes, bannerObject: res.data.data.banners, trending: res.data.data.trending || {}},
        });

        if (res.data.data.banners?.APP_SPLASH?.length > 0 && !splashShownRef.current && !isUpdatePendingRef.current) {
          setSplashBanner(res.data.data.banners.APP_SPLASH);
          setShowSplash(true);
          splashShownRef.current = true;
        }

        setRefreshing(false);
        setTimeout(() => setOfflineData(res.data.data), 2000);
      }

      await AsyncStorage.setItem('isUpdated', 'false');
    } catch (err) {
      dispatch({type: 'SET_LOADING', payload: false});
      setRefreshing(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [t, i18n, props.mode, navigation, activeTab]);

  const getSelectedCity = async () => {
    try {
      const id = JSON.parse(await getFromStorage(t('STORAGE.SELECTED_CITY_ID')));
      const name = JSON.parse(await getFromStorage(t('STORAGE.SELECTED_CITY_NAME')));
      if (id && name) return {id, name};
      return null;
    } catch {
      return null;
    }
  };

  const checkToken = async () => {
    const token = await AsyncStorage.getItem(t('STORAGE.ACCESS_TOKEN'));
    if (!token) navigateTo(navigation, t('SCREEN.EMAIL'));
  };

  const setOfflineData = resp => {
    saveToStorage(t('STORAGE.LANDING_RESPONSE'), JSON.stringify(resp));
    saveToStorage(t('STORAGE.CATEGORIES_RESPONSE'), JSON.stringify(resp.categories));
    saveToStorage(t('STORAGE.ROUTES_RESPONSE'), JSON.stringify(resp.routes));
    saveToStorage(t('STORAGE.CITIES_RESPONSE'), JSON.stringify(resp.cities));
    saveToStorage(t('STORAGE.EMERGENCY'), JSON.stringify(resp.emergencies));
    saveToStorage(t('STORAGE.QUERIES'), JSON.stringify(resp.queries));
    saveToStorage(t('STORAGE.GALLERY'), JSON.stringify(resp.gallery));
    if (resp.user) {
      saveToStorage(t('STORAGE.PROFILE_RESPONSE'), JSON.stringify(resp.user));
      saveToStorage(t('STORAGE.PROFILE_PICTURE'), JSON.stringify(resp.user.profile_picture || ''));
      AsyncStorage.setItem(t('STORAGE.USER_NAME'), `${resp.user.name || ''}`);
      AsyncStorage.setItem(t('STORAGE.USER_ID'), JSON.stringify(resp.user.id || ''));
      AsyncStorage.setItem(t('STORAGE.USER_EMAIL'), `${resp.user.email || ''}`);
    }
  };

  const onRefresh = async () => {
    props.setSource('');
    props.setDestination('');
    setRefreshing(true);
    const storedMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
    if (storedMode) {
      callLandingPageAPI();
    }
    setRefreshing(false);
  };

  const onCitySelect = async city => {
    const storedMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
    const netState = await NetInfo.fetch();
    const isConnected = netState.isConnected;

    if (!isConnected || !storedMode) {
      setIsAlert(true);
      setAlertMessage(
        !isConnected && !storedMode ? t('ALERT.NETWORK')
        : !isConnected ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE')
        : t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE'),
      );
      return;
    }

    setCurrentCity(city.name);
    await saveToStorage(t('STORAGE.SELECTED_CITY_ID'), JSON.stringify(city.id));
    await saveToStorage(t('STORAGE.SELECTED_CITY_NAME'), JSON.stringify(city.name));
    callLandingPageAPI(city.id);
  };

  const openProfile = () => navigateTo(navigation, t('SCREEN.PROFILE_VIEW'));
  const getCityDetails = city => navigateTo(navigation, t('SCREEN.SITE_DETAIL'), {city});
  const openLocationSheet = () => refRBSheet.current.open();
  const closeLocationSheet = () => refRBSheet.current.close();

  const changeMode = async val => {
    await saveToStorage(t('STORAGE.MODE'), JSON.stringify(val));
    setMode(val);
    props.setMode(val);
    setModePopup(false);
  };

  // ── Memoized list content — won't re-render on dropdown toggle ──
  const listHeader = useMemo(() => (
    <>
      {/* ── BANNER ── */}
      <View style={[s.bannerWrap, {height: BANNER_HEIGHT}]}>
        {bannerObject?.HOME_HERO?.length > 0 ? (
          <Banner bannerImages={bannerObject.HOME_HERO} style={{height: BANNER_HEIGHT}} />
        ) : (
          <Banner
            bannerImages={[
              {id: 1, image: 'https://c4.wallpaperflare.com/wallpaper/766/970/409/cities-city-building-cityscape-wallpaper-preview.jpg'},
              {id: 2, image: 'https://c4.wallpaperflare.com/wallpaper/631/683/713/nature-bridge-sky-city-wallpaper-preview.jpg'},
              {id: 3, image: 'https://c4.wallpaperflare.com/wallpaper/977/138/381/tbilisi-georgia-wallpaper-preview.jpg'},
            ]}
            style={{height: BANNER_HEIGHT}}
          />
        )}
      </View>

      {/* ── SEARCH ── */}
      <View style={s.searchSection}>
        <TouchableOpacity
          style={s.searchBox}
          activeOpacity={0.85}
          onPress={() => navigateTo(navigation, t('SCREEN.CITY_PLACE_SEARCH'))}>
          <Ionicons name="search" size={22} color={C.oceanMid} />
          <Text style={s.searchPlaceholder}>{t('HOME.SEARCH_PLACEHOLDER')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── EXPLORE TALUKAS ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>{t('HOME.EXPLORE_TALUKAS')}</Text>
        <FlatList
          horizontal
          data={sortedCities}
          keyExtractor={(item, i) => `${item.id}_${i}`}
          renderItem={({item}) => (
            <TalukaCard item={item} onPress={() => getCityDetails(item)} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.talukasList}
          ItemSeparatorComponent={() => <View style={{width: 12}} />}
        />
      </View>

      {/* ── BUS TIMETABLE CARD ── */}
      <View style={s.sectionPad}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigateTo(navigation, STRING.SCREEN.ALL_ROUTES_SEARCH)}
          style={s.busCardWrap}>
          <LinearGradient
            colors={['rgba(196,151,42,0.9)', 'rgba(107,66,38,0.9)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={s.busCard}>
            <Image
              source={require('../Assets/Images/Bus1_png_high.png')}
              style={s.busIcon}
              resizeMode="contain"
            />
            <View style={s.busInfo}>
              <Text style={s.busTitle}>{t('HOME.BUS_TITLE')}</Text>
              <Text style={s.busSubtitle}>{t('HOME.BUS_SUBTITLE')}</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── MID AD BANNER ── */}
      <View style={s.sectionPad}>
        <AdBanner
          bannerImages={bannerObject?.HOME_MIDDLE}
          label={t('HOME.AD_LABEL')}
          size="340×160px · Above fold"
          bannerHeight={SW / 2.5}
        />
      </View>

      {/* ── POPULAR SPOTS ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>{t('HOME.POPULAR_SPOTS')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsRow}>
          {SPOT_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeSpotTab === tab && s.tabActive]}
              onPress={() => {
                setActiveSpotTab(tab);
                if (validTrendingKeys.includes(tab)) setActiveTab(tab);
              }}
              activeOpacity={0.8}>
              <Text style={[s.tabText, activeSpotTab === tab && s.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {validTrendingKeys.includes(activeSpotTab) && trending[activeSpotTab]?.length > 0 ? (
          <FlatList
            horizontal
            data={trending[activeSpotTab]}
            keyExtractor={(item, i) => `${item.id}_${i}`}
            renderItem={({item}) => (
              <PackageCard
                data={item}
                navigation={navigation}
                isConnected={offline}
                cardType="small"
                onClick={() => {}}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.spotsList}
            ItemSeparatorComponent={() => <View style={{width: 14}} />}
          />
        ) : (
          <FlatList
            horizontal
            data={filteredSpots}
            keyExtractor={item => String(item.id)}
            renderItem={({item}) => <SpotCard item={item} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.spotsList}
            ItemSeparatorComponent={() => <View style={{width: 14}} />}
          />
        )}
      </View>

      {/* ── NEARBY PLACES ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>{t('HOME.NEARBY')}</Text>
        <View style={s.nearbyGrid}>
          {STATIC_NEARBY.map(item => (
            <NearbyCard key={item.id} item={item} />
          ))}
        </View>
      </View>
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [bannerObject, cities, trending, activeSpotTab, filteredSpots, SPOT_TABS, validTrendingKeys, offline]);

  const listFooter = useMemo(() => (
    <View style={[s.sectionPad, {paddingBottom: 100}]}>
      <AdBanner
        bannerImages={bannerObject?.HOME_FOOTER}
        label={t('HOME.AD_STANDARD_LABEL')}
        size="Tap to advertise here"
        bannerHeight={SW / 3.5}
      />
    </View>
  ), [bannerObject, t]);

  // ── Render ──
  return (
    <View style={s.root}>
      <StatusBar backgroundColor="#0D3D4A" barStyle="light-content" />

      {/* ── Header (pinned, covers Android status bar area via SafeAreaView) ── */}
      <SafeAreaView edges={['top']} style={s.headerSafe}>
        {isLoading ? (
          <TopComponentSkeleton />
        ) : (
          <TopComponent
            navigation={navigation}
            currentCity={currentCity}
            gotoProfile={openProfile}
            showCities={showCityDropdown}
            onToggleCities={() => setShowCityDropdown(v => !v)}
          />
        )}
      </SafeAreaView>

      {/* ── City dropdown — rendered at root so it's never clipped ── */}
      {showCityDropdown && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setShowCityDropdown(false)}
            activeOpacity={0}
          />
          <View style={[s.cityDropdown, {top: dropdownTop + 6, width: (Math.min(15, Math.max(...topComponentCities.map(c => (c.name || '').length))) * 9) + 28 + 23}]}>
            {topComponentCities.map((city, index) => (
              <TouchableOpacity
                key={city.id ?? index}
                style={s.cityDropdownItem}
                onPress={() => { setShowCityDropdown(false); onCitySelect(city); }}
                activeOpacity={0.7}>
                <MaterialIcons name="location-pin" size={15} color="#4DB8C8" />
                <Text style={s.cityDropdownText} numberOfLines={1}>{city.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* ── Offline banner ── */}
      <CheckNet isOff={offline} />

      {/* ── Alert popup ── */}
      <Popup message={alertMessage} onPress={() => setIsAlert(false)} visible={isAlert} />

      {/* ── Full-page skeleton (shown while loading) ── */}
      {isLoading ? <HomeScreenSkeleton /> : null}

      {/* ── Main scroll (only mounted after loading) ── */}
      {!isLoading && (
        <KeyboardAwareFlatList
          data={[]}
          renderItem={null}
          extraHeight={DIMENSIONS.halfHeight}
          enableOnAndroid
          style={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
        />
      )}

      {/* ── LOCATION BOTTOM SHEET ── */}
      <BottomSheet
        refRBSheet={refRBSheet}
        height={300}
        Component={
          <LocationSheet
            setCurrentCity={name => setCurrentCity(name)}
            openLocationSheet={openLocationSheet}
            closeLocationSheet={closeLocationSheet}
          />
        }
        openLocationSheet={openLocationSheet}
        closeLocationSheet={closeLocationSheet}
      />

      {/* ── INITIAL MODE SELECTION MODAL (redesigned) ── */}
      <Modal visible={modePopup} transparent animationType="fade" statusBarTranslucent>
        <View style={s.modeOverlay}>
          <View style={s.modeCard}>
            {/* Header */}
            <View style={s.modeCardHeader}>
              <Text style={s.modeCardTitle}>{t('HOME.MODE_TITLE')}</Text>
              <Text style={s.modeCardSubtitle}>{t('HOME.MODE_SUBTITLE')}</Text>
            </View>

            {/* Options */}
            <View style={s.modeOptions}>
              <TouchableOpacity style={s.modeOption} onPress={() => changeMode(true)} activeOpacity={0.85}>
                <View style={[s.modeOptionIcon, {backgroundColor: 'rgba(76,209,55,0.12)'}]}>
                  <FontAwesome5Icon name="cloud" size={36} color="#4cd137" />
                </View>
                <Text style={s.modeOptionTitle}>{t('HOME.ONLINE_TITLE')}</Text>
                <Text style={s.modeOptionDesc}>{t('HOME.ONLINE_DESC')}</Text>
              </TouchableOpacity>

              <View style={s.modeDivider} />

              <TouchableOpacity style={s.modeOption} onPress={() => changeMode(false)} activeOpacity={0.85}>
                <View style={[s.modeOptionIcon, {backgroundColor: 'rgba(243,156,18,0.12)'}]}>
                  <Ionicons name="wifi-outline" size={36} color="#f39c12" />
                </View>
                <Text style={s.modeOptionTitle}>{t('HOME.OFFLINE_TITLE')}</Text>
                <Text style={s.modeOptionDesc}>{t('HOME.OFFLINE_DESC')}</Text>
              </TouchableOpacity>
            </View>

            {/* Note */}
            <View style={s.modeNote}>
              <Ionicons name="information-circle-outline" size={16} color={C.textLight} />
              <Text style={s.modeNoteText}>{t('NOTE')}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── SPLASH OVERLAY ── */}
      <Overlay
        isVisible={showSplash}
        onBackdropPress={() => setShowSplash(false)}
        overlayStyle={{padding: 0, backgroundColor: 'transparent', elevation: 0}}>
        <View style={s.splashWrap}>
          <TouchableOpacity onPress={() => setShowSplash(false)} style={s.splashClose}>
            <Ionicons name="close-circle" size={30} color={C.white} />
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
                  uri: splashBanner[0].image?.startsWith('http')
                    ? splashBanner[0].image
                    : `${FTP_PATH}${splashBanner[0].image}`,
                }}
                style={s.splashImg}
              />
            </TouchableOpacity>
          )}
        </View>
      </Overlay>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  scroll: {flex: 1, backgroundColor: C.cream},

  // ── Pinned header safe area ──
  headerSafe: {backgroundColor: C.oceanDeep},
  cityDropdown: {
    position: 'absolute',
    left: 68,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#1A5F70',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  cityDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  cityDropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // ── Banner ──
  bannerWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: C.oceanDeep,
  },
  bannerSkeleton: {
    backgroundColor: '#1B4A56',
    width: '100%',
  },

  // ── Search ──
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(250,247,240,0.95)',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'rgba(27,107,123,0.22)',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: C.textLight,
    fontWeight: '500',
  },

  // ── Sections ──
  section: {marginBottom: 24},
  sectionPad: {paddingHorizontal: 20, marginBottom: 24},
  sectionTitle: {
    fontFamily: undefined,
    fontSize: 20,
    fontWeight: '700',
    color: C.textDark,
    paddingHorizontal: 20,
    marginBottom: 14,
  },

  // ── Talukas ──
  talukasList: {paddingHorizontal: 20, paddingBottom: 8},

  // ── Bus card ──
  busCardWrap: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    shadowColor: 'rgba(196,151,42,1)',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  busCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: RADIUS,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  busIcon: {width: 54, height: 54, flexShrink: 0},
  busInfo: {flex: 1},
  busTitle: {fontSize: 17, fontWeight: '700', color: C.white, marginBottom: 3},
  busSubtitle: {fontSize: 12, color: 'rgba(255,255,255,0.85)'},

  // ── Ad banner (legacy — unused, kept for safety) ──
  adBannerLegacy: {
    backgroundColor: C.sandPale,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: C.sandMid,
    borderStyle: 'dashed',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },

  // ── Popular spots tabs ──
  tabsRow: {paddingHorizontal: 20, paddingBottom: 8, gap: 8},
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tabActive: {
    backgroundColor: C.oceanMid,
    borderColor: 'transparent',
  },
  tabText: {fontSize: 13, fontWeight: '600', color: C.textMid},
  tabTextActive: {color: C.white},
  spotsList: {paddingHorizontal: 20, paddingBottom: 8},

  // ── Nearby ──
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
    marginBottom: 14,
  },
  talukaSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    maxWidth: 140,
  },
  talukaSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textDark,
    flexShrink: 1,
  },
  nearbyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },

  // ── Initial mode modal ──
  modeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modeCard: {
    width: '100%',
    backgroundColor: C.white,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modeCardHeader: {
    backgroundColor: C.oceanDeep,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modeCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    marginBottom: 4,
  },
  modeCardSubtitle: {fontSize: 13, color: 'rgba(255,255,255,0.75)'},
  modeOptions: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  modeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  modeOptionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modeOptionTitle: {fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 4, textAlign: 'center'},
  modeOptionDesc: {fontSize: 11, color: C.textLight, textAlign: 'center', lineHeight: 16},
  modeDivider: {width: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginVertical: 10},
  modeNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 16,
    paddingTop: 0,
  },
  modeNoteText: {flex: 1, fontSize: 11, color: C.textLight, lineHeight: 16},

  // ── Splash ──
  splashWrap: {
    width: DIMENSIONS.screenWidth * 0.85,
    height: DIMENSIONS.screenHeight * 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashClose: {
    position: 'absolute',
    top: -15,
    right: -15,
    zIndex: 10,
  },
  splashImg: {width: '100%', height: '100%', borderRadius: 10, resizeMode: 'cover'},
});

// ── Taluka/Spot/Nearby card styles ──
const ts = StyleSheet.create({
  // Taluka card
  talukaCard: {
    width: 180,
    backgroundColor: C.glass,
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  talukaImgWrap: {width: '100%', height: 120, backgroundColor: '#e8f5f7'},
  talukaImg: {width: '100%', height: '100%'},
  talukaInfo: {padding: 12},
  talukaName: {fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 4},
  talukaDesc: {fontSize: 11, color: C.textLight, lineHeight: 16, marginBottom: 4},
  talukaPlaces: {fontSize: 11, color: C.textLight},
  talukaRating: {flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2},
  talukaRatingText: {fontSize: 11, color: C.textMid, fontWeight: '600'},
  talukaHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  talukaHeartActive: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },

  // Spot card
  spotCard: {
    width: 240,
    backgroundColor: C.glass,
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  spotImgWrap: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0f3f5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  spotEmoji: {fontSize: 52, lineHeight: 70},
  spotImgPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  spotBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  spotBadgeText: {fontSize: 11, fontWeight: '700', color: C.oceanMid},
  spotInfo: {padding: 13},
  spotName: {fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 5},
  spotLocation: {fontSize: 12, color: C.textLight, marginBottom: 7},
  spotMeta: {flexDirection: 'row', alignItems: 'center', gap: 6},
  spotMetaText: {fontSize: 11, color: C.textMid},
  spotMetaDot: {fontSize: 11, color: C.textLight},

  // Nearby card
  nearbyCard: {
    width: (SW - 52) / 2,
    backgroundColor: C.glass,
    borderRadius: RADIUS,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  nearbyEmoji: {fontSize: 38, lineHeight: 52, marginBottom: 8},
  nearbyCategoryBadge: {
    backgroundColor: C.oceanDeep,
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  nearbyCategoryText: {fontSize: 10, fontWeight: '700', color: C.white, textTransform: 'uppercase', letterSpacing: 0.6},
  nearbyName: {fontSize: 13, fontWeight: '600', color: C.textDark, textAlign: 'center', marginBottom: 4},
  nearbyDist: {fontSize: 11, color: C.textLight},

  // Ad banner
  adBannerWrap: {
    backgroundColor: C.sandPale,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: C.sandMid,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 120,
  },
  adLabelBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: C.sandMid,
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adLabelText: {fontSize: 10, fontWeight: '700', color: C.white, textTransform: 'uppercase', letterSpacing: 0.6},
  adPlaceholder: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  adIcon: {fontSize: 28, marginBottom: 8},
  adText: {fontSize: 14, fontWeight: '500', color: C.textMid, marginBottom: 4, textAlign: 'center'},
  adSize: {fontSize: 11, color: C.textLight, textAlign: 'center'},
});

// ─── Redux ─────────────────────────────────────────────────────────────────────

const mapStateToProps = state => ({
  access_token: state.commonState.access_token,
  mode: state.commonState.mode,
});

const mapDispatchToProps = dispatch => ({
  saveAccess_token: data => dispatch(saveAccess_token(data)),
  setLoader: data => dispatch(setLoader(data)),
  setMode: data => dispatch(setMode(data)),
  setSource: data => dispatch(setSource(data)),
  setDestination: data => dispatch(setDestination(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);
