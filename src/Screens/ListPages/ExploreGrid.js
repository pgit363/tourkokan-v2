import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  TextInput,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import ImageViewing from 'react-native-image-viewing';
import ProgressImage from 'react-native-image-progress';
import * as Progress from 'react-native-progress';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import STRING from '../../Services/Constants/STRINGS';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AWS_URL} from '@env';

import {
  comnPost,
  dataSync,
  saveToStorage,
  getFromStorage,
} from '../../Services/Api/CommonServices';
import {setDestination, setLoader, setSource} from '../../Reducers/CommonActions';
import {checkLogin, goBackHandler} from '../../Services/CommonMethods';
import Popup from '../../Components/Common/Popup';
import {useConnectivityGate} from '../../Components/Common/useConnectivityGate';
import {useGuestGate, isGuestUser} from '../../Components/Common/GuestGateModal';
import {createLogger} from '../../Services/Logger';

const log = createLogger('ExploreGrid');

// ─── Constants ────────────────────────────────────────────────────────────────

const NUM_COLS = 3;
const CELL_GAP = 8;
const H_PAD = 20;

const {width: SW} = Dimensions.get('window');
const CELL_SIZE = Math.floor((SW - H_PAD * 2 - CELL_GAP * (NUM_COLS - 1)) / NUM_COLS);

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanFoam: '#B8E4EA',
  forestDeep: '#1A3320',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textLight: '#78716C',
  textMid: '#44403C',
  textDark: '#1C1917',
  sandMid: '#C4972A',
};

// ─── Shimmer hook ─────────────────────────────────────────────────────────────

const useShimmer = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {toValue: 1, duration: 900, useNativeDriver: true}),
        Animated.timing(anim, {toValue: 0, duration: 900, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim.interpolate({inputRange: [0, 1], outputRange: [0.3, 0.8]});
};

// ─── Skeleton grid ────────────────────────────────────────────────────────────

const SkeletonGrid = () => {
  const opacity = useShimmer();
  return (
    <Animated.View style={[sk.grid, {opacity}]}>
      {Array.from({length: 30}).map((_, i) => (
        <View key={i} style={sk.cell} />
      ))}
    </Animated.View>
  );
};

const sk = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: H_PAD - CELL_GAP / 2,
    marginTop: 4,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: CELL_GAP / 2,
    borderRadius: 12,
    backgroundColor: '#C8D0D8',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ExploreGrid = ({route, navigation, ...props}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {show: showGuestPopup, modal: guestModal} = useGuestGate(navigation);
  const {modal: connectivityModal, ensureOnline} = useConnectivityGate();
  const [gallery, setGallery] = useState([]);
  const [offline, setOffline] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPage, setNextPage] = useState(2);
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage] = useState('');

  // ── Init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    checkLogin(navigation);
    const backHandler = goBackHandler(navigation);

    // Fetch only on the first connected event or a genuine offline→online
    // reconnect — NetInfo fires on every detail change (same bug class as the
    // HomeScreen 3× landing-call).
    let wasConnected = null;
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!state.isConnected;
      setOffline(!connected);
      const changed = wasConnected !== connected;
      wasConnected = connected;
      if (!connected) {
        props.setLoader(false);
        setLoading(false);
        return;
      }
      if (!changed) return;

      dataSync(t('STORAGE.GALLERY'), () => fetchData(1, true), props.mode).then(resp => {
        if (resp && typeof resp === 'string') {
          try {
            setGallery(JSON.parse(resp));
          } catch (e) { log.warn("[caught]", e); }
        }
        props.setLoader(false);
        setLoading(false);
      });
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSearchValue(route?.params?.cityName || '');
    }, [route?.params?.cityName]),
  );

  useEffect(() => {
    fetchData(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchData = async (page, reset = false) => {
    const mode = JSON.parse(await getFromStorage(STRING.STORAGE.MODE));
    if (!mode) return;
    if (loading && !reset) return;

    setLoading(true);
    comnPost('v2/getGallery', {
      apitype: 'list',
      global: 1,
      search: searchValue,
      per_page: 20,
      page,
    })
      .then(res => {
        if (res?.data?.success) {
          const newGallery = res?.data?.data?.data;
          if (reset) {
            setGallery(newGallery);
            saveToStorage(t('STORAGE.GALLERY'), JSON.stringify(newGallery));
          } else {
            setGallery(prev => [...prev, ...newGallery]);
          }
          setHasMore(!!res?.data?.data?.next_page_url);
          setNextPage(page + 1);
        }
      })
      .catch(() => {})
      .finally(() => {
        props.setLoader(false);
        setLoading(false);
        setRefreshing(false);
      });
  };

  const onRefresh = () => {
    setRefreshing(true);
    setSearchValue('');
    fetchData(1, true);
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      if (nextPage >= 3 && (await isGuestUser())) {
        showGuestPopup('Login to explore more gallery photos beyond page 2.');
        return;
      }
      // Offline mode → prompt to go online before paginating.
      ensureOnline(() => fetchData(nextPage));
    }
  };

  // ── Image viewer ─────────────────────────────────────────────────────────

  const openViewer = idx => {
    setSelectedImageIdx(idx);
    setIsModalVisible(true);
  };

  // ── Render cell ──────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({item, index}) => {
      const uri = AWS_URL + item.path;
      const label = item.galleryable?.name || '';
      return (
        <TouchableOpacity
          style={s.cell}
          onPress={() => openViewer(index)}
          activeOpacity={0.82}>
          <ProgressImage
            source={{uri}}
            style={s.cellImage}
            indicator={Progress.Circle}
            indicatorProps={{
              size: 22,
              borderWidth: 0,
              color: C.oceanFoam,
              unfilledColor: 'rgba(255,255,255,0.2)',
            }}
            resizeMode="cover"
          />
          {!!label && (
            <View style={s.cellOverlay} pointerEvents="none">
              <Text style={s.cellLabel} numberOfLines={1}>
                {label}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return loading ? (
      <View style={s.footerLoader}>
        <View style={sk.cell} />
      </View>
    ) : null;
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 12}]}>

        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>

        <View style={s.headerContent}>
          <Text style={s.headerTitle}>{t('GALLERY_SCREEN.TITLE')}</Text>
          <Text style={s.headerSubtitle}>{t('GALLERY_SCREEN.SUBTITLE')}</Text>
          {gallery.length > 0 && (
            <Text style={s.headerCount}>
              {gallery.length} {t('GALLERY_SCREEN.PHOTO_COUNT')}
            </Text>
          )}
        </View>

        {/* Curved bottom */}
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {/* ── Search bar — floats over header curve ── */}
      <View style={s.searchOuter}>
        {offline && (
          <View style={s.offlineBadge}>
            <Text style={s.offlineBadgeText}>{t('GALLERY_SCREEN.OFFLINE_MSG')}</Text>
          </View>
        )}
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={searchValue}
            onChangeText={v => setSearchValue(v)}
            placeholder={t('GALLERY_SCREEN.SEARCH_PLACEHOLDER')}
            placeholderTextColor={C.textLight}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {searchValue.length > 0 && Platform.OS === 'android' && (
            <TouchableOpacity
              onPress={() => setSearchValue('')}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="close-circle" size={18} color={C.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Grid ── */}
      {loading && gallery.length === 0 ? (
        <SkeletonGrid />
      ) : gallery.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>🏞</Text>
          <Text style={s.emptyText}>{t('GALLERY_SCREEN.EMPTY_TITLE')}</Text>
          <Text style={s.emptySubText}>{t('GALLERY_SCREEN.EMPTY_SUB')}</Text>
        </View>
      ) : (
        <FlatList
          data={gallery}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={NUM_COLS}
          contentContainerStyle={[
            s.gridContent,
            {paddingBottom: insets.bottom + 110},
          ]}
          columnWrapperStyle={s.gridRow}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.oceanMid}
              colors={[C.oceanMid]}
            />
          }
        />
      )}

      {/* ── Fullscreen viewer ── */}
      <ImageViewing
        images={gallery.map(img => ({uri: AWS_URL + img.path}))}
        imageIndex={selectedImageIdx}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
      />

      <Popup message={alertMessage} onPress={() => setIsAlert(false)} visible={isAlert} />
      {guestModal}
      {connectivityModal}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },

  // Header
  header: {
    paddingHorizontal: H_PAD,
    paddingBottom: 40,
    position: 'relative',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: C.white,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.oceanFoam,
    opacity: 0.9,
    marginBottom: 6,
  },
  headerCount: {
    fontSize: 11,
    fontWeight: '600',
    color: C.oceanFoam,
    opacity: 0.7,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: C.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // Search
  searchOuter: {
    marginTop: -20,
    marginHorizontal: H_PAD,
    zIndex: 10,
    marginBottom: 14,
  },
  offlineBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.white,
    textAlign: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  searchIcon: {fontSize: 15, marginRight: 8},
  searchInput: {flex: 1, fontSize: 14, color: C.textDark},

  // Grid
  gridContent: {
    paddingHorizontal: H_PAD - CELL_GAP / 2,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: H_PAD - CELL_GAP / 2,
    marginBottom: 8,
  },

  // Cell
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: CELL_GAP / 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#D1D5DB',
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  cellOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.white,
    textAlign: 'center',
  },

  // Empty
  emptyState: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyIcon: {fontSize: 48, marginBottom: 14},
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: C.textDark,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: C.textLight,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

// ─── Redux ────────────────────────────────────────────────────────────────────

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
