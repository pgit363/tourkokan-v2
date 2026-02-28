import React, {useState, useEffect, useRef} from 'react';
import {View, ScrollView, FlatList, RefreshControl} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {
  comnPost,
  dataSync,
  getFromStorage,
  saveToStorage,
} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {setLoader} from '../../Reducers/CommonActions';
import styles from '../Styles';
import Header from '../../Components/Common/Header';
import {
  backPage,
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import GlobalText from '../../Components/Customs/Text';
import NetInfo from '@react-native-community/netinfo';
import CheckNet from '../../Components/Common/CheckNet';
import ImageButton from '../../Components/Customs/Buttons/ImageButton';
import SubCatCard from '../../Components/Cards/SubCatCard';
import ImageButtonSkeleton from '../../Components/Customs/Buttons/ImageButtonSkeleton';
import {useTranslation} from 'react-i18next';
import Accordion from '../../Components/Customs/Accordian';
import ComingSoon from '../../Components/Common/ComingSoon';
import {SafeAreaView} from 'react-native-safe-area-context';
import Loader from '../../Components/Customs/Loader';

const Categories = ({route, navigation, ...props}) => {
  const {t} = useTranslation();
  const refRBSheet = useRef();

  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [isEnabled, setIsEnabled] = useState(
    route.name == t('SCREEN.CATEGORIES'),
  );
  const [isLandingDataFetched, setIsLandingDataFetched] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [offline, setOffline] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlineMode, setShowOnlineMode] = useState(false);

  useEffect(() => {
    let unsubscribe;
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);

    const init = async () => {
      props.setLoader(true);
      const localData = await getFromStorage(t('STORAGE.CATEGORIES_RESPONSE'));
      if (localData) {
        const cats = JSON.parse(localData);
        setCategories(cats);
        if (cats && cats.length > 0) {
          setSelectedCategory(cats[0].name);
          setSelectedSubCategory(cats[0].sub_categories);
        }
        setIsLoading(false);
        props.setLoader(false);
      } else {
        setIsLoading(true);
      }

      unsubscribe = NetInfo.addEventListener(state => {
        setOffline(!state.isConnected);
        dataSync(
          t('STORAGE.CATEGORIES_RESPONSE'),
          () => getCategories(),
          props.mode,
        ).then((res) => {
          if(res){
             const cats = JSON.parse(res);
             setCategories(cats);
          }
          setIsLoading(false);
          props.setLoader(false);
        });
      });
    };

    init();

    return () => {
      backHandler.remove();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (props.mode) {
      getCategories().then(res => {
        if (res && res.length > 0) {
          setCategories(res);
          saveToStorage(t('STORAGE.CATEGORIES_RESPONSE'), JSON.stringify(res));
        }
        setRefreshing(false);
      });
    } else {
      setShowOnlineMode(true);
      setRefreshing(false);
    }
  };

  const getCategories = () => {
    let data = {
      parent_list: '1',
      per_page: '20',
    };
    return comnPost('v2/listcategories', data, navigation)
      .then(res => {
        if (res && res.data && res.data.data) {
            return res.data.data.data;
        }
        return [];
      })
      .catch(() => {
        return [];
      });
  };

  const handleCategoryPress = category => {
    setSelectedCategory(category.name);
    setSelectedSubCategory(
      categories.find(item => item.name === category.name).sub_categories,
    );
  };

  const renderItem = ({item}) => {
    return <SubCatCard data={item} onClick={() => goToSubCats(item)} />;
  };

  const goToSubCats = subCat => {
    navigateTo(navigation, t('SCREEN.CITY_LIST'), {subCat});
  };

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: COLOR.white}}>
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
      {isLoading && categories.length === 0 ? (
        <View style={{flex: 1, backgroundColor: COLOR.white}}>
          <Loader />
        </View>
      ) : (
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: COLOR.themeComicBlueULight,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
        <CheckNet isOff={offline} />
        {/* <View style={styles.horizontalCategoriesScroll}>
                <ScrollView horizontal style={styles.categoriesButtonScroll}>
                    {isLoading ? (
                        <>
                            <ImageButtonSkeleton />
                            <ImageButtonSkeleton />
                            <ImageButtonSkeleton />
                            <ImageButtonSkeleton />
                            <ImageButtonSkeleton />
                        </>
                    ) : (
                        categories.map((category) => (
                            <ImageButton
                                key={category.id}
                                icon={"bus"}
                                onPress={() => handleCategoryPress(category)}
                                isSelected={selectedCategory === category.name}
                                image={category.icon}
                                imageButtonCircle={
                                    styles.categoriesCircleButton
                                }
                                buttonIcon={styles.catIconStyle}
                                text={
                                    <GlobalText
                                        text={category.name}
                                        style={styles.categoryButtonText}
                                    />
                                }
                            />
                        ))
                    )}
                </ScrollView>
            </View> */}

        <View>
          {/* <View>
                    <GlobalText
                        text={t("HEADER.CLASSIFICATIONS")}
                        style={styles.subCatHeader}
                    />
                </View>
                <View style={styles.subCatView}>
                    <View style={styles.verticalNameContainer}>
                        <GlobalText
                            text={selectedCategory}
                            style={styles.verticalName}
                        />
                    </View>
                    <View style={styles.subCatCardsContainer}>
                        <FlatList
                            keyExtractor={(item) => item.id}
                            data={selectedSubCategory}
                            renderItem={renderItem}
                            numColumns={2}
                        />
                    </View>
                </View> */}
          <Accordion data={categories} navigation={navigation} />
        </View>
        <ComingSoon
          message={t('ONLINE_MODE')}
          visible={showOnlineMode}
          toggleOverlay={() => setShowOnlineMode(false)}
        />
      </ScrollView>
      )}
    </SafeAreaView>
  );
};

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
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Categories);
