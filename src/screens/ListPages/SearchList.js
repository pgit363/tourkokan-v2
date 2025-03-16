import React, {useEffect, useState} from 'react';
import {FlatList, View, SafeAreaView} from 'react-native';
import Header from '../../Components/Common/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {connect} from 'react-redux';
import {
  comnPost,
  dataSync,
  saveToStorage,
} from '../../Services/Api/CommonServices';
import {setLoader} from '../../Reducers/CommonActions';
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
import {useTranslation} from 'react-i18next';

const SearchList = ({navigation, route, ...props}) => {
  const {t} = useTranslation();

  const [list, setList] = useState([]);
  const [offline, setOffline] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [nextUrl, setNextUrl] = useState(1);

  useEffect(() => {
    props.setLoader(true);
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    // searchRoute();

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(false);

      dataSync(t('STORAGE.ROUTES_RESPONSE'), searchRoute(), props.mode).then(
        resp => {
          let res = JSON.parse(resp);
          if (res.data && res.data.data) {
            setList(res.data.data.data);
          } else if (resp) {
            setOffline(true);
          }
          props.setLoader(false);
        },
      );
      // removeFromStorage(t("STORAGE.LANDING_RESPONSE"))
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, []);

  const getRoutesList = item => {
    navigateTo(navigation, t('SCREEN.ROUTES_LIST'), {item});
  };

  const searchRoute = (a, b) => {
    if (nextUrl && nextPage >= 1) {
      props.setLoader(true);
      const data = {
        source_place_id: route.params?.source?.id,
        destination_place_id: route.params?.destination?.id,
      };
      comnPost(`v2/routes?page=${nextPage}`, data)
        .then(res => {
          if (res.data.success) {
            if (res && res.data.data)
              saveToStorage(t('STORAGE.ROUTES_RESPONSE'), JSON.stringify(res));
            let myNextUrl = res.data.data.next_page_url;
            setNextUrl(myNextUrl);
            setList([...list, ...res.data.data.data]);
            setNextPage(myNextUrl[myNextUrl.length - 1]);
            props.setLoader(false);
          } else {
            props.setLoader(false);
          }
        })
        .catch(err => {
          props.setLoader(false);
        });
    }
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
    <View>
      <CheckNet isOff={offline} />
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
      <Loader />
      <View style={{alignItems: 'center'}}>
        {/* <SearchPanel navigation={navigation} from={t("SCREEN.SEARCH_LIST")} onSwap={(a, b) => searchRoute(a, b)} /> */}
      </View>
      <SafeAreaView style={{paddingBottom: 150}}>
        {list.length > 0 ? (
          <FlatList
            keyExtractor={item => item.id}
            data={list}
            onEndReached={searchRoute}
            onEndReachedThreshold={0.25}
            renderItem={({item}) => (
              <RouteHeadCard
                data={item}
                cardClick={() => getRoutesList(item)}
                style={styles.routeHeadCard}
              />
            )}
          />
        ) : (
          <GlobalText text={t('NO_ROUTES')} />
        )}
      </SafeAreaView>
    </View>
  );
};

const mapStateToProps = state => {
  return {
    source: state.commonState.source,
    destination: state.commonState.destination,
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

export default connect(mapStateToProps, mapDispatchToProps)(SearchList);
