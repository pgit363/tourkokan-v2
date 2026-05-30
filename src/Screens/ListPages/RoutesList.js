import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
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
import {useTranslation} from 'react-i18next';
import {backPage, checkLogin, goBackHandler, navigateTo} from '../../Services/CommonMethods';
import {comnPost, getFromStorage} from '../../Services/Api/CommonServices';
import Banner from '../../Components/Customs/Banner';

// ─── Bus image map ────────────────────────────────────────────────────────────

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
  if (n.includes('day ordinary') || (n.includes('day') && n.includes('ordinary'))) return BUS_IMAGES.dayOrdinary;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const {width: SW} = Dimensions.get('window');
const BANNER_H = Math.round(SW / 3);

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanLight: '#4AABB8',
  forestDeep: '#1A3320',
  forestMid: '#2E5C3A',
  sandMid: '#C4972A',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  offlineBg: '#FEF3CD',
  offlineBorder: '#F59E0B',
  offlineText: '#92400E',
};

// ─── Shimmer hook ─────────────────────────────────────────────────────────────

const useShimmer = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {toValue: 1, duration: 750, useNativeDriver: true}),
        Animated.timing(anim, {toValue: 0, duration: 750, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim.interpolate({inputRange: [0, 1], outputRange: [0.35, 0.8]});
};

// ─── Skeleton Components ──────────────────────────────────────────────────────

const SkeletonTimelineRow = ({opacity}) => (
  <Animated.View style={[sk.timelineRow, {opacity}]}>
    <View style={sk.dotWrap}>
      <View style={sk.dot} />
      <View style={sk.line} />
    </View>
    <View style={sk.contentWrap}>
      <View style={sk.contentName} />
      <View style={sk.contentSub} />
    </View>
  </Animated.View>
);

const SkeletonList = () => {
  const opacity = useShimmer();
  return (
    <>
      {Array.from({length: 8}).map((_, i) => (
        <SkeletonTimelineRow key={i} opacity={opacity} />
      ))}
    </>
  );
};

const sk = StyleSheet.create({
  timelineRow: {
    flexDirection: 'row',
    gap: 0,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  dotWrap: {alignItems: 'center', width: 28},
  dot: {width: 14, height: 14, borderRadius: 7, backgroundColor: '#E5E7EB', marginTop: 4},
  line: {width: 2, flex: 1, backgroundColor: '#F3F4F6', marginTop: 4, minHeight: 30},
  contentWrap: {flex: 1, paddingBottom: 20, paddingLeft: 12, gap: 6},
  contentName: {height: 14, width: '55%', backgroundColor: '#E5E7EB', borderRadius: 7},
  contentSub: {height: 11, width: '35%', backgroundColor: '#F3F4F6', borderRadius: 6},
});

// ─── Timeline Stop Item ───────────────────────────────────────────────────────

const TimelineStop = ({item, index, total}) => {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isEndpoint = isFirst || isLast;
  const isLast2 = index === total - 1;

  return (
    <View style={tl.row}>
      {/* Dot + vertical line column */}
      <View style={tl.dotCol}>
        <View style={[tl.dot, isEndpoint && tl.dotEndpoint]} />
        {!isLast2 && <View style={tl.line} />}
      </View>

      {/* Content */}
      <View style={[tl.content, !isLast2 && tl.contentPadded]}>
        <Text style={[tl.stopName, isEndpoint && tl.stopNameEndpoint]} numberOfLines={1}>
          {item?.site?.name ?? '—'}
        </Text>
        <View style={tl.metaRow}>
          {item?.arr_time ? (
            <Text style={tl.stopTime}>{item.arr_time}</Text>
          ) : null}
          {item?.distance != null ? (
            <Text style={tl.stopDist}>{item.distance} km</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const tl = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  dotCol: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.oceanMid,
    borderWidth: 3,
    borderColor: C.white,
    marginTop: 4,
    zIndex: 2,
    // iOS shadow only (no elevation per requirement)
    ...Platform.select({
      ios: {
        shadowColor: C.oceanMid,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
    }),
  },
  dotEndpoint: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.sandMid,
    marginTop: 1,
    ...Platform.select({
      ios: {
        shadowColor: C.sandMid,
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.45,
        shadowRadius: 6,
      },
    }),
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: C.oceanLight,
    opacity: 0.45,
    marginTop: 2,
    minHeight: 24,
  },
  content: {
    flex: 1,
    paddingLeft: 14,
    paddingTop: 2,
  },
  contentPadded: {
    paddingBottom: 22,
  },
  stopName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textDark,
    marginBottom: 3,
  },
  stopNameEndpoint: {
    color: C.oceanDeep,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stopTime: {
    fontSize: 12,
    color: C.textLight,
  },
  stopDist: {
    fontSize: 11,
    color: C.oceanMid,
    fontWeight: '500',
  },
});

// ─── Route Detail Card (mirrors AllRoutesSearch card, non-interactive) ────────

const RouteDetailCard = ({data, t}) => {
  const busImage = getBusImage(data?.bus_type?.type || '');
  const badgeColor = getBadgeColor(data?.bus_type?.meta_data || '');
  const routeName = `${data?.source_place?.name || ''} → ${data?.destination_place?.name || ''}`;
  const stopsCount = data?.route_stops_count ?? data?.route_stops?.length ?? 0;
  const distance = data?.distance != null ? `${parseFloat(data.distance).toFixed(1)} km` : '—';
  const departure = data?.start_time || '—';
  const busType = data?.bus_type?.type || '';

  return (
    <View style={rc.card}>
      <View style={[rc.typeBar, {backgroundColor: badgeColor}]}>
        <Text style={rc.typeBarText}>{busType}</Text>
      </View>
      <View style={rc.body}>
        <View style={rc.header}>
          <View style={rc.iconWrap}>
            <View style={rc.iconBg} />
            <Image source={busImage} style={rc.icon} resizeMode="contain" />
          </View>
          <Text style={rc.routeName} numberOfLines={2}>{routeName}</Text>
        </View>
        <View style={rc.divider} />
        <View style={rc.statsRow}>
          <View style={rc.statItem}>
            <Text style={rc.statValue}>{distance}</Text>
            <Text style={rc.statLabel}>{t('ALL_ROUTES_SCREEN.DISTANCE')}</Text>
          </View>
          <View style={rc.statDiv} />
          <View style={rc.statItem}>
            <Text style={rc.statValue}>{stopsCount}</Text>
            <Text style={rc.statLabel}>{t('ALL_ROUTES_SCREEN.STOPS')}</Text>
          </View>
          <View style={rc.statDiv} />
          <View style={rc.statItem}>
            <Text style={rc.statValue}>{departure}</Text>
            <Text style={rc.statLabel}>{t('ALL_ROUTES_SCREEN.DEPARTURE')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const rc = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    marginHorizontal: 16,
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
  typeBar: {paddingHorizontal: 16, paddingVertical: 6},
  typeBarText: {fontSize: 11, fontWeight: '700', color: C.white, textTransform: 'uppercase', letterSpacing: 0.6},
  body: {padding: 12},
  header: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8},
  iconWrap: {width: 80, height: 80, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  iconBg: {position: 'absolute', width: 63, height: 63, borderRadius: 16, backgroundColor: 'rgba(27,107,123,0.10)'},
  icon: {width: 82, height: 82},
  routeName: {flex: 1, fontSize: 16, fontWeight: '600', color: C.textDark, lineHeight: 22},
  divider: {height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 8},
  statsRow: {flexDirection: 'row', alignItems: 'center'},
  statItem: {flex: 1, alignItems: 'center'},
  statDiv: {width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.07)'},
  statValue: {fontSize: 13, fontWeight: '600', color: C.oceanMid, marginBottom: 2},
  statLabel: {fontSize: 10, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.3},
});

// ─── Main Component ────────────────────────────────────────────────────────────

const RoutesList = ({navigation, route}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const routeItem = route?.params?.item;
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [bannerObject, setBannerObject] = useState({});

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);

    const init = async () => {
      const netState = await NetInfo.fetch();
      setIsOffline(!netState.isConnected);

      // Load banner and fetch stops in parallel for speed
      const [landingData, stopsRes] = await Promise.all([
        getFromStorage(t('STORAGE.LANDING_RESPONSE')).catch(() => null),
        netState.isConnected && routeItem?.id
          ? comnPost('v2/getRouteStops', {route_id: routeItem.id}).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (landingData) {
        try {
          const parsed = JSON.parse(landingData);
          if (parsed?.banners) setBannerObject(parsed.banners);
        } catch {}
      }

      if (stopsRes?.data?.success && Array.isArray(stopsRes.data.data)) {
        setStops(stopsRes.data.data);
      }

      setIsLoading(false);
    };
    init();

    return () => backHandler.remove();
  }, []);

  const hasBannerFooter = bannerObject?.ROUTE_DETAIL_FOOTER?.length > 0;
  const hasBannerMiddle = bannerObject?.ROUTE_DETAIL_MIDDLE?.length > 0;
  const midBannerIndex = Math.floor(stops.length / 2);

  // ── Render ─────────────────────────────────────────────────────────────────

  const ListHeader = () => (
    <View>
      {/* Offline banner */}
      {isOffline && (
        <View style={s.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={C.offlineText} />
          <Text style={s.offlineText}>{t('ROUTES_LIST_SCREEN.OFFLINE_MSG')}</Text>
        </View>
      )}

      {/* Timeline section header */}
      {stops.length > 0 && (
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>
            {stops.length} {t('ROUTES_LIST_SCREEN.STOPS_COUNT')}
          </Text>
        </View>
      )}
    </View>
  );

  const ListFooter = () => (
    <>
      {hasBannerFooter && (
        <View style={s.bannerWrap}>
          <Banner
            bannerImages={bannerObject.ROUTE_DETAIL_FOOTER}
            style={{height: BANNER_H}}
          />
        </View>
      )}
      <View style={{height: insets.bottom + 24}} />
    </>
  );

  const renderEmpty = () => (
    <View style={s.emptyWrap}>
      <Text style={s.emptyIcon}>🚌</Text>
      <Text style={s.emptyTitle}>{t('ROUTES_LIST_SCREEN.NO_STOPS')}</Text>
      <Text style={s.emptySub}>{t('ROUTES_LIST_SCREEN.NO_STOPS_SUB')}</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>

        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => backPage(navigation)}
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>

          <Text style={s.headerTitle} numberOfLines={1}>
            {t('ROUTES_LIST_SCREEN.TITLE')}
          </Text>

          <TouchableOpacity
            style={s.contactBtn}
            onPress={() =>
              navigateTo(navigation, t('SCREEN.QUERIES_LIST'), {
                step: 1,
                route_id: route?.params?.item?.id,
              })
            }
            activeOpacity={0.8}>
            <Text style={s.contactBtnText}>{t('ROUTES_LIST_SCREEN.CONTACT_BTN')}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {/* ── Route card — outside FlatList so negative margin isn't clipped ── */}
      <View style={s.headCardWrap}>
        <RouteDetailCard data={route?.params?.item} t={t} />
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={s.list}
        contentContainerStyle={stops.length === 0 && !isLoading && s.emptyContainer}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <SkeletonList />
        ) : stops.length === 0 ? (
          renderEmpty()
        ) : (
          <>
            <ListHeader />
            {stops.map((item, index) => (
              <View key={item?.id?.toString() || index.toString()}>
                <TimelineStop item={item} index={index} total={stops.length} />
                {index === midBannerIndex && hasBannerMiddle && (
                  <View style={s.bannerWrap}>
                    <Banner
                      bannerImages={bannerObject.ROUTE_DETAIL_MIDDLE}
                      style={{height: BANNER_H}}
                    />
                  </View>
                )}
              </View>
            ))}
            <ListFooter />
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 60,
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
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },
  contactBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.white,
    letterSpacing: 0.2,
  },
  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: C.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // List
  list: {flex: 1},
  emptyContainer: {flex: 1},

  // RouteHeadCard wrapper — card self-aligns with alignSelf:center + bannerWidth
  headCardWrap: {
    marginTop: -16,
    marginBottom: 0,
  },

  // Offline banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
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

  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {fontSize: 44, marginBottom: 14},
  emptyTitle: {fontSize: 17, fontWeight: '700', color: C.textDark, marginBottom: 6},
  emptySub: {fontSize: 14, color: C.textLight},

  // Banner — overflow:hidden clips the full-width carousel to the rounded container
  bannerWrap: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    height: BANNER_H,
  },
});

export default RoutesList;
