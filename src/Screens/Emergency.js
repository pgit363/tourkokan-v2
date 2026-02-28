/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState, useRef} from 'react';
import {
  FlatList,
  View,
  Linking,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import {ListItem} from '@rneui/themed';
import Header from '../Components/Common/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import COLOR from '../Services/Constants/COLORS';
import {backPage, checkLogin, goBackHandler} from '../Services/CommonMethods';
import TextButton from '../Components/Customs/Buttons/TextButton';
import styles from './Styles';
import {
  comnPost,
  dataSyncResult,
  saveToStorage,
} from '../Services/Api/CommonServices';
import Loader from '../Components/Customs/Loader';
import {setLoader} from '../Reducers/CommonActions';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import CheckNet from '../Components/Common/CheckNet';
import NetInfo from '@react-native-community/netinfo';
import DIMENSIONS from '../Services/Constants/DIMENSIONS';
import GlobalText from '../Components/Customs/Text';
import ComingSoon from '../Components/Common/ComingSoon';
import {SafeAreaView} from 'react-native-safe-area-context';

const Emergency = ({navigation, route, ...props}) => {
  const {t} = useTranslation();
  const isMounted = useRef(true);

  const [data, setData] = useState([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // New state to track if there's more data
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlineMode, setShowOnlineMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    props.setLoader(true);

    // Function to check if data exists in storage
    const checkStoredData = async () => {
      try {
        const syncResult = await dataSyncResult(
          t('STORAGE.EMERGENCY'),
          null,
          props.mode,
        );
        const storedData = syncResult.data;
        if (storedData) {
          setData(JSON.parse(storedData));
          props.setLoader(false);
        } else {
          fetchData(1, true);
        }
      } catch (error) {
        console.error('Error checking stored data:', error);
        fetchData(1, true);
      }
    };

    if (props.access_token) {
      checkStoredData();
    }

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(!state.isConnected);
      if (state.isConnected) {
        checkStoredData();
      } else {
        checkStoredData();

        props.setLoader(false);
      }
    });

    return () => {
      backHandler.remove();
      unsubscribe();
      isMounted.current = false;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (props.mode) {
      fetchData(1, true);
    } else {
      setErrorMessage(t('ONLINE_MODE'));
      setShowOnlineMode(true);
      setRefreshing(false);
    }
  };

  const fetchData = (page, reset = false) => {
    if (offline) {
      return;
    }
    if (props.mode) {
      if (loading || !hasMore) {
        setRefreshing(false);
        return;
      }

      setLoading(true);
      let requestData = {
        apitype: 'list',
        category: 'emergency',
        page: page,
      };
      comnPost('v2/sites', requestData)
        .then(res => {
          if (res && res.data.data) {
            if (reset) {
              setData(res.data.data.data);
            } else {
              setData(prevData => [...prevData, ...res.data.data.data]);
            }
            setHasMore(!!res.data.data.next_page_url); // Check if there's more data
            setNextPage(page + 1);
            saveToStorage(
              t('STORAGE.EMERGENCY'),
              JSON.stringify(res.data.data.data),
            );
            props.setLoader(false);
          }
          if (isMounted.current) {
            setLoading(false);
          }
          setRefreshing(false);
          props.setLoader(false);
        })
        .catch(error => {
          if (isMounted.current) {
            setLoading(false);
            setRefreshing(false);
            props.setLoader(false);
          }
        });
    } else {
      props.setLoader(false);
    }
  };

  const loadMoreData = () => {
    if (!props.mode) {
      setErrorMessage(t('GET_MORE_DATA'));
      setShowOnlineMode(true);
    } else if (!loading && hasMore) {
      fetchData(nextPage);
    }
  };

  const makeContact = (address, apptype) => {
    const value = address[0][apptype];
    if (value && typeof value === 'string') {
      const prefix = apptype === 'phone' ? 'tel' : 'mailto';
      Linking.openURL(`${prefix}:${value}`);
    }
  };

  const renderItem = ({item}) => {
    return (
      <ListItem bottomDivider>
        <ListItem.Content>
          <View style={localStyles.row}>
            <ListItem.Title>{item.name}</ListItem.Title>
            <View style={localStyles.actionsRow}>
              <TextButton
                title=""
                onPress={() => makeContact(item.address, 'phone')}
                buttonView={styles.callButton}
                endIcon={
                  <Feather name="phone-call" size={24} color={COLOR.themeBlue} />
                }
              />
              <TextButton
                title=""
                onPress={() => makeContact(item.address, 'email')}
                buttonView={styles.callButton}
                endIcon={
                  <MaterialIcons name="email" size={24} color={COLOR.themeBlue} />
                }
              />
            </View>
          </View>
        </ListItem.Content>
      </ListItem>
    );
  };

  const renderFooter = () => {
    if (!loading || !hasMore) {
      return null;
    }
    return (
      <View style={localStyles.footer}>
        <ActivityIndicator size="small" color={COLOR.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={localStyles.container}>
      <Header
        name={t('HEADER.EMERGENCY')}
        goBack={() => backPage(navigation)}
        startIcon={
          <Ionicons
            name="chevron-back-outline"
            size={24}
            onPress={() => backPage(navigation)}
            color={COLOR.black}
          />
        }
        endIcon={<></>}
      />
      <FlatList
        keyExtractor={item => item.id?.toString()}
        data={data}
        renderItem={renderItem}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={
          <>
            <Loader />
            <CheckNet isOff={offline} />
          </>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={localStyles.emptyWrap}>
            <GlobalText
              style={localStyles.emptyText}
              text={offline ? t('NO_INTERNET') : t('NO_DATA_AVAILABLE')}
            />
          </View>
        }
        style={localStyles.list}
      />
      <ComingSoon
        message={errorMessage}
        visible={showOnlineMode}
        toggleOverlay={() => setShowOnlineMode(false)}
      />
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
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
  list: {
    flex: 1,
    marginTop: -19,
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
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Emergency);
