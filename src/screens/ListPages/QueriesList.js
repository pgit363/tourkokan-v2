import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  FlatList,
  View,
  Linking,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import {ListItem} from '@rneui/themed';
import Header from '../../Components/Common/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import COLOR from '../../Services/Constants/COLORS';
import {
  backPage,
  checkLogin,
  goBackHandler,
} from '../../Services/CommonMethods';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import styles from './Styles';
import {
  comnPost,
  dataSync,
  saveToStorage,
} from '../../Services/Api/CommonServices';
import Loader from '../../Components/Customs/Loader';
import {setLoader} from '../../Reducers/CommonActions';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import CheckNet from '../../Components/Common/CheckNet';
import NetInfo from '@react-native-community/netinfo';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import GlobalText from '../../Components/Customs/Text';
import ContactUs from '../ContactUs';
import ComingSoon from '../../Components/Common/ComingSoon';
import STRING from '../../Services/Constants/STRINGS';

const QueriesList = ({navigation, route, ...props}) => {
  const {t} = useTranslation();
  const isMounted = useRef(true);

  const [data, setData] = useState([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [step, setStep] = useState(route.params?.step || 0);
  const [showOnlineMode, setShowOnlineMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      STRING.EVENT.HARDWARE_BACK_PRESS,
      () => goBackStep(),
    );

    checkLogin(navigation);
    props.setLoader(true);
    setData([]);

    // Function to check if data exists in storage and fetch if not
    const checkStoredData = async () => {
      try {
        const storedData = await dataSync(
          t('STORAGE.QUERIES'),
          null,
          props.mode,
        );
        if (storedData) {
          setData(JSON.parse(storedData));
          props.setLoader(false);
        } else {
          // Data is not in storage, fetch it from the API
          fetchData(1, true);
        }
      } catch (error) {
        console.error('Error checking stored data:', error);
        fetchData(1, true);
      }
    };

    const fetchDataAsync = async () => {
      if (props.access_token) {
        await fetchData(1, true);
      }
    };

    // Check stored data and then fetch if needed
    checkStoredData();

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(!state.isConnected);
      if (state.isConnected) {
        checkStoredData(); // Recheck storage and possibly fetch data
      } else {
        props.setLoader(false);
      }
    });

    return () => {
      backHandler.remove();
      unsubscribe();
      isMounted.current = false;
    };
  }, [navigation, props.access_token, props.mode, t]);

  useEffect(() => {
    if (step == 0) {
      fetchData(1, true);
    }
  }, [step, nextPage]);

  const goBackStep = () => {
    if (step == 0) {
      backPage(navigation);
    } else {
      setStep(0);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (props.mode) {
      fetchData(1, true);
    } else {
      setShowOnlineMode(true);
      setErrorMessage(t('ONLINE_MODE'));
      setRefreshing(false);
    }
  }, [props.mode, t]);

  const fetchData = useCallback(
    async (page, reset) => {
      if (offline || step == 1) {
        props.setLoader(false);
        setLoading(false);
        return;
      }
      if (props.mode) {
        if (loading) return;
        setLoading(true);
        try {
          const res = await comnPost('v2/getQueries', {page});
          if (res && res.data.data) {
            if (reset) {
              setData(res.data.data.data);
            } else {
              setData(prevData => [...prevData, ...res.data.data.data]);
            }
            setHasMore(!!res.data.data.next_page_url);
            setNextPage(page + 1);
            await saveToStorage(
              t('STORAGE.QUERIES'),
              JSON.stringify(res.data.data.data),
            );
          }
          setLoading(false);
        } catch (error) {
          setErrorMessage(t('ERROR_OCCURRED'));
          setLoading(false);
        } finally {
          if (isMounted.current) {
            setLoading(false);
            setRefreshing(false);
          }
          props.setLoader(false);
          setLoading(false);
        }
      }
    },
    [props.mode, loading, hasMore, t],
  );

  const loadMoreData = useCallback(() => {
    if (!props.mode) {
      setErrorMessage(t('GET_MORE_DATA'));
      setShowOnlineMode(true);
    } else if (!loading && hasMore) {
      fetchData(nextPage);
    }
  }, [props.mode, loading, hasMore, fetchData, nextPage, t]);

  const renderItem = ({item}) => {
    return (
      <ListItem bottomDivider>
        <ListItem.Content
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            minWidth: DIMENSIONS.halfWidth + 50,
          }}>
          <ListItem.Title>{item.message}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Content
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}>
          {item.status === 'unread' ? (
            <Entypo
              name="check"
              color={COLOR.grey}
              size={DIMENSIONS.iconSize}
            />
          ) : item.status === 'read' ? (
            <Entypo
              name="check"
              color={COLOR.themeComicBlue}
              size={DIMENSIONS.iconSize}
            />
          ) : (
            <Feather
              name="check-circle"
              color={COLOR.yellow}
              size={DIMENSIONS.iconSize}
            />
          )}
        </ListItem.Content>
      </ListItem>
    );
  };

  const renderFooter = () => {
    if (!loading || !hasMore) return null;
    return (
      <View style={{paddingVertical: 20}}>
        <ActivityIndicator size="small" color={COLOR.primary} />
      </View>
    );
  };

  return (
    <>
      <Header
        name={t('HEADER.CONTACT_US')}
        goBack={() => backPage()}
        startIcon={
          <Ionicons
            name="chevron-back-outline"
            size={24}
            onPress={() => backPage(navigation)}
            color={COLOR.black}
          />
        }
        endIcon={
          step === 0 && (
            <TouchableOpacity
              onPress={() => {
                setStep(1);
                setLoading(false);
              }}>
              <GlobalText text={t('BUTTON.ADD_QUERY')} />
            </TouchableOpacity>
          )
        }
      />
      <ScrollView
        style={{flex: 1, marginTop: -19}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Loader />
        <CheckNet isOff={offline} />
        {step === 0 ? (
          data.length > 0 ? (
            <FlatList
              keyExtractor={item => item.id?.toString()}
              data={data}
              renderItem={renderItem}
              onEndReached={loadMoreData}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              style={{marginBottom: 30}}
            />
          ) : (
            <View
              style={{
                height: DIMENSIONS.screenHeight,
                alignItems: 'center',
                padding: 50,
              }}>
              <GlobalText
                style={{fontWeight: 'bold'}}
                text={offline ? t('NO_INTERNET') : ''}
              />
            </View>
          )
        ) : (
          <ContactUs
            route_id={route.params?.route_id}
            step={step}
            setStep={setStep}
            offline={offline}
          />
        )}
        <ComingSoon
          message={errorMessage}
          visible={showOnlineMode}
          toggleOverlay={() => setShowOnlineMode(false)}
        />
      </ScrollView>
    </>
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
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(QueriesList);
