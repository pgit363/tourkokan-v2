import React, {useState, useEffect, useRef} from 'react';
import {View, ScrollView, FlatList, RefreshControl} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {
  comnPost,
  dataSync,
  saveToStorage,
} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {setLoader} from '../../Reducers/CommonActions';
import Loader from '../../Components/Customs/Loader';
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
import ComingSoon from '../../Components/Common/ComingSoon';

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
    props.setLoader(true);
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    setIsLoading(true);

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(false);

      dataSync(
        t('STORAGE.CATEGORIES_RESPONSE'),
        getCategories(),
        props.mode,
      ).then(resp => {
        let res = JSON.parse(resp);
        if (res.data && res.data.data) {
          setCategories(res.data.data.data);
          setSelectedCategory(res.data.data.data[0].name);
          setSelectedSubCategory(res.data.data.data[0].sub_categories);
        } else if (resp) {
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

  const getCategories = () => {
    setIsLoading(true);
    let data = {
      parent_list: '1',
      // parent_id: 1,
      per_page: '2',
    };
    comnPost('v2/listcategories', data, navigation)
      .then(res => {
        if (res && res.data.data)
          saveToStorage(t('STORAGE.CATEGORIES_RESPONSE'), JSON.stringify(res));
        setCategories(res.data.data.data);
        setSelectedCategory(res.data.data.data[0].name);
        setSelectedSubCategory(res.data.data.data[0].sub_categories);
        // setSelectedSubCategory(res.data.data.data[0].sub_categories)
        setIsLoading(false);
        props.setLoader(false);
        setRefreshing(false);
      })
      .catch(error => {
        setIsLoading(false);
        props.setLoader(false);
        setRefreshing(false);
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
    <ScrollView
      style={{flex: 1}}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <Loader />
      <CheckNet isOff={offline} />
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
      <View style={styles.horizontalCategoriesScroll}>
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
            categories.map(category => (
              <ImageButton
                key={category.id}
                icon={'bus'}
                onPress={() => handleCategoryPress(category)}
                isSelected={selectedCategory === category.name}
                image={category.icon}
                imageButtonCircle={styles.categoriesCircleButton}
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
      </View>

      <View style={styles.subCatContainer}>
        <View>
          <GlobalText
            text={t('HEADER.CLASSIFICATIONS')}
            style={styles.subCatHeader}
          />
        </View>
        <View style={styles.subCatView}>
          <View style={styles.verticalNameContainer}>
            <GlobalText text={selectedCategory} style={styles.verticalName} />
          </View>
          <View style={styles.subCatCardsContainer}>
            <FlatList
              keyExtractor={item => item.id}
              data={selectedSubCategory}
              renderItem={renderItem}
              numColumns={2}
            />
          </View>
        </View>
      </View>
      <ComingSoon
        message={t('ONLINE_MODE')}
        visible={showOnlineMode}
        toggleOverlay={() => setShowOnlineMode(false)}
      />
    </ScrollView>
  );
};

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
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

export default connect(mapStateToProps, mapDispatchToProps)(Categories);
