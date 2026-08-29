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

  FlatList,
  StyleSheet,
  Dimensions,
  Image,
  RefreshControl,
  Linking,
  BackHandler,
  Modal,
  useWindowDimensions,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
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
import {AWS_URL} from '@env';
import CachedImage from '../Components/Customs/CachedImage';
import {createLogger} from '../Services/Logger';

const log = createLogger('HomeScreen');

import TopComponent from '../Components/Common/TopComponent';
import TopComponentSkeleton from '../Components/Common/TopComponentSkeleton';
import HomeScreenSkeleton from '../Components/Common/HomeScreenSkeleton';
import Banner, {footerBannerHeight} from '../Components/Customs/Banner';
import CategoryArt from '../Components/Common/CategoryArt';
import CheckNet from '../Components/Common/CheckNet';
import Popup from '../Components/Common/Popup';
import BottomSheet from '../Components/Customs/BottomSheet';
import LocationSheet from '../Components/Common/LocationSheet';
import {KeyboardAwareFlatList} from 'react-native-keyboard-aware-scroll-view';

import {
  comnPost,
  dataSync,
  getFromStorage,
  saveToStorage,
} from '../Services/Api/CommonServices';
import {
  recordBannerImpression,
  recordBannerClick,
} from '../Services/Api/BannerServices';
import {
  saveAccess_token,
  setDestination,
  setLoader,
  setMode,
  setSource,
  setProfilePicture,
} from '../Reducers/CommonActions';
import {exitApp, navigateTo} from '../Services/CommonMethods';
import {useConnectivityGate} from '../Components/Common/useConnectivityGate';
import {useResponsive} from '../Services/responsive';
import {UpdateContext} from '../Context/UpdateContext';
import HotPlaces from '../Components/Sections/HotPlaces';
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
// Hero creatives are supplied as 2:1 landscape (1200x600) with ~6.7% safe
// padding on the tightest (left) edge. The container runs slightly taller at
// 1.8:1 so the band has presence and the image fills it edge-to-edge; `cover`
// then trims 5% per side, which stays inside that safe area.
// Do NOT go below ~1.75 here — past that the crop eats into the ad's text.
// (The original 1.35 ratio cut ~32% off the ad width — 16% per edge.)
const HERO_RATIO = 1.8;
const BANNER_HEIGHT = Math.round(SW / HERO_RATIO);
const RADIUS = 18;


// ─── Sub-components ────────────────────────────────────────────────────────────

// Taluka card (glassmorphism)
const TalukaCard = ({item, onPress, cardWidth, imgHeight}) => {
  // Tablet: moderate bump for the card's fixed-px text and heart.
  const {isTablet, ms} = useResponsive();
  const uri = item.image
    ? `${AWS_URL}${item.image}`
    : item.gallery?.[0]?.path
    ? `${AWS_URL}${item.gallery[0].path}`
    : null;
  log.debug('[TalukaCard img]', item.name, uri);

  return (
    <TouchableOpacity
      style={[ts.talukaCard, cardWidth && {width: cardWidth}]}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={[ts.talukaImgWrap, imgHeight && {height: imgHeight}]}>
        {uri ? (
          <CachedImage source={{uri}} style={ts.talukaImg} resizeMode="cover" />
        ) : (
          // No photo → themed category art. This section is talukas, so fall
          // back to the city theme when the row carries no categories.
          <CategoryArt
            categories={item.categories?.length ? item.categories : [{code: 'city'}]}
            style={ts.talukaImg}
          />
        )}
        {/* Favourite heart overlay */}
        <View
          style={[
            ts.talukaHeart,
            isTablet && {width: ms(26), height: ms(26), borderRadius: ms(13)},
            item.is_favorite && ts.talukaHeartActive,
          ]}>
          <Ionicons
            name={item.is_favorite ? 'heart' : 'heart-outline'}
            size={isTablet ? ms(14) : 14}
            color={item.is_favorite ? '#eb5757' : C.white}
          />
        </View>
      </View>
      <View style={ts.talukaInfo}>
        <Text style={[ts.talukaName, isTablet && {fontSize: ms(15)}]} numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text style={[ts.talukaDesc, isTablet && {fontSize: ms(11), lineHeight: ms(16)}]} numberOfLines={2}>{item.description}</Text>
        ) : item.places_count != null ? (
          <Text style={ts.talukaDesc}>{item.places_count} places to explore</Text>
        ) : null}
        <View style={ts.talukaRating}>
          <Ionicons name="star" size={isTablet ? ms(12) : 12} color={C.sandMid} />
          <Text style={[ts.talukaRatingText, isTablet && {fontSize: ms(11)}]}>
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

// Ad banner — always shows dashed outline; dynamic banner inside or static placeholder
const AdBanner = ({bannerImages, label, size, bannerHeight, minHeight}) => {
  const {width: winW} = useWindowDimensions();
  // inner width = screen minus sectionPad horizontal padding (20 × 2)
  const adBannerW = winW - 40;
  return (
    <View style={ts.adBannerWrap}>
      <View style={ts.adLabelBadge}>
        <Text style={ts.adLabelText}>{label || 'Premium Ad'}</Text>
      </View>
      {bannerImages?.length > 0 ? (
        <Banner
          bannerImages={bannerImages}
          width={adBannerW}
          minHeight={minHeight}
          style={{borderRadius: RADIUS - 2, overflow: 'hidden'}}
        />
      ) : (
        <View style={[ts.adPlaceholder, {height: bannerHeight}]}>
          <Text style={ts.adIcon}>📢</Text>
          <Text style={ts.adText}>Ad Space Available</Text>
          <Text style={ts.adSize}>{size || 'Tap to advertise here'}</Text>
        </View>
      )}
    </View>
  );
};


// ─── HomeScreen ────────────────────────────────────────────────────────────────

// [FLOW] counts how many times callLandingPageAPI is invoked vs how many actually hit the network
let LANDING_CALL_COUNT = 0;
let LANDING_HIT_COUNT = 0;

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
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [splashBanner, setSplashBanner] = useState([]);
  const splashShownRef = useRef(false);
  const isFetchingRef = useRef(false);
  const {isUpdatePending} = useContext(UpdateContext);
  const isUpdatePendingRef = useRef(isUpdatePending);

  const [mode, setMode] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const {modal: connectivityModal, ensureOnline} = useConnectivityGate();
  const {isTablet, width: rWidth, contentWidth} = useResponsive();
  // Hero: keep phone ratio on phones; cap height on tablets so it isn't a
  // ~600dp stretched/cropped band.
  const heroHeight = isTablet
    ? Math.min(Math.round(rWidth / HERO_RATIO), 380)
    : BANNER_HEIGHT;
  // Bigger horizontal cards on tablet (keeps the carousel layout), sized
  // proportionally to the usable content width like the ad banner.
  const cardWidth = isTablet ? Math.round(contentWidth * 0.34) : 180;
  const cardImgH = Math.round(cardWidth * 0.66);

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
    {cities: [], routes: [], bannerObject: {}, trending: {}, hot_sites: [], isLoading: true, isFetching: true},
  );
  const {cities, bannerObject, trending, hot_sites, isLoading} = state;


  const topComponentCities = useMemo(
    () => [sindhudurg, ...cities],
    [sindhudurg, cities],
  );

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0)),
    [cities],
  );


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

  // ── Restore profile picture from storage on mount ──
  useEffect(() => {
    AsyncStorage.getItem(t('STORAGE.PROFILE_PICTURE')).then(val => {
      if (val) {
        const pic = JSON.parse(val);
        if (pic) props.setProfilePicture(pic);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update context ──
  useEffect(() => {
    isUpdatePendingRef.current = isUpdatePending;
    if (isUpdatePending) {
      setShowSplash(false);
      setModePopup(false);
      setIsAlert(false);
    }
  }, [isUpdatePending]);

  // ── Back handler — only active when HomeScreen is focused ──
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        t('EVENT.HARDWARE_BACK_PRESS'),
        () => exitApp(),
      );
      return () => backHandler.remove();
    }, [t]),
  );

  // ── Init ──
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};
    // Track connectivity so we only fetch on the FIRST connected event and on
    // genuine offline→online reconnects — NetInfo fires on every detail change,
    // which was causing the landing page API to be hit multiple times.
    let wasConnected = null;
    let didInitialFetch = false;
    log.flow('init useEffect RUN. access_token=', props.access_token);

    const init = async () => {
      dispatch({type: 'SET_LOADING', payload: true});
      const localData = await getFromStorage(t('STORAGE.LANDING_RESPONSE'));
      log.flow('init: localData present?', !!localData);
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
              payload: {cities: res.cities, routes: res.routes, bannerObject: res.banners, trending: res.trending || {}, hot_sites: res.hot_sites || []},
            });
          }
        } catch (e) {
          log.warn('cached landing parse failed:', e);
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

      const token = await AsyncStorage.getItem(t('STORAGE.ACCESS_TOKEN')) || props.access_token;
      if (!token) {
        log.flow('init: no token → navigate EMAIL');
        navigateTo(navigation, t('SCREEN.EMAIL'));
        return;
      }

      if (!isLandingDataFetched && props.access_token) {
        setIsLandingDataFetched(true);
      }

      log.flow('init: registering NetInfo listener');
      unsubscribe = NetInfo.addEventListener(async netState => {
        if (!isMounted) return;
        const connected = !!netState.isConnected;
        log.flow('NetInfo listener FIRED. isConnected=', connected);
        setOffline(!connected);

        const storedMode = JSON.parse(await getFromStorage(STRING.STORAGE.MODE));
        setMode(storedMode);

        if (!connected) {
          dispatch({type: 'SET_LOADING', payload: false});
          wasConnected = connected;
          return;
        }

        // Only fetch on the first connected event or on a real offline→online
        // reconnect — ignore NetInfo's repeated same-state fires.
        const reconnected = wasConnected === false;
        wasConnected = connected;
        if (didInitialFetch && !reconnected) {
          log.flow('NetInfo: already fetched & not a reconnect → SKIP');
          return;
        }
        didInitialFetch = true;

        log.flow('NetInfo → dataSync(landingpage) storedMode=', storedMode, '[landingpage trigger #Home-init-NetInfo]');
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
                  payload: {cities: res.cities, routes: res.routes, bannerObject: res.banners, trending: res.trending || {}, hot_sites: res.hot_sites || []},
                });
                if (res.unread_message_count !== undefined) {
                  setUnreadCount(res.unread_message_count);
                }
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
    };

    init();

    return () => {
      isMounted = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.access_token]);

  // ── First-login mode popup ──
  // Shown once content is visible (not over the skeleton) and regardless of
  // whether landing data came from cache or a fresh fetch. IS_FIRST_TIME is set
  // to 'true' by the login flow and cleared here so it only shows once.
  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    (async () => {
      const firstTime = await getFromStorage(t('STORAGE.IS_FIRST_TIME'));
      log.flow('mode popup check: isLoading=false, isFirstTime=', firstTime);
      if (cancelled) return;
      if (firstTime === 'true' || firstTime === true) {
        log.flow('mode popup → SHOW');
        setModePopup(true);
        AsyncStorage.setItem(t('STORAGE.IS_FIRST_TIME'), JSON.stringify(false));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, t]);

  // ── Focus sync ──
  useFocusEffect(
    React.useCallback(() => {
      log.flow('focus useFocusEffect RUN');
      const fetchData = async () => {
        const isUpdated = await AsyncStorage.getItem('isUpdated');
        checkToken();

        const storedMode = JSON.parse(await getFromStorage(STRING.STORAGE.MODE));
        if (storedMode !== null && storedMode !== undefined) {
          setMode(storedMode);
          props.setMode(storedMode);
        }

        log.flow('focus fetchData: isUpdated=', isUpdated, 'props.mode=', props.mode);
        if (isUpdated === 'true' && props.mode) {
          log.flow('focus → callLandingPageAPI() [landingpage trigger #Home-focus]');
          dispatch({type: 'SET_LOADING', payload: true});
          await callLandingPageAPI();
        }
      };
      fetchData();
      return () => {};
    }, [props.mode, isInitialLoad, callLandingPageAPI]),
  );

  // ── Unread message count — poll every 30 s while screen is focused ──
  useFocusEffect(
    useCallback(() => {
      if (!mode || offline) return;
      const fetchCount = async () => {
        // Respect offline mode even if local state lags (read storage fresh).
        const storedMode = JSON.parse((await getFromStorage(STRING.STORAGE.MODE)) ?? 'true');
        if (!storedMode) return;
        comnPost('v2/unreadMessageCount')
          .then(res => {
            const d = res?.data?.data;
            const n = d?.unread_message_count ?? d?.count ?? d?.unread_count ?? 0;
            setUnreadCount(n);
          })
          .catch(() => {});
      };
      fetchCount();
      const id = setInterval(fetchCount, 30000);
      return () => clearInterval(id);
    }, [mode, offline]),
  );

  // ── API ──
  const callLandingPageAPI = useCallback(async site_id => {
    LANDING_CALL_COUNT += 1;
    const callNo = LANDING_CALL_COUNT;
    log.flow(`callLandingPageAPI ENTER #${callNo} site_id=`, site_id, 'isFetching=', isFetchingRef.current);
    try {
      if (isFetchingRef.current) {
        log.flow(`callLandingPageAPI #${callNo} SKIPPED (already fetching)`);
        dispatch({type: 'SET_LOADING', payload: false});
        return;
      }
      isFetchingRef.current = true;

      const storedMode = JSON.parse(await getFromStorage(STRING.STORAGE.MODE));
      if (!storedMode) {
        log.flow(`callLandingPageAPI #${callNo} SKIPPED (offline mode)`);
        dispatch({type: 'SET_LOADING', payload: false});
        return;
      }

      const selectedCity = await getSelectedCity();
      const data = selectedCity ? {site_id: selectedCity.id} : {site_id};

      // Only show skeleton on initial load (no cached data).
      // When called as background refresh, update data silently.
      LANDING_HIT_COUNT += 1;
      log.flow(`►► HITTING v2/landingpage (call #${callNo}, network hit #${LANDING_HIT_COUNT}) data=`, data);
      const res = await comnPost('v2/landingpage', data, navigation);
      log.flow(`◄◄ v2/landingpage returned (call #${callNo})`);
      log.flow(res)
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
          payload: {cities: res.data.data.cities, routes: res.data.data.routes, bannerObject: res.data.data.banners, trending: res.data.data.trending || {}, hot_sites: res.data.data.hot_sites || []},
        });

        if (res.data.data.unread_message_count !== undefined) {
          setUnreadCount(res.data.data.unread_message_count);
        }

        // Save categories immediately so Categories screen picks up the new language right away
        if (res.data.data.categories?.length > 0) {
          saveToStorage(t('STORAGE.CATEGORIES_RESPONSE'), JSON.stringify(res.data.data.categories));
        }

        if (res.data.data.banners?.APP_SPLASH?.length > 0 && !splashShownRef.current && !isUpdatePendingRef.current) {
          const splash = res.data.data.banners.APP_SPLASH;
          setSplashBanner(splash);
          setShowSplash(true);
          splashShownRef.current = true;
          if (splash[0]?.id) recordBannerImpression(splash[0].id, 'APP_SPLASH');
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
      props.setProfilePicture(resp.user.profile_picture || null);
    }
  };

  // Pull-to-refresh — connectivity guard via shared helper
  // (see docs/offline-mode-connectivity-guard.md)
  const onRefresh = () => {
    props.setSource('');
    props.setDestination('');
    ensureOnline(() => {
      setRefreshing(true);
      callLandingPageAPI();
      setRefreshing(false);
    });
  };

  const onCitySelect = async city => {
    const storedMode = JSON.parse(await getFromStorage(STRING.STORAGE.MODE));
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

    setShowCityDropdown(false);
    setCurrentCity(city.name);
    isFetchingRef.current = false;
    dispatch({type: 'SET_LOADING', payload: true});

    log.flow('onCitySelect → callLandingPageAPI() [landingpage trigger #Home-citySelect] city=', city?.name, city?.id);
    if (city.id === 0) {
      // Sindhudurg (default) — clear stored city so callLandingPageAPI sends no site_id
      await saveToStorage(t('STORAGE.SELECTED_CITY_ID'), JSON.stringify(null));
      await saveToStorage(t('STORAGE.SELECTED_CITY_NAME'), JSON.stringify(null));
      callLandingPageAPI();
    } else {
      await saveToStorage(t('STORAGE.SELECTED_CITY_ID'), JSON.stringify(city.id));
      await saveToStorage(t('STORAGE.SELECTED_CITY_NAME'), JSON.stringify(city.name));
      callLandingPageAPI(city.id);
    }
  };

  const openProfile = () => navigateTo(navigation, t('SCREEN.PROFILE_VIEW'));
  const getSiteDetails = site => navigateTo(navigation, t('SCREEN.SITE_DETAIL'), {city: site});
  const openLocationSheet = () => refRBSheet.current.open();
  const closeLocationSheet = () => refRBSheet.current.close();

  const changeMode = async val => {
    await saveToStorage(STRING.STORAGE.MODE, JSON.stringify(val));
    setMode(val);
    props.setMode(val);
    setModePopup(false);
  };

  // ── Memoized list content — won't re-render on dropdown toggle ──
  const listHeader = useMemo(() => (
    <>
      {/* ── BANNER ── */}
      <View style={[s.bannerWrap, {height: heroHeight}]}>
        {bannerObject?.HOME_HERO?.length > 0 ? (
          <Banner
            bannerImages={bannerObject.HOME_HERO}
            width={rWidth}
            style={{height: heroHeight}}
            // fill the band edge-to-edge; the 1.8:1 container keeps the trim
            // within the creative's safe area (see HERO_RATIO)
            resizeMode="cover"
          />
        ) : (
          <View style={[s.heroPlaceholder, {height: heroHeight}]}>
            <View style={ts.adLabelBadge}>
              <Text style={ts.adLabelText}>Premium Ad</Text>
            </View>
            <Text style={ts.adIcon}>📢</Text>
            <Text style={ts.adText}>Ad Space Available</Text>
            <Text style={ts.adSize}>Tap to advertise here</Text>
          </View>
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
            <TalukaCard
              item={item}
              onPress={() => getSiteDetails(item)}
              cardWidth={cardWidth}
              imgHeight={isTablet ? cardImgH : undefined}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.talukasList}
          ItemSeparatorComponent={() => <View style={{width: 12}} />}
        />
      </View>

      {/* ── BUS TIMETABLE CARD ── */}
      <Text style={s.sectionTitle}>{t('HOME.BUS_SECTION')}</Text>
      <View style={s.sectionPad}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => ensureOnline(() => navigateTo(navigation, STRING.SCREEN.BUS_ROUTE_LIST))}
          style={s.busCardWrap}>
          <LinearGradient
            colors={['rgba(196,151,42,0.9)', 'rgba(107,66,38,0.9)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[s.busCard, isTablet && {padding: 28}]}>
            <Image
              source={require('../Assets/Images/Bus1_png_high.png')}
              style={[s.busIcon, isTablet && {width: 68, height: 68}]}
              resizeMode="contain"
            />
            <View style={s.busInfo}>
              <Text style={[s.busTitle, isTablet && {fontSize: 21}]}>{t('HOME.BUS_TITLE')}</Text>
              <Text style={[s.busSubtitle, isTablet && {fontSize: 14}]}>{t('HOME.BUS_SUBTITLE')}</Text>
            </View>
            <Ionicons name="arrow-forward" size={isTablet ? 26 : 22} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── MID AD BANNER ── */}
      <View style={s.sectionPad}>
        <AdBanner
          bannerImages={bannerObject?.HOME_MIDDLE}
          label={t('HOME.AD_LABEL')}
          size="Premium Ad · Tap to advertise"
        />
      </View>

      {/* ── POPULAR SPOTS ── (hidden: implementation pending) */}

      {/* ── HOT PLACES ── */}
      <HotPlaces
        hot_sites={hot_sites}
        onCardPress={getSiteDetails}
      />

      {/* ── EVENTS ── */}
      <Text style={s.sectionTitle}>{t('HOME.EVENTS_SECTION')}</Text>
      <View style={s.section}>
        <TouchableOpacity
          style={[
            s.eventsBanner,
            {minHeight: isTablet ? 124 : 94},
            isTablet && {padding: 28},
          ]}
          onPress={() => ensureOnline(() => navigation.navigate(STRING.SCREEN.EVENTS_LIST))}
          activeOpacity={0.85}>
          <Ionicons name="calendar" size={isTablet ? 44 : 36} color="#FFFFFF" />
          <View style={{flex: 1}}>
            <Text style={[s.eventsBannerTitle, {fontSize: isTablet ? 21 : 17}]}>{t('HOME.EVENTS_TITLE')}</Text>
            <Text style={[s.eventsBannerSub, isTablet && {fontSize: 14}]}>{t('HOME.EVENTS_SUBTITLE')}</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={isTablet ? 32 : 26} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
    </>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [bannerObject, cities, trending, hot_sites, offline, navigation, isTablet, rWidth, heroHeight, cardWidth, cardImgH, ensureOnline]);

  const listFooter = useMemo(() => (
    <View style={[s.sectionPad, {paddingBottom: isTablet ? 150 : 100}]}>
      <AdBanner
        bannerImages={bannerObject?.HOME_FOOTER}
        label={t('HOME.AD_STANDARD_LABEL')}
        size="Standard Ad · Tap to advertise"
        minHeight={footerBannerHeight(rWidth - 40)}
      />
    </View>
  ), [bannerObject, t, isTablet, rWidth]);

  // ── Render ──
  return (
    <View style={s.root}>
      <SystemBars style="light" />

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
            unreadCount={unreadCount}
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
      {connectivityModal}

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
                if (splashBanner[0]?.id) recordBannerClick(splashBanner[0].id, 'APP_SPLASH');
                if (splashBanner[0].redirect_url) {
                  Linking.openURL(splashBanner[0].redirect_url);
                  setShowSplash(false);
                }
              }}
              style={{width: '100%', height: '100%'}}>
              <Image
                source={{
                  // honour the Marathi creative when the advertiser supplied one
                  uri: (() => {
                    const img =
                      (i18n.language === 'mr' && splashBanner[0].mr_image) ||
                      splashBanner[0].image;
                    return img?.startsWith('http') ? img : `${AWS_URL}${img}`;
                  })(),
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
    marginBottom: 0,
  },
  bannerSkeleton: {
    backgroundColor: '#1B4A56',
    width: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.sandPale,
    borderWidth: 2,
    borderColor: C.sandMid,
    borderStyle: 'dashed',
  },

  // ── Search ──
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(250,247,240,0.95)',
    marginBottom: 24,
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
  section: {marginBottom: 24, paddingHorizontal: 0},
  sectionPad: {paddingHorizontal: 20, marginBottom: 24},
  sectionSeparator: {
    height: 8,
    backgroundColor: C.sandPale,
    marginHorizontal: -20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: undefined,
    fontSize: 20,
    fontWeight: '700',
    color: C.textDark,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
    marginBottom: 14,
  },
  seeAllBtn: {flexDirection: 'row', alignItems: 'center', gap: 2},
  seeAllText: {fontSize: 13, color: C.oceanMid, fontWeight: '600'},
  eventsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, borderRadius: 16,
    backgroundColor: C.oceanMid,
    paddingHorizontal: 18, paddingVertical: 18,
  },
  eventsBannerTitle: {fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2},
  eventsBannerSub: {fontSize: 12, color: 'rgba(255,255,255,0.8)'},

  // ── Talukas ──
  talukasList: {paddingHorizontal: 20, paddingBottom: 8},

  // ── Bus card ──
  busCardWrap: {
    borderRadius: RADIUS,
    overflow: 'hidden',
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
    maxWidth: 480,
    alignSelf: 'center',
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

  // Trending card
  trendCard: {
    width: 210,
    backgroundColor: C.white,
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  trendImgWrap: {width: '100%', height: 150, backgroundColor: '#e8f5f7'},
  trendImg: {width: '100%', height: '100%'},
  trendImgGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  trendCategoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: C.oceanDeep,
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trendCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  trendInfo: {padding: 12},
  trendName: {fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 4},
  trendDesc: {fontSize: 11, color: C.textLight, lineHeight: 16, marginBottom: 8},
  trendFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendViewBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.oceanMid,
  },

  // Nearby / Hot Places card
  nearbyCard: {
    width: (SW - 52) / 2,
    backgroundColor: C.white,
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  nearbyImgWrap: {width: '100%', height: 110, backgroundColor: '#e8f5f7'},
  nearbyImg: {width: '100%', height: '100%'},
  nearbyImgGradient: {position: 'absolute', bottom: 0, left: 0, right: 0, height: 50},
  nearbyHotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 50,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyHotBadgeText: {fontSize: 13},
  nearbyCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.oceanDeep,
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 3,
    margin: 10,
    marginBottom: 4,
  },
  nearbyCategoryText: {fontSize: 9, fontWeight: '700', color: C.white, textTransform: 'uppercase', letterSpacing: 0.6},
  nearbyName: {fontSize: 13, fontWeight: '700', color: C.textDark, paddingHorizontal: 10, marginBottom: 3},
  nearbySub: {fontSize: 11, color: C.textLight, paddingHorizontal: 10, paddingBottom: 10, lineHeight: 15},

  // Ad banner
  adBannerWrap: {
    backgroundColor: C.sandPale,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: C.sandMid,
    borderStyle: 'dashed',
    overflow: 'hidden',
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
  setProfilePicture: data => dispatch(setProfilePicture(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);
