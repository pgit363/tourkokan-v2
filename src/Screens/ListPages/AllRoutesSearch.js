import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {
  comnPost,
  getFromStorage,
  saveToStorage,
} from '../../Services/Api/CommonServices';
import {setLoader, setMode} from '../../Reducers/CommonActions';
import {useGuestGate, isGuestUser} from '../../Components/Common/GuestGateModal';
import {
  backPage,
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import Banner from '../../Components/Customs/Banner';

// ─── Constants ────────────────────────────────────────────────────────────────

const {width: SW} = Dimensions.get('window');
const BANNER_H = Math.round(SW / 3);

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  forestDeep: '#1A3320',
  sandMid: '#C4972A',
  sandPale: '#FBF3DC',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  offlineBg: '#FEF3CD',
  offlineBorder: '#F59E0B',
  offlineText: '#92400E',
};

const RECENT_KEY = 'recent_routes';
const MAX_RECENT = 5;

// ─── Bus image map (static requires for Metro bundler) ────────────────────────

const BUS_IMAGES = {
  shivshahi: require('../../Assets/Images/Buses/Shivshahi.png'),
  hirkaniSemi: require('../../Assets/Images/Buses/Hirkani Semi Luxury.png'),
  hirkani: require('../../Assets/Images/Buses/Hirkani.png'),
  volvo: require('../../Assets/Images/Buses/Volvo Ac.png'),
  shivnery: require('../../Assets/Images/Buses/AC-Shivnery.png'),
  ashwamedh: require('../../Assets/Images/Buses/AC-Ashwamedh.png'),
  sheetal: require('../../Assets/Images/Buses/AC-Sheetal.png'),
  nightExpress: require('../../Assets/Images/Buses/Night Express.png'),
  dayOrdinary: require('../../Assets/Images/Buses/Day Ordinary.png'),
  default: require('../../Assets/Images/Buses/OrdinaryExpress.png'),
};

const getBusImage = (typeName = '') => {
  const n = typeName.toLowerCase();
  if (n.includes('shivshahi')) return BUS_IMAGES.shivshahi;
  if (n.includes('semi luxury') || n.includes('hirkani semi'))
    return BUS_IMAGES.hirkaniSemi;
  if (n.includes('hirkani')) return BUS_IMAGES.hirkani;
  if (n.includes('volvo')) return BUS_IMAGES.volvo;
  if (n.includes('shivnery')) return BUS_IMAGES.shivnery;
  if (n.includes('ashwamedh')) return BUS_IMAGES.ashwamedh;
  if (n.includes('sheetal')) return BUS_IMAGES.sheetal;
  if (n.includes('night')) return BUS_IMAGES.nightExpress;
  if (n.includes('day ordinary') || (n.includes('day') && n.includes('ordinary')))
    return BUS_IMAGES.dayOrdinary;
  return BUS_IMAGES.default;
};

const getBadgeColor = (metaData = '') => {
  try {
    const parsed = JSON.parse(metaData);
    return parsed?.[0]?.color_code || C.oceanMid;
  } catch {
    return C.oceanMid;
  }
};

// ─── Shimmer hook ─────────────────────────────────────────────────────────────

const useShimmer = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {toValue: 1, duration: 800, useNativeDriver: true}),
        Animated.timing(anim, {toValue: 0, duration: 800, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim.interpolate({inputRange: [0, 1], outputRange: [0.35, 0.82]});
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = ({opacity}) => (
  <Animated.View style={[sk.card, {opacity}]}>
    {/* Type bar skeleton */}
    <View style={sk.typeBar} />
    {/* Body */}
    <View style={sk.body}>
      <View style={sk.headerRow}>
        <View style={sk.icon} />
        <View style={sk.titleBlock}>
          <View style={sk.titleLine} />
          <View style={sk.titleLineSm} />
        </View>
      </View>
      <View style={sk.divider} />
      <View style={sk.statsRow}>
        <View style={sk.statBlock} />
        <View style={sk.statBlock} />
        <View style={sk.statBlock} />
      </View>
    </View>
  </Animated.View>
);

const SkeletonList = () => {
  const opacity = useShimmer();
  return (
    <>
      {Array.from({length: 5}).map((_, i) => (
        <SkeletonCard key={i} opacity={opacity} />
      ))}
    </>
  );
};

const sk = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  typeBar: {height: 34, backgroundColor: '#E5E7EB'},
  body: {padding: 16},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12},
  icon: {width: 82, height: 82, borderRadius: 8, backgroundColor: '#F3F4F6'},
  titleBlock: {flex: 1, gap: 8},
  titleLine: {height: 16, width: '75%', backgroundColor: '#E5E7EB', borderRadius: 7},
  titleLineSm: {height: 14, width: '55%', backgroundColor: '#F3F4F6', borderRadius: 7},
  divider: {height: 1, backgroundColor: '#F3F4F6', marginBottom: 12},
  statsRow: {flexDirection: 'row', gap: 8},
  statBlock: {flex: 1, height: 40, backgroundColor: '#F3F4F6', borderRadius: 10},
});

// ─── Route Card ───────────────────────────────────────────────────────────────

const RouteCard = ({item, onPress, t}) => {
  const busImage = getBusImage(item?.bus_type?.type || '');
  const badgeColor = getBadgeColor(item?.bus_type?.meta_data || '');
  const routeName = `${item?.source_place?.name || ''} → ${item?.destination_place?.name || ''}`;
  const stopsCount = item?.route_stops?.length ?? 0;
  const distance = item?.distance != null ? `${parseFloat(item.distance).toFixed(1)} km` : '—';
  const departure = item?.start_time || '—';
  const busType = item?.bus_type?.type || '';

  return (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      activeOpacity={0.75}>

      {/* ── Colored type bar at top (mirrors old RouteHeadCard bottom bar) ── */}
      <View style={[s.cardTypeBar, {backgroundColor: badgeColor}]}>
        <Text style={s.cardTypeBarText}>{busType}</Text>
      </View>

      {/* ── Card body ── */}
      <View style={s.cardBody}>
        {/* Bus icon + route name */}
        <View style={s.cardHeader}>
          <View style={s.busIconWrap}>
            <View style={s.busIconBg} />
            <Image source={busImage} style={s.busIcon} resizeMode="contain" />
          </View>
          <Text style={s.cardRouteName} numberOfLines={2}>{routeName}</Text>
        </View>

        {/* Divider */}
        <View style={s.cardDivider} />

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{distance}</Text>
            <Text style={s.statLabel}>{t('ALL_ROUTES_SCREEN.DISTANCE')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{stopsCount}</Text>
            <Text style={s.statLabel}>{t('ALL_ROUTES_SCREEN.STOPS')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{departure}</Text>
            <Text style={s.statLabel}>{t('ALL_ROUTES_SCREEN.DEPARTURE')}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const AllRoutesSearch = ({navigation, route}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const source = route?.params?.source;
  const destination = route?.params?.destination;

  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const {show: showGuestPopup, modal: guestModal} = useGuestGate(navigation);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(null);
  const [bannerObject, setBannerObject] = useState({});
  const isMounted = useRef(true);

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);

    const init = async () => {
      const netState = await NetInfo.fetch();
      setIsOffline(!netState.isConnected);
      await loadBanner();

      // Show cached data immediately — no long skeleton wait
      const cached = await getFromStorage(t('STORAGE.ROUTES_RESPONSE'));
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const pageData = parsed?.data?.data?.data;
          if (Array.isArray(pageData) && pageData.length > 0 && isMounted.current) {
            setList(pageData);
            setIsLoading(false);
          }
        } catch {}
      }

      // Fetch fresh from API in background (updates silently if cache was shown)
      await fetchRoutes(false);
    };
    init();

    return () => {
      isMounted.current = false;
      backHandler.remove();
    };
  }, []);

  // Re-search if language changed
  useFocusEffect(
    useCallback(() => {
      const checkLangChange = async () => {
        const changed = await AsyncStorage.getItem('isLangChanged');
        if (changed === 'true') fetchRoutes(false);
      };
      checkLangChange();
    }, []),
  );

  const loadBanner = async () => {
    try {
      const raw = await getFromStorage(t('STORAGE.LANDING_RESPONSE'));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.banners && isMounted.current) setBannerObject(parsed.banners);
      }
    } catch {}
  };

  // ── API ────────────────────────────────────────────────────────────────────

  const fetchRoutes = async (loadMore = false) => {
    AsyncStorage.setItem('isLangChanged', 'false');
    const page = loadMore ? currentPage + 1 : 1;

    if (loadMore) setIsLoadingMore(true);
    else setIsLoading(true);

    const payload = {
      source_place_id: source?.id,
      destination_place_id: destination?.id,
    };

    try {
      const res = await comnPost(`v2/routes?page=${page}`, payload, navigation);
      if (!isMounted.current) return;

      if (res?.data?.success) {
        const pageData = res.data.data?.data || [];
        const last = res.data.data?.last_page ?? 1;
        const current = res.data.data?.current_page ?? 1;

        if (loadMore) {
          setList(prev => [...prev, ...pageData]);
        } else {
          setList(pageData);
          saveToStorage(t('STORAGE.ROUTES_RESPONSE'), JSON.stringify(res));

          // Save to recent routes for MSRTCSearch history
          if (source?.id && destination?.id) {
            try {
              const raw = await AsyncStorage.getItem(RECENT_KEY);
              const existing = raw ? JSON.parse(raw) : [];
              const entry = {
                sourceId: source.id,
                sourceName: source.name,
                destId: destination.id,
                destName: destination.name,
                ts: Date.now(),
              };
              // Remove duplicate same route then prepend
              const filtered = existing.filter(
                r => !(r.sourceId === entry.sourceId && r.destId === entry.destId),
              );
              await AsyncStorage.setItem(
                RECENT_KEY,
                JSON.stringify([entry, ...filtered].slice(0, MAX_RECENT)),
              );
            } catch {}
          }
        }
        setCurrentPage(current);
        setLastPage(last);
      }
    } catch {
      // If first load failed, try cache
      if (!loadMore) {
        try {
          const cached = await getFromStorage(t('STORAGE.ROUTES_RESPONSE'));
          if (cached && isMounted.current) {
            const parsed = JSON.parse(cached);
            const pageData = parsed?.data?.data?.data;
            if (Array.isArray(pageData)) {
              setList(pageData);
              setIsOffline(true);
            }
          }
        } catch {}
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const onEndReached = async () => {
    if (!isLoadingMore && lastPage && currentPage < lastPage) {
      if (currentPage >= 2 && (await isGuestUser())) {
        showGuestPopup('Login to explore more routes beyond page 2.');
        return;
      }
      fetchRoutes(true);
    }
  };

  const openRouteDetail = useCallback(
    item => navigateTo(navigation, t('SCREEN.ROUTES_LIST'), {item}),
    [navigation, t],
  );

  // ── Render helpers ─────────────────────────────────────────────────────────

  const hasBannerFooter = bannerObject?.ROUTE_LIST_FOOTER?.length > 0;

  const headerTitle =
    source?.name && destination?.name
      ? `${source.name} → ${destination.name}`
      : t('HEADER.ROUTES');

  const ListHeader = () => (
    <>
      {isOffline && (
        <View style={s.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={15} color={C.offlineText} />
          <Text style={s.offlineText}>{t('ALL_ROUTES_SCREEN.OFFLINE_MSG')}</Text>
        </View>
      )}
    </>
  );

  const ListFooter = () => (
    <>
      {isLoadingMore && (
        <View style={s.loadMoreRow}>
          <ActivityIndicator size="small" color={C.oceanMid} />
          <Text style={s.loadMoreText}>{t('ALL_ROUTES_SCREEN.LOADING_MORE')}</Text>
        </View>
      )}
      {hasBannerFooter && (
        <View style={s.adBannerOuter}>
          <View style={s.adLabelBadge}>
            <Text style={s.adLabelText}>Premium Ad</Text>
          </View>
          <View style={s.bannerWrap}>
            <Banner
              bannerImages={bannerObject.ROUTE_LIST_FOOTER}
              style={{height: BANNER_H}}
            />
          </View>
        </View>
      )}
      <View style={{height: insets.bottom + 24}} />
    </>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={s.emptyWrap}>
        <Text style={s.emptyIcon}>🚌</Text>
        <Text style={s.emptyTitle}>{t('ALL_ROUTES_SCREEN.NO_ROUTES')}</Text>
        <Text style={s.emptySub}>{t('ALL_ROUTES_SCREEN.NO_ROUTES_SUB')}</Text>
      </View>
    );
  };

  const renderItem = useCallback(
    ({item}) => (
      <RouteCard item={item} onPress={() => openRouteDetail(item)} t={t} />
    ),
    [openRouteDetail, t],
  );

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>

        <TouchableOpacity
          style={s.backBtn}
          onPress={() => backPage(navigation)}
          activeOpacity={0.8}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>

        <Text style={s.headerTitle} numberOfLines={2}>{headerTitle}</Text>
        {!isLoading && (
          <Text style={s.headerSubtitle}>
            {list.length} {t('ALL_ROUTES_SCREEN.ROUTES_AVAILABLE')}
          </Text>
        )}

        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {/* ── List ── */}
      {isLoading ? (
        <FlatList
          style={s.list}
          contentContainerStyle={s.listContent}
          data={[]}
          renderItem={null}
          ListHeaderComponent={<SkeletonList />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          style={s.list}
          contentContainerStyle={[
            s.listContent,
            list.length === 0 && s.emptyContainer,
          ]}
          data={list}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<ListFooter />}
          ListEmptyComponent={renderEmpty}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
      {guestModal}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    position: 'relative',
    overflow: 'hidden',
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#B8E4EA',
    opacity: 0.9,
  },
  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: C.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // List
  list: {flex: 1},
  listContent: {paddingTop: 12},
  emptyContainer: {flex: 1},

  // Offline banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: C.offlineBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.offlineBorder,
  },
  offlineText: {
    flex: 1,
    fontSize: 12,
    color: C.offlineText,
    fontWeight: '500',
  },

  // Route card
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.10)',
    ...Platform.select({
      ios: {
        shadowColor: '#0D3D4A',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
    }),
  },
  cardTypeBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  cardTypeBarText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardBody: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  busIconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  busIconBg: {
    position: 'absolute',
    width: 63,
    height: 63,
    borderRadius: 16,
    backgroundColor: 'rgba(27,107,123,0.10)',
  },
  busIcon: {width: 82, height: 82},
  cardRouteName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: C.textDark,
    lineHeight: 23,
  },
  // Divider inside card
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 8,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.oceanMid,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Load more footer
  loadMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadMoreText: {fontSize: 13, color: C.textLight},

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {fontSize: 48, marginBottom: 16},
  emptyTitle: {fontSize: 17, fontWeight: '700', color: C.textDark, marginBottom: 6},
  emptySub: {fontSize: 14, color: C.textLight, textAlign: 'center', paddingHorizontal: 32},

  // Banner — dashed outline matches MSRTCSearch ad-banner style
  adBannerOuter: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: C.sandPale,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: C.sandMid,
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  adLabelBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: C.sandMid,
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bannerWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    height: BANNER_H,
  },
});

// ─── Redux ─────────────────────────────────────────────────────────────────────

const mapStateToProps = state => ({
  mode: state.commonState.mode,
  isLoading: state.commonState.isLoading,
});

const mapDispatchToProps = dispatch => ({
  setLoader: data => dispatch(setLoader(data)),
  setMode: data => dispatch(setMode(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AllRoutesSearch);
