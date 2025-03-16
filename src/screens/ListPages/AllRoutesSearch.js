import React, {useEffect, useState} from 'react';
import {FlatList, View, Text, SafeAreaView} from 'react-native';
import Header from '../../Components/Common/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {connect} from 'react-redux';
import {
  comnPost,
  dataSync,
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

const AllRoutesSearch = ({navigation, route, ...props}) => {
  const {t} = useTranslation();

  const [list, setList] = useState([]);
  const [offline, setOffline] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [nextUrl, setNextUrl] = useState(1);
  const [source, setSource] = useState(route?.params?.source);
  const [destination, setDestination] = useState(route?.params?.destination);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastPage, setLastPage] = useState(null);
  const [showOffline, setShowOffline] = useState(false);
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    props.setLoader(true);
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    // searchRoute();

    const unsubscribe = NetInfo.addEventListener(async state => {
      dataSync(t('STORAGE.ROUTES_RESPONSE'), searchRoute(), props.mode).then(
        resp => {
          if (resp) {
            let res = JSON.parse(resp);
            setList(res);
            setIsLoading(false);
          } else if (resp) {
            setOffline(true);
            setIsLoading(false);
          }
          // props.setLoader(false);
        },
      );
      // removeFromStorage(t("STORAGE.LANDING_RESPONSE"))
    });
    props.setLoader(false);

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, []);

  useFocusEffect(
    React.useCallback(async () => {
      if ((await AsyncStorage.getItem('isLangChanged')) == 'true') {
        searchRoute();
      }
    }),
  );

  const getRoutesList = item => {
    navigateTo(navigation, t('SCREEN.ROUTES_LIST'), {item});
  };

  const searchRoute = async (a, b, isNext) => {
    AsyncStorage.setItem('isLangChanged', 'false');

    if (nextPage >= 1) {
      props.setLoader(true);
      const data = {
        source_place_id: a || source?.id,
        destination_place_id: b || destination?.id,
      };

      comnPost(`v2/routes?page=${isNext ? nextPage : 1}`, data, navigation)
        .then(res => {
          if (res.data.success) {
            if (res && res.data.data.data[0]) {
              saveToStorage(t('STORAGE.ROUTES_RESPONSE'), JSON.stringify(res));
              let myNextUrl = res.data.data.next_page_url;
              setNextUrl(myNextUrl);
              if (myNextUrl) {
                nextPage !== myNextUrl[myNextUrl.length - 1] && isNext
                  ? setList([...list, ...res.data.data.data])
                  : setList([...res.data.data.data]);
              } else {
                setList([...res.data.data.data]);
              }
              setNextPage(res.data.data.current_page + 1);
              setLastPage(res.data.data.last_page);
              setIsLoading(false);
              setIsFirstTime(false);
              props.setLoader(false);
            } else {
              setIsLoading(false);
              setIsFirstTime(false);
              setList([]);
              props.setLoader(false);
            }
          } else {
            setIsLoading(false);
            setIsFirstTime(false);
            setList([]);
            props.setLoader(false);
          }
        })
        .catch(err => {
          setIsLoading(false);
          setIsFirstTime(false);
          props.setLoader(false);
        });
    }
  };

  const loadMoreRoutes = async () => {
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
    } else if (!isLoading && nextPage <= lastPage) {
      searchRoute(source, destination, true);
    }
  };

  const closePopup = () => {
    setIsAlert(false);
  };

  const renderItem = ({item}) => {
    return (
      // <ListItem bottomDivider onPress={() => getRoutes(item)}>
      //   {/* <Avatar source={{ uri: item.avatar_url }} /> */}
      //   <RouteLine />
      //   <GlobalText text={item.id} />
      //   <ListItem.Content>
      //     {/* <ListItem.Title>{item.number}</ListItem.Title> */}
      //     <ListItem.Title>{item.name}</ListItem.Title>
      //   </ListItem.Content>
      //   <ListItem.Chevron />
      // </ListItem>
      <View style={styles.sectionView}>
        {list.map((route, index) => (
          <View style={styles.cardsWrap}>
            <RouteHeadCard
              data={route}
              cardClick={() => getRoutesList(route)}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={{backgroundColor: COLOR.white}}>
      <CheckNet isOff={offline} />
      {!isFirstTime && <Loader />}
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
      <SafeAreaView
        style={{
          height: DIMENSIONS.halfHeight + DIMENSIONS.headerSpace - 30,
        }}>
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
            keyExtractor={item => item.id}
            data={list}
            onEndReached={() => loadMoreRoutes()}
            style={{marginBottom: 40}}
            onEndReachedThreshold={0.5}
            renderItem={({item}) => (
              <RouteHeadCard
                data={item}
                cardClick={() => getRoutesList(item)}
                style={styles.routeHeadCard}
              />
            )}
          />
        ) : (
          <View style={{alignItems: 'center', padding: 50}}>
            <GlobalText
              style={{fontWeight: 'bold'}}
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
      </SafeAreaView>
      <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />
      <ComingSoon
        message={t('GET_MORE_DATA')}
        visible={showOffline}
        toggleOverlay={() => setShowOffline(false)}
      />
    </View>
  );
};

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
