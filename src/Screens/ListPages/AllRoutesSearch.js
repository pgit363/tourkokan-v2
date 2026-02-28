import React, {useCallback, useEffect, useRef, useState} from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import {FlatList, View, StyleSheet} from 'react-native';
import Header from '../../Components/Common/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {connect} from 'react-redux';
import {
  comnPost,
  dataSyncResult,
  getFromStorage,
  saveToStorage,
} from '../../Services/Api/CommonServices';
import {setLoader, setMode} from '../../Reducers/CommonActions';
import Loader from '../../Components/Customs/Loader';
import {
  backPage,
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import GlobalText from '../../Components/Customs/Text';
import RouteHeadCard from '../../Components/Cards/RouteHeadCard';
import styles from '../Styles';
import NetInfo from '@react-native-community/netinfo';
import CheckNet from '../../Components/Common/CheckNet';
import RoutesSearchPanel from '../../Components/Common/RoutesSearchPanel';
import RoutesSearchPanelSkeleton from '../../Components/Common/RoutesSearchPanelSkeleton';
import RouteHeadCardSkeleton from '../../Components/Cards/RouteHeadCardSkeleton';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ComingSoon from '../../Components/Common/ComingSoon';
import Popup from '../../Components/Common/Popup';
import Banner from '../../Components/Customs/Banner';
import {SafeAreaView} from 'react-native-safe-area-context';

const AllRoutesSearch = ({navigation, route, ...props}) => {
  const {t} = useTranslation();

  const [list, setList] = useState([]);
  const [offline, setOffline] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [source, setSource] = useState(route?.params?.source);
  const [destination, setDestination] = useState(route?.params?.destination);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPage, setLastPage] = useState(null);
  const [showOffline, setShowOffline] = useState(false);
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [bannerObject, setBannerObject] = useState({});
  const nextPageRef = useRef(1);
  const lastPageRef = useRef(null);
  const isLoadingRef = useRef(true);

  useEffect(() => {
    nextPageRef.current = nextPage;
  }, [nextPage]);

  useEffect(() => {
    lastPageRef.current = lastPage;
  }, [lastPage]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const getRoutesList = useCallback(item => {
    navigateTo(navigation, t('SCREEN.ROUTES_LIST'), {item});
  }, [navigation, t]);

  const searchRoute = useCallback(async (a, b, isNext) => {
    AsyncStorage.setItem('isLangChanged', 'false');

    const currentPage = isNext ? nextPageRef.current : 1;
    if (currentPage < 1) {
      return;
    }

    props.setLoader(true);
    const data = {
      source_place_id: a || source?.id,
      destination_place_id: b || destination?.id,
    };

    comnPost(`v2/routes?page=${currentPage}`, data, navigation)
      .then(res => {
        if (res.data.success) {
          const fetchedRoutes = res?.data?.data?.data || [];
          if (fetchedRoutes[0]) {
            saveToStorage(t('STORAGE.ROUTES_RESPONSE'), JSON.stringify(res));
            if (isNext) {
              setList(prevList => [...prevList, ...fetchedRoutes]);
            } else {
              setList(fetchedRoutes);
            }
            setNextPage(res.data.data.current_page + 1);
            setLastPage(res.data.data.last_page);
          } else {
            setList([]);
          }
          setIsLoading(false);
          setIsFirstTime(false);
        } else {
          setIsLoading(false);
          setIsFirstTime(false);
          setList([]);
        }
      })
      .catch(err => {
        console.error('Error loading routes:', err);
        setIsLoading(false);
        setIsFirstTime(false);
      })
      .finally(() => {
        props.setLoader(false);
      });
  }, [navigation, props.setLoader, source?.id, destination?.id, t]);

  useEffect(() => {
    props.setLoader(true);
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    // searchRoute();

    const unsubscribe = NetInfo.addEventListener(async state => {
      dataSyncResult(
        t('STORAGE.ROUTES_RESPONSE'),
        () => searchRoute(),
        props.mode,
      ).then(result => {
        const {data} = result;
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          if (Array.isArray(parsed)) {
            setList(parsed);
          } else if (parsed?.data?.data?.data) {
            setList(parsed.data.data.data);
          } else {
            setList([]);
          }
          setIsLoading(false);
        } catch {
          setOffline(true);
          setIsLoading(false);
        }
      });
      // removeFromStorage(t("STORAGE.LANDING_RESPONSE"))
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [navigation, props.mode, searchRoute, t]);

  useEffect(() => {
    const getBanners = async () => {
      const landingData = await getFromStorage(t('STORAGE.LANDING_RESPONSE'));
      if (landingData) {
        const parsedData = JSON.parse(landingData);
        if (parsedData?.banners) {
          setBannerObject(parsedData.banners);
        }
      }
    };
    getBanners();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const checkLangChange = async () => {
        const isLangChanged = await AsyncStorage.getItem('isLangChanged');
        if (isLangChanged === 'true') {
          searchRoute();
        }
      };
      checkLangChange();
    }, [searchRoute]),
  );

  const loadMoreRoutes = useCallback(async () => {
    const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
    // Check the internet connectivity state
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;

    // Combined condition for all three cases
    if (
      (isConnected && !mode) || // Case 1: Internet is available but mode is offline
      (!isConnected && !mode) || // Case 2: Internet is not available and mode is offline
      (!isConnected && mode) // Case 3: Internet is not available but mode is online
    ) {
      // The user should be alerted based on their mode and connectivity status
      setIsAlert(true);
      setAlertMessage(
        !isConnected && !mode
          ? t('ALERT.NETWORK') // Alert: Network is available but mode is offline
          : !isConnected && mode
          ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE') // Alert: Mode is offline, you need to set it to online
          : isConnected && !mode
          ? t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE') // Alert: No internet available but mode is online
          : '', // Default case (optional), if none of the conditions match
      );

      return;
    }

    if (!props.mode) {
      setShowOffline(true);
    } else if (
      !isLoadingRef.current &&
      nextPageRef.current <= lastPageRef.current
    ) {
      searchRoute(source, destination, true);
    }
  }, [destination, props.mode, searchRoute, source, t]);

  const closePopup = useCallback(() => {
    setIsAlert(false);
  }, []);

  const renderRouteItem = useCallback(
    ({item}) => (
      <RouteHeadCard
        data={item}
        cardClick={() => getRoutesList(item)}
        style={styles.routeHeadCard}
      />
    ),
    [getRoutesList],
  );

  const hasFooterBanner =
    !isLoading &&
    bannerObject?.ROUTE_LIST_FOOTER &&
    bannerObject.ROUTE_LIST_FOOTER.length > 0;

  return (
    <SafeAreaView edges={['top']} style={localStyles.safeArea}>
      <CheckNet isOff={offline} />
      {!isFirstTime && (
        <View style={localStyles.hiddenLoader}>
          <Loader />
        </View>
      )}
      <Header
        name={t('HEADER.ROUTES')}
        goBack={() => backPage(navigation)}
        startIcon={
          <Ionicons
            name="chevron-back-outline"
            color={COLOR.black}
            size={DIMENSIONS.userIconSize}
            onPress={() => backPage(navigation)}
          />
        }
      />
      {/* <Loader /> */}
      <View style={styles.routesSearchPanelView}>
        {isFirstTime && isLoading ? (
          <RoutesSearchPanelSkeleton />
        ) : (
          <RoutesSearchPanel
            mySource={source}
            myDestination={destination}
            setSourceId={v => setSource(v)}
            setDestinationId={v => setDestination(v)}
            route={route}
            navigation={navigation}
            from={t('SCREEN.ALL_ROUTES_SEARCH')}
            searchRoutes={(a, b) => searchRoute(a, b)}
            onSwap={(a, b) => searchRoute(a, b)}
          />
        )}
      </View>
      <View
        style={
          hasFooterBanner
            ? localStyles.listContainerWithFooter
            : localStyles.listContainer
        }>
        {isFirstTime && isLoading ? (
          <>
            <RouteHeadCardSkeleton />
            <RouteHeadCardSkeleton />
            <RouteHeadCardSkeleton />
            <RouteHeadCardSkeleton />
            <RouteHeadCardSkeleton />
          </>
        ) : list.length > 0 ? (
          <FlatList
            keyExtractor={item => item.id?.toString()}
            data={list}
            onEndReached={loadMoreRoutes}
            contentContainerStyle={localStyles.listContent}
            onEndReachedThreshold={0.5}
            renderItem={renderRouteItem}
          />
        ) : (
          <View style={localStyles.emptyState}>
            <GlobalText
              style={localStyles.emptyText}
              text={
                offline
                  ? t('NO_INTERNET')
                  : !props.isLoading
                  ? t('NO_DATA')
                  : ''
              }
            />
          </View>
        )}
      </View>
      {!isLoading &&
        bannerObject?.ROUTE_LIST_FOOTER &&
        bannerObject.ROUTE_LIST_FOOTER.length > 0 && (
          <View style={localStyles.footerWrapper}>
            <Banner
              bannerImages={bannerObject.ROUTE_LIST_FOOTER}
              style={localStyles.footerBanner}
            />
          </View>
        )}
      <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />
      <ComingSoon
        message={t('GET_MORE_DATA')}
        visible={showOffline}
        toggleOverlay={() => setShowOffline(false)}
      />
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLOR.white,
    flex: 1,
  },
  hiddenLoader: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContainerWithFooter: {
    flex: 1,
    marginBottom: DIMENSIONS.windowWidth / 3,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontWeight: 'bold',
  },
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  footerBanner: {
    height: DIMENSIONS.windowWidth / 3,
    marginBottom: 0,
  },
});

const mapStateToProps = state => {
  return {
    mode: state.commonState.mode,
    isLoading: state.commonState.isLoading,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoader(data));
    },
    setMode: data => {
      dispatch(setMode(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AllRoutesSearch);
