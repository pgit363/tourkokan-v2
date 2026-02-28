/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {
  comnPost,
  dataSyncResult,
  saveToStorage,
  getFromStorage,
} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import Header from '../../Components/Common/Header';
import {setLoader, setMode} from '../../Reducers/CommonActions';
import {
  backPage,
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import NetInfo from '@react-native-community/netinfo';
import GlobalText from '../../Components/Customs/Text';
import {useTranslation} from 'react-i18next';
import ComingSoon from '../../Components/Common/ComingSoon';
import Popup from '../../Components/Common/Popup';
import FlatListSkeleton from './FlatListSkeleton';
import PackageCard from '../../Components/Cards/PackageCard';

const CityList = ({navigation, route, ...props}) => {
  const {t} = useTranslation();

  const [cities, setCities] = useState([]); // State to store cities
  const [offline, setOffline] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastPage, setLastPage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlineMode, setShowOnlineMode] = useState(false);
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    props.setLoader(true);
    setLoading(true);

    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    setCities([]);

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(!state.isConnected);

      dataSyncResult(
        t('STORAGE.CITIES_RESPONSE'),
        () => fetchCities(1, true),
        props.mode,
      ).then(result => {
        const resp = result.data;
        if (resp) {
          const res = typeof resp === 'string' ? JSON.parse(resp) : resp;
          if (Array.isArray(res)) {
            setCities(res);
          } else if (res?.data?.data?.data) {
            setCities(res.data.data.data);
          }
        } else if (result.offline) {
          setOffline(true);
        }
        setLoading(false);
        props.setLoader(false);
      });
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchCities(1, true);
  }, [route.params]);

  const fetchCities = (page, reset) => {
    if (reset) {
      setCities([]);
    }
    if (props.mode) {
      setLoading(true);
      let data = {};
      if (route?.params?.subCat) {
        data = {
          apitype: 'list',
          parent_id: route?.params?.parent_id,
          category: route?.params?.subCat?.code || '',
          per_page: 20,
          page: page,
        };
      } else {
        data = {
          apitype: 'list',
          parent_id: route?.params?.parent_id,
          per_page: 20,
          page: page,
        };
      }
      comnPost('v2/sites', data, navigation)
        .then(res => {
          if (res && res.data.data) {
            if (reset) {
              setCities(res.data.data.data);
            } else {
              setCities(prevCities => [...prevCities, ...res.data.data.data]);
            }
            setNextPage(res.data.data.current_page + 1);
            setLastPage(res.data.data.last_page);
            saveToStorage(
              t('STORAGE.CITIES_RESPONSE'),
              JSON.stringify(res.data.data.data),
            );
            return res.data.data.data;
          }
          setLoading(false);
          props.setLoader(false);
          setRefreshing(false);
          return null;
        })
        .catch(fetchError => {
          console.error('Error fetching cities:', fetchError);
          setLoading(false);
          props.setLoader(false);
          setRefreshing(false);
          return null;
        });
    }
    return null;
  };

  const getCityDetails = city => {
    navigateTo(navigation, t('SCREEN.CITY_DETAILS'), {city});
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (props.mode) {
      fetchCities(1, true);
    } else {
      setShowOnlineMode(true);
      setRefreshing(false);
    }
  };

  const renderItem = ({item}) => (
    // <TouchableOpacity
    //   onPress={() => getCityDetails(item)}
    //   style={styles.SmallChipCard}>
    //   <GlobalText style={styles.cityListName} text={item.name} />
    // </TouchableOpacity>
    // <PlaceCard data={item} onClick={() => getCityDetails(item)} />
    <PackageCard
      data={item}
      onClick={() => getCityDetails(item)}
      cardType={'long'}
    />
    // <CityCard data={item} onClick={() => getCityDetails(item)} />
    // <CityCardSmall data={item} onClick={() => getCityDetails(item)} />
  );

  const loadMoreCities = async () => {
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
    if (props.mode && !loading && nextPage <= lastPage) {
      fetchCities(nextPage, false);
    }
  };

  const closePopup = () => {
    setIsAlert(false);
  };

  const renderFooter = () => {
    if (!loading) {
      return null;
    }
    return (
      <View style={localStyles.footer}>
        <ActivityIndicator size="small" color={COLOR.primary} />
      </View>
    );
  };

  return (
    <>
      <Header
        name={
          route?.params?.subCat?.name ||
          route?.params?.type ||
          t('HEADER.CITIES')
        }
        startIcon={
          <Ionicons
            name="chevron-back-outline"
            color={COLOR.black}
            size={DIMENSIONS.userIconSize}
            onPress={() => backPage(navigation)}
          />
        }
      />
      <FlatList
        data={cities}
        keyExtractor={item => item.id?.toString()}
        renderItem={renderItem}
        onEndReached={loadMoreCities}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={localStyles.emptyWrap}>
            {offline ? (
              <GlobalText style={localStyles.emptyText} text={t('NO_INTERNET')} />
            ) : (
              <FlatListSkeleton />
            )}
          </View>
        }
      />
      <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />
      <ComingSoon
        message={t('ONLINE_MODE')}
        visible={showOnlineMode}
        toggleOverlay={() => setShowOnlineMode(false)}
      />
    </>
  );
};

const localStyles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
  },
  emptyWrap: {
    height: DIMENSIONS.screenHeight,
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontWeight: 'bold',
  },
});

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
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

export default connect(mapStateToProps, mapDispatchToProps)(CityList);
