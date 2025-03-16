import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  FlatList,
  View,
  Linking,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
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
  dataSync,
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
        const storedData = await dataSync(
          t('STORAGE.EMERGENCY'),
          null,
          props.mode,
        );
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
      let data = {
        apitype: 'list',
        category: 'emergency',
        page: page,
      };
      comnPost('v2/sites', data)
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
    } else props.setLoader(false);
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
        <ListItem.Content style={{flexDirection: 'row', alignItems: 'center'}}>
          <ListItem.Title>{item.name}</ListItem.Title>
          <ListItem.Content
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
            }}>
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
          </ListItem.Content>
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
      <ScrollView
        style={{flex: 1, marginTop: -19}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Loader />
        <CheckNet isOff={offline} />
        {data[0] ? (
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

export default connect(mapStateToProps, mapDispatchToProps)(Emergency);
