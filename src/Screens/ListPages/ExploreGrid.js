/* eslint-disable react-hooks/exhaustive-deps */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { ResponsiveGrid } from 'react-native-flexible-grid';
import ProgressImage from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import ImageViewing from 'react-native-image-viewing';
import styles from './Styles';
import {
  comnPost,
  dataSyncResult,
  saveToStorage,
  getFromStorage,
} from '../../Services/Api/CommonServices';
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
import ExploreGridSkeleton from './ExploreGridSkeleton';
import ComingSoon from '../../Components/Common/ComingSoon';
import Popup from '../../Components/Common/Popup';
import {FTP_PATH} from '@env';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import COLOR from '../../Services/Constants/COLORS';

const { height: screenHeight } = Dimensions.get('window');
const SEARCH_DEBOUNCE_MS = 300;
const cardTitleOverlayStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  padding: 4,
  borderBottomLeftRadius: 5,
  borderBottomRightRadius: 5,
};
const cardTitleTextStyle = {
  color: COLOR.white,
  fontSize: 10,
  textAlign: 'center',
  fontWeight: 'bold',
};
const footerStyle = {paddingVertical: 20};
const safeAreaStyle = {flex: 1, backgroundColor: COLOR.white};
const gridStyle = {padding: 5, marginBottom: 70};
const emptyStateStyle = {
  height: screenHeight,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 10,
};
const offlineTextStyle = {fontWeight: 'bold'};

const GridImageTile = React.memo(({item, onPress}) => {
  const imageUri = FTP_PATH + item.path;
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      style={styles.imageGridBoxContainer}
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
          onError={error =>
            console.warn('Image load error for', imageUri, ':', error)
          }
        />
        {item.galleryable?.name && (
          <View style={cardTitleOverlayStyle}>
            <GlobalText
              text={item.galleryable.name}
              style={cardTitleTextStyle}
              numberOfLines={1}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const ExploreGrid = ({route, navigation, ...props}) => {
  const {t} = useTranslation();
  const [gallery, setGallery] = useState([]);
  const [offline, setOffline] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnlineMode, setShowOnlineMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [alertMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPage, setNextPage] = useState(1);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    setLoading(true);

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(!state.isConnected);
      dataSyncResult(
        t('STORAGE.GALLERY'),
        () => fetchData(1, true, searchQuery),
        props.mode,
      ).then(result => {
        const {data} = result;
        if (typeof data === 'string') {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            setGallery(parsed);
          }
        } else if (Array.isArray(data)) {
          setGallery(data);
        }
        setLoading(false);
      });
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(searchValue.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchValue]);

  useEffect(() => {
    fetchData(1, true, searchQuery);
  }, [searchQuery]);

  useFocusEffect(
    React.useCallback(() => {
      const setValue = async () => {
        const cityName = route?.params?.cityName || '';
        setSearchValue(cityName);
        setSearchQuery(cityName);
      };
      setValue();
    }, [route?.params?.cityName]),
  );

  const fetchData = async (page, reset = false, query = searchQuery) => {
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
        search: query,
        per_page: 20,
        page: page,
      };
      comnPost('v2/getGallery', data)
        .then(res => {
          if (res.data.success) {
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
        .catch(() => {
          setLoading(false);
          setRefreshing(false);
        });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSearchValue('');
    setSearchQuery('');
    if (props.mode) {
      fetchData(1, true, '');
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
    }
  };

  const handleSearch = value => {
    setSearchValue(value);
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

  const onTilePress = useCallback(image => {
    openImageViewer(image);
  }, []);

  const renderItem = useCallback(
    ({item}) => <GridImageTile item={item} onPress={onTilePress} />,
    [onTilePress],
  );

  const renderFooter = () => {
    if (!loading || !hasMore) {
      return null;
    }
    return (
      <View style={footerStyle}>
        <ActivityIndicator size="small" color={COLOR.primary} />
      </View>
    );
  };

  const imageIndex = gallery.findIndex(img => img.id === selectedImage?.id);
  const imageViewerImages = useMemo(
    () => gallery.map(image => ({uri: FTP_PATH + image.path})),
    [gallery],
  );

  return (
    <SafeAreaView edges={['top']} style={safeAreaStyle}>
      {/* <ScrollView
        style={{ flex: 1 }}
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
              style={gridStyle}
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
                style={{ fontWeight: 'bold' }}
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
      </ScrollView> */}
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
        {loading && !gallery.length ? (
          <ExploreGridSkeleton />
        ) : gallery.length ? (
          <ResponsiveGrid
            maxItemsPerColumn={3}
            data={gallery}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            showScrollIndicator={false}
              style={gridStyle}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.5}
          />
          ) : (
            <View style={emptyStateStyle}>
              {offline ? (
                <GlobalText style={offlineTextStyle} text={t('NO_INTERNET')} />
              ) : (
                <ExploreGridSkeleton />
              )}
            </View>
          )}

        {selectedImage && (
          <ImageViewing
            images={imageViewerImages}
            imageIndex={imageIndex}
            visible={isModalVisible}
            onRequestClose={closeImageViewer}
          />
        )}
        <CheckNet isOff={offline} />
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
      </>

    </SafeAreaView>
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
