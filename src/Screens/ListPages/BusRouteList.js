import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {comnPost, getFromStorage, saveToStorage} from '../../Services/Api/CommonServices';
import {backPage, checkLogin, goBackHandler, navigateTo} from '../../Services/CommonMethods';
import {useConnectivityGate} from '../../Components/Common/useConnectivityGate';
import {createLogger} from '../../Services/Logger';
import {scaleFontSizes} from '../../Services/responsive';

const log = createLogger('BusRouteList');

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

// Dash geometry for the vertical road centre-line (one repeating cycle = DASH+GAP).
const DASH_H = 26;
const DASH_GAP = 22;
const DASH_CYCLE = DASH_H + DASH_GAP;

// Animated "Coming Soon" empty state — a bus driving forward on a VERTICAL road:
// the centre-line dashes flow downward to sell the motion while the bus sways
// gently. Self-contained (no Lottie asset), runs on the native driver, and all
// sizes scale to the device width so it stays centred on phones and tablets.
const ComingSoon = () => {
  const {t} = useTranslation();
  const {width} = useWindowDimensions();

  // Responsive sizing — clamp so it looks right from small phones to tablets.
  // Bus is the hero; the road is a compact two-lane strip sized around it.
  const busW = Math.max(150, Math.min(width * 0.5, 220));
  const busH = busW * 0.74;
  const roadW = busW * 1.55; // two-lane road, a touch wider than the bus
  const stageH = Math.max(220, Math.min(width * 0.7, 320));
  // Bus rides in the right lane — offset to the right of the centre line.
  const busOffsetX = roadW * 0.22;
  // Enough dashes to fill the lane plus one extra cycle for the seamless loop.
  const dashCount = Math.ceil(stageH / DASH_CYCLE) + 2;

  const sway = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const road = useRef(new Animated.Value(0)).current;
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
        Animated.timing(sway, {toValue: -1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
      ]),
    );
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
        Animated.timing(bob, {toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
      ]),
    );
    const roadLoop = Animated.loop(
      Animated.timing(road, {toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true}),
    );
    // Staggered dots — each lights up in turn like a "loading" sequence.
    const dotLoops = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(v, {toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true}),
          Animated.timing(v, {toValue: 0, duration: 350, easing: Easing.in(Easing.ease), useNativeDriver: true}),
          Animated.delay((dots.length - 1 - i) * 200),
        ]),
      ),
    );
    swayLoop.start();
    bobLoop.start();
    roadLoop.start();
    dotLoops.forEach(l => l.start());
    return () => {
      swayLoop.stop();
      bobLoop.stop();
      roadLoop.stop();
      dotLoops.forEach(l => l.stop());
    };
  }, [sway, bob, road, dots]);

  // Dashes slide DOWN by one cycle then reset — bus appears to move forward.
  const roadShift = road.interpolate({inputRange: [0, 1], outputRange: [0, DASH_CYCLE]});
  // Subtle steering sway around the right-lane offset — keeps the bus alive.
  const busSway = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: [busOffsetX - 4, busOffsetX + 4],
  });
  // Gentle vertical bob — the bus feels like it's rolling over the road.
  const busBob = bob.interpolate({inputRange: [0, 1], outputRange: [0, -5]});

  return (
    <View style={s.csWrap}>
      <View style={[s.csStage, {height: stageH}]}>
        {/* Vertical road: solid white edge lines + downward-flowing centre line */}
        <View style={[s.csRoad, {width: roadW}]}>
          <View style={[s.csEdge, s.csEdgeLeft]} />
          <View style={[s.csEdge, s.csEdgeRight]} />
          <Animated.View
            style={[
              s.csDashes,
              {top: -DASH_CYCLE, transform: [{translateY: roadShift}]},
            ]}>
            {Array.from({length: dashCount}).map((_, i) => (
              <View key={i} style={s.csDash} />
            ))}
          </Animated.View>
        </View>
        {/* Bus sits centred on the lane */}
        <Animated.View style={[s.csBus, {transform: [{translateX: busSway}, {translateY: busBob}]}]}>
          <Image
            source={BUS_IMAGES.default}
            style={{width: busW, height: busH}}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <View style={s.csBadge}>
        <Ionicons name="time-outline" size={14} color="#1B6B7B" />
        <Text style={s.csBadgeText}>{t('BUS_ROUTE_SCREEN.COMING_SOON_TITLE')}</Text>
        <View style={s.csDots}>
          {dots.map((v, i) => (
            <Animated.View
              key={i}
              style={[
                s.csDotPulse,
                {
                  opacity: v.interpolate({inputRange: [0, 1], outputRange: [0.3, 1]}),
                  transform: [{scale: v.interpolate({inputRange: [0, 1], outputRange: [1, 1.55]})}],
                },
              ]}
            />
          ))}
        </View>
      </View>

      <Text style={s.csSub}>{t('BUS_ROUTE_SCREEN.COMING_SOON_SUB')}</Text>
    </View>
  );
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
      } catch (e) { log.warn("[caught]", e); }
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
    } catch (e) { log.warn("[caught]", e); }
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
        <SystemBars style="light" />
        <ActivityIndicator size="large" color="#1B6B7B" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SystemBars style="light" />

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
        ListEmptyComponent={!isLoading ? <ComingSoon /> : null}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={s.footer}>
              <ActivityIndicator size="small" color="#1B6B7B" />
            </View>
          ) : null
        }
        contentContainerStyle={[
          s.listContent,
          list.length === 0 && s.emptyContainer,
        ]}
        showsVerticalScrollIndicator={false}
      />
      {connectivityModal}
    </View>
  );
};

const s = StyleSheet.create(scaleFontSizes({
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

  emptyContainer: {flexGrow: 1, justifyContent: 'center'},

  // ── Coming soon (empty state) ──
  csWrap: {alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 24},
  csStage: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  // Vertical black road lane behind the bus (height fills the stage)
  csRoad: {
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#262626',
    overflow: 'hidden',
    alignItems: 'center',
  },
  // Solid white road edge lines
  csEdge: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  csEdgeLeft: {left: 14},
  csEdgeRight: {right: 14},
  // Column of white centre-line dashes that scroll downward
  csDashes: {position: 'absolute', alignItems: 'center'},
  csDash: {
    width: 6,
    height: DASH_H,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginBottom: DASH_GAP,
  },
  // Bus overlays the lane, centred horizontally and nudged slightly upward
  csBus: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 56,
    zIndex: 2,
  },
  csBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(27,107,123,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    marginBottom: 12,
  },
  csBadgeText: {fontSize: 15, fontWeight: '700', color: '#1B6B7B', letterSpacing: 0.3},
  csDots: {flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 2},
  csDotPulse: {width: 5, height: 5, borderRadius: 3, backgroundColor: '#1B6B7B'},
  csSub: {fontSize: 13.5, color: '#78716C', textAlign: 'center', lineHeight: 20, paddingHorizontal: 16},

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
}));

export default BusRouteList;
