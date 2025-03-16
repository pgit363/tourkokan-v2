import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Text,
} from 'react-native';
import {ResponsiveGrid} from 'react-native-flexible-grid';
import ProgressImage from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import ImageViewing from 'react-native-image-viewing';
import styles from './Styles';
import Path from '../../Services/Api/BaseUrl';
import {
  comnPost,
  dataSync,
  saveToStorage,
  getFromStorage,
} from '../../Services/Api/CommonServices';
import Loader from '../../Components/Customs/Loader';
import {checkLogin, goBackHandler} from '../../Services/CommonMethods';
import CheckNet from '../../Components/Common/CheckNet';
import NetInfo from '@react-native-community/netinfo';
import {connect} from 'react-redux';
import {
  setDestination,
  setLoader,
  setSource,
} from '../../Reducers/CommonActions';
import Header from '../../Components/Common/Header';
import Search from '../../Components/Customs/Search';
import {useTranslation} from 'react-i18next';
import GlobalText from '../../Components/Customs/Text';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import ExploreGridSkeleton from './ExploreGridSkeleton';
import ComingSoon from '../../Components/Common/ComingSoon';
import Popup from '../../Components/Common/Popup';
import {FTP_PATH} from '@env';
import {useFocusEffect} from '@react-navigation/native';

const {height: screenHeight} = Dimensions.get('window');

const ExploreGrid = ({route, navigation, ...props}) => {
  const {t} = useTranslation();
  const [gallery, setGallery] = useState([]);
  const [offline, setOffline] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlineMode, setShowOnlineMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPage, setNextPage] = useState(1);

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    setLoading(true);

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(!state.isConnected);
      dataSync(t('STORAGE.GALLERY'), fetchData(1, true), props.mode).then(
        resp => {
          if (resp) {
            let res = JSON.parse(resp);
            const newGallery = res;
            setGallery(newGallery);
          }
          props.setLoader(false);
          setLoading(false);
        },
      );
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchData(1, true);
  }, [searchValue]);

  useFocusEffect(
    React.useCallback(async () => {
      setSearchValue(route.params.cityName || '');
    }, [route?.params?.cityName]),
  );

  const fetchData = async (page, reset = false) => {
    const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));

    if (mode) {
      if (loading) {
        setRefreshing(false);
        return;
      }

      setLoading(true);
      const data = {
        apitype: 'list',
        global: 1,
        search: searchValue,
        per_page: 20,
        page: page,
      };
      comnPost(`v2/getGallery`, data)
        .then(res => {
          if (res.data.success) {
            props.setLoader(false);
            const newGallery = res.data.data.data;
            if (reset) {
              setGallery(newGallery);
              saveToStorage(t('STORAGE.GALLERY'), JSON.stringify(newGallery));
            } else {
              setGallery(prevGallery => [...prevGallery, ...newGallery]);
            }
            setHasMore(!!res.data.data.next_page_url); // Check if there's more data
            setNextPage(page + 1);
          }
          setLoading(false);
          setRefreshing(false);
        })
        .catch(err => {
          props.setLoader(false);
          setLoading(false);
          setRefreshing(false);
        });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSearchValue('');
    if (props.mode) {
      fetchData(1, true);
    } else {
      setShowOnlineMode(true);
      setRefreshing(false);
    }
  };

  const loadMoreData = () => {
    if (!props.mode) {
      setErrorMessage(t('GET_MORE_DATA'));
      setShowOnlineMode(true);
    } else if (!loading && hasMore) {
      fetchData(nextPage);
      setSearchValue('');
    }
  };

  const handleSearch = value => {
    setSearchValue(value);
    setCurrentPage(1);
    setLastPage(1);
    fetchData(1, true);
  };

  const openImageViewer = image => {
    setSelectedImage(image);
    setIsModalVisible(true);
  };

  const closeImageViewer = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
  };

  const closePopup = () => {
    setIsAlert(false);
  };

  const renderItem = ({item}) => {
    const imageUri = FTP_PATH + item.path;
    return (
      <TouchableOpacity
        onPress={() => openImageViewer(item)}
        style={styles.imageGridBoxContainer} // Ensure touchable covers full area
        activeOpacity={0.7}>
        <View>
          <ProgressImage
            source={{uri: imageUri}}
            style={styles.imageGridBox}
            indicator={Progress.Circle}
            indicatorProps={{
              size: 30,
              borderWidth: 0,
              color: 'rgba(150, 150, 150, 1)',
              unfilledColor: 'rgba(200, 200, 200, 0.2)',
            }}
            resizeMode="cover"
            onError={error => console.error('Image load error:', error)}
          />
        </View>
      </TouchableOpacity>
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

  const imageIndex = gallery.findIndex(img => img.id === selectedImage?.id);

  return (
    <>
      <Header
        Component={
          <Search
            style={styles.homeSearchBar}
            placeholder={t('Search')}
            value={searchValue}
            onChangeText={handleSearch}
          />
        }
      />
      <ScrollView
        style={{flex: 1}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={loadMoreData}
        scrollEventThrottle={16}>
        <CheckNet isOff={offline} />
        {loading && !gallery.length ? (
          <ExploreGridSkeleton />
        ) : gallery.length ? (
          <ResponsiveGrid
            maxItemsPerColumn={3}
            data={gallery}
            renderItem={renderItem}
            showScrollIndicator={false}
            style={{padding: 5, marginBottom: 70}}
            keyExtractor={item => item.id.toString()}
            ListFooterComponent={renderFooter}
          />
        ) : (
          <View
            style={{
              height: screenHeight,
              justifyContent: 'center', // Vertically center content
              alignItems: 'center', // Horizontally center content
              padding: 10,
            }}>
            {offline ? (
              <GlobalText
                style={{fontWeight: 'bold'}}
                text={t('NO_INTERNET')}
              />
            ) : (
              <ExploreGridSkeleton />
            )}
          </View>
        )}
        {selectedImage && (
          <ImageViewing
            images={gallery.map(image => ({
              uri: FTP_PATH + image.path,
            }))}
            imageIndex={imageIndex}
            visible={isModalVisible}
            onRequestClose={closeImageViewer}
          />
        )}
        <ComingSoon
          message={t('ONLINE_MODE')}
          visible={showOnlineMode}
          toggleOverlay={() => setShowOnlineMode(false)}
        />
        <ComingSoon
          message={errorMessage}
          visible={showOnlineMode}
          toggleOverlay={() => setShowOnlineMode(false)}
        />
        <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />
      </ScrollView>
    </>
  );
};

const mapStateToProps = state => ({
  source: state.commonState.source,
  mode: state.commonState.mode,
  isLoading: state.commonState.isLoading,
});

const mapDispatchToProps = dispatch => ({
  setSource: data => dispatch(setSource(data)),
  setDestination: data => dispatch(setDestination(data)),
  setLoader: data => dispatch(setLoader(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ExploreGrid);
