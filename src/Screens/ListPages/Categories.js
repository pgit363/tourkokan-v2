/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef} from 'react';
import {View, ScrollView, RefreshControl} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {dataSyncResult, getFromStorage} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {setLoader} from '../../Reducers/CommonActions';
import Loader from '../../Components/Customs/Loader';
import styles from '../Styles';
import Header from '../../Components/Common/Header';
import {backPage, checkLogin, goBackHandler} from '../../Services/CommonMethods';
import NetInfo from '@react-native-community/netinfo';
import CheckNet from '../../Components/Common/CheckNet';
import {useTranslation} from 'react-i18next';
import Accordion from '../../Components/Customs/Accordian';
import ComingSoon from '../../Components/Common/ComingSoon';
import {SafeAreaView} from 'react-native-safe-area-context';

const safeAreaStyle = {flex: 1, backgroundColor: COLOR.white};
const scrollContainerStyle = {
  flex: 1,
  backgroundColor: COLOR.themeComicBlueULight,
  marginTop: -20,
};

const Categories = ({route, navigation, ...props}) => {
  const {t} = useTranslation();
  useRef();

  const [categories, setCategories] = useState([]);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlineMode, setShowOnlineMode] = useState(false);

  useEffect(() => {
    props.setLoader(true);
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);

    const unsubscribe = NetInfo.addEventListener(() => {
      setOffline(false);
      dataSyncResult(
        t('STORAGE.CATEGORIES_RESPONSE'),
        getCategories,
        props.mode,
      ).then(result => {
        let resp = result.data;
        if (typeof resp === 'string') {
          resp = JSON.parse(resp);
        }
        if (resp) {
          setCategories(resp);
        } else {
          setOffline(true);
        }
        props.setLoader(false);
      });
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (props.mode) {
      getCategories();
    } else {
      setShowOnlineMode(true);
      setRefreshing(false);
    }
  };

  const getCategories = async () => {
    const cat = await getFromStorage(t('STORAGE.CATEGORIES_RESPONSE'));
    const cats = JSON.parse(cat);
    setCategories(cats);
    props.setLoader(false);
    setRefreshing(false);
    return cats;
  };

  return (
    <SafeAreaView edges={['top']} style={safeAreaStyle}>
      <Header
        name={t('SCREEN.CATEGORIES')}
        startIcon={
          <Ionicons
            name="chevron-back-outline"
            color={COLOR.black}
            size={DIMENSIONS.userIconSize}
            onPress={() => backPage(navigation)}
          />
        }
      />
      <ScrollView
        style={scrollContainerStyle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Loader />
        <CheckNet isOff={offline} />
        <View style={styles.subCatContainer}>
          <Accordion data={categories} navigation={navigation} />
        </View>
        <ComingSoon
          message={t('ONLINE_MODE')}
          visible={showOnlineMode}
          toggleOverlay={() => setShowOnlineMode(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  mode: state.commonState.mode,
});

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoader(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Categories);
