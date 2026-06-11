import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {comnPost, getFromStorage, saveToStorage} from '../../Services/Api/CommonServices';
import {backPage, checkLogin, goBackHandler, navigateTo} from '../../Services/CommonMethods';
import {useConnectivityGate} from '../../Components/Common/useConnectivityGate';

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
  if (n.includes('semi luxury') || n.includes('hirkani semi')) return BUS_IMAGES.hirkaniSemi;
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
    return parsed?.[0]?.color_code || '#1B6B7B';
  } catch {
    return '#1B6B7B';
  }
};

const BusRouteList = ({navigation}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {modal: connectivityModal, ensureOnline} = useConnectivityGate();

  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const listRef = useRef([]);
  const currentPageRef = useRef(1);
  const lastPageRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const isMounted = useRef(true);
  const autoLoadedRef = useRef(false);

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    init();
    return () => {
      isMounted.current = false;
      backHandler.remove();
    };
  }, []);

  const init = async () => {
    const cached = await getFromStorage(t('STORAGE.BUS_ROUTES_RESPONSE'));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const paginatedData = parsed?.data?.data;
        const pageData = paginatedData?.data;
        if (Array.isArray(pageData) && pageData.length > 0 && isMounted.current) {
          listRef.current = pageData;
          setList(pageData);
          currentPageRef.current = paginatedData?.current_page ?? 1;
          lastPageRef.current = paginatedData?.last_page ?? null;
          setIsLoading(false);
        }
      } catch (e) { console.warn("[caught]", e); }
    }

    // Routes need live data — gate the network fetch by mode/connectivity.
    // (Cached routes above are still shown; offline → "Go Online" popup.)
    ensureOnline(async () => {
      await fetchRoutes(false);

      setTimeout(() => {
        if (
          !autoLoadedRef.current &&
          lastPageRef.current !== null &&
          lastPageRef.current > 1 &&
          isMounted.current &&
          !isLoadingMoreRef.current
        ) {
          autoLoadedRef.current = true;
          fetchRoutes(true);
        }
      }, 50);
    });
  };

  const fetchRoutes = async (loadMore = false) => {
    const page = loadMore ? currentPageRef.current + 1 : 1;

    if (loadMore) {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await comnPost(`v2/routes?page=${page}`, {}, navigation);
      if (!isMounted.current) return;

      if (res?.data?.success) {
        const pageData = res.data.data?.data || [];
        const last = res.data.data?.last_page ?? 1;
        const current = res.data.data?.current_page ?? 1;

        if (loadMore) {
          const existingIds = new Set(listRef.current.map(r => r.id));
          const unique = pageData.filter(r => !existingIds.has(r.id));
          const merged = [...listRef.current, ...unique];
          listRef.current = merged;
          setList(merged);
        } else {
          listRef.current = pageData;
          setList(pageData);
          saveToStorage(t('STORAGE.BUS_ROUTES_RESPONSE'), JSON.stringify(res));
        }

        currentPageRef.current = current;
        lastPageRef.current = last;
      }
    } catch (e) { console.warn("[caught]", e); }
    finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
        isLoadingMoreRef.current = false;
      }
    }
  };

  const loadMore = () => {
    if (
      !isLoadingMoreRef.current &&
      lastPageRef.current &&
      currentPageRef.current < lastPageRef.current
    ) {
      // Offline mode → prompt to go online before loading the next page.
      ensureOnline(() => fetchRoutes(true));
    }
  };

  const openRoute = item => {
    navigateTo(navigation, t('SCREEN.ROUTES_LIST'), {item});
  };

  const renderItem = ({item}) => {
    const busImage = getBusImage(item?.bus_type?.type || '');
    const badgeColor = getBadgeColor(item?.bus_type?.meta_data || '');
    const routeName = `${item?.source_place?.name || ''} → ${item?.destination_place?.name || ''}`;
    const stopsCount = item?.route_stops_count ?? item?.route_stops?.length ?? 0;
    const distance = item?.distance != null ? `${parseFloat(item.distance).toFixed(1)} km` : '—';
    const departure = item?.start_time || '—';
    const busType = item?.bus_type?.type || '';

    return (
      <TouchableOpacity style={s.card} onPress={() => openRoute(item)} activeOpacity={0.75}>
        <View style={[s.cardTypeBar, {backgroundColor: badgeColor}]}>
          <Text style={s.cardTypeBarText}>{busType}</Text>
        </View>
        <View style={s.cardBody}>
          <View style={s.cardHeader}>
            <View style={s.busIconWrap}>
              <View style={s.busIconBg} />
              <Image source={busImage} style={s.busIcon} resizeMode="contain" />
            </View>
            <Text style={s.cardRouteName} numberOfLines={2}>{routeName}</Text>
          </View>
          <View style={s.cardDivider} />
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

  if (isLoading) {
    return (
      <View style={[s.root, {justifyContent: 'center', alignItems: 'center'}]}>
        <StatusBar backgroundColor="#1B6B7B" barStyle="light-content" />
        <ActivityIndicator size="large" color="#1B6B7B" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar backgroundColor="#1B6B7B" barStyle="light-content" />

      <LinearGradient
        colors={['#0D3D4A', '#1A3320']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => backPage(navigation)}
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerTextWrap}>
            <Text style={s.headerTitle}>Bus Routes</Text>
            {!isLoading && list.length > 0 && (
              <Text style={s.headerSubtitle}>{list.length} routes available</Text>
            )}
          </View>
          <TouchableOpacity
            style={s.filterBtn}
            onPress={() => navigateTo(navigation, t('SCREEN.ROUTES'))}
            activeOpacity={0.85}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="options-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      <FlatList
        data={list}
        extraData={list.length}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={s.footer}>
              <ActivityIndicator size="small" color="#1B6B7B" />
            </View>
          ) : null
        }
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      />
      {connectivityModal}
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#FAF7F0'},
  header: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextWrap: {flex: 1},
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {fontSize: 12, color: '#B8E4EA', opacity: 0.9, marginTop: 2},
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: '#FAF7F0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  listContent: {paddingHorizontal: 20, paddingVertical: 12},
  list: {flex: 1},

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
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
  cardTypeBar: {paddingHorizontal: 16, paddingVertical: 6},
  cardTypeBarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardBody: {padding: 12},
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
    color: '#1C1917',
    lineHeight: 23,
  },
  cardDivider: {height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 8},

  statsRow: {flexDirection: 'row', alignItems: 'center'},
  statItem: {flex: 1, alignItems: 'center'},
  statDivider: {width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.07)'},
  statValue: {fontSize: 14, fontWeight: '600', color: '#1B6B7B', marginBottom: 2},
  statLabel: {
    fontSize: 10,
    color: '#78716C',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  footer: {paddingVertical: 16, alignItems: 'center'},
});

export default BusRouteList;
