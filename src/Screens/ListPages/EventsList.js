import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NetInfo from '@react-native-community/netinfo';
import {AWS_URL} from '@env';
import {backPage} from '../../Services/CommonMethods';
import {comnPost} from '../../Services/Api/CommonServices';
import STRING from '../../Services/Constants/STRINGS';

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  forestDeep: '#1A3320',
  oceanFoam: '#B8E4EA',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
};

const MY_STATUS_FILTERS = [
  {label: 'All', value: null},
  {label: 'Pending', value: 'pending'},
  {label: 'Approved', value: 'approved'},
  {label: 'Rejected', value: 'rejected'},
];

const STATUS_META = {
  pending:  {bg: '#FEF3C7', color: '#92400E'},
  approved: {bg: '#D1FAE5', color: '#065F46'},
  rejected: {bg: '#FEE2E2', color: '#991B1B'},
};

// ─── Shimmer ──────────────────────────────────────────────────────────────────

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

const SkeletonCard = ({opacity}) => (
  <Animated.View style={[sk.card, {opacity}]}>
    <View style={sk.img} />
    <View style={sk.body}>
      <View style={sk.line} />
      <View style={sk.lineSm} />
      <View style={sk.statsRow}>
        <View style={sk.stat} />
        <View style={sk.stat} />
        <View style={sk.stat} />
      </View>
    </View>
  </Animated.View>
);

const SkeletonList = () => {
  const opacity = useShimmer();
  return (
    <>{Array.from({length: 4}).map((_, i) => <SkeletonCard key={i} opacity={opacity} />)}</>
  );
};

const sk = StyleSheet.create({
  card: {
    backgroundColor: C.white, borderRadius: 18,
    marginHorizontal: 20, marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  img: {width: '100%', height: 140, backgroundColor: '#E5E7EB'},
  body: {padding: 14, gap: 8},
  line: {height: 16, width: '75%', backgroundColor: '#E5E7EB', borderRadius: 7},
  lineSm: {height: 12, width: '50%', backgroundColor: '#F3F4F6', borderRadius: 6},
  statsRow: {flexDirection: 'row', gap: 8, marginTop: 4},
  stat: {flex: 1, height: 12, backgroundColor: '#F3F4F6', borderRadius: 6},
});

// ─── Event Card ───────────────────────────────────────────────────────────────

const EventCard = ({item, onPress, showStatus}) => {
  const formatDate = iso => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const imgUri = item.banner_image_url
    || (item.banner_image ? `${AWS_URL}/${item.banner_image}` : null)
    || (item.image ? `${AWS_URL}/${item.image}` : null);
  const statusKey = item.status?.toLowerCase();
  const statusMeta = STATUS_META[statusKey];

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      {imgUri ? (
        <Image source={{uri: imgUri}} style={s.cardImage} />
      ) : (
        <LinearGradient colors={[C.oceanDeep, C.forestDeep]} style={s.cardImageFallback}>
          <Ionicons name="calendar" size={36} color="rgba(255,255,255,0.5)" />
        </LinearGradient>
      )}

      <View style={s.datePill}>
        <Ionicons name="calendar-outline" size={11} color={C.oceanMid} />
        <Text style={s.datePillText}>
          {formatDate(item.start_date)}
          {item.end_date && item.end_date !== item.start_date
            ? ` – ${formatDate(item.end_date)}` : ''}
        </Text>
      </View>

      {showStatus && statusMeta && (
        <View style={[s.statusPill, {backgroundColor: statusMeta.bg}]}>
          <Text style={[s.statusPillText, {color: statusMeta.color}]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      )}

      <View style={s.cardBody}>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.taluka ? (
          <View style={s.locationRow}>
            <Ionicons name="location-outline" size={13} color={C.textLight} />
            <Text style={s.locationText} numberOfLines={1}>{item.taluka}</Text>
          </View>
        ) : null}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Ionicons name="heart-outline" size={13} color={C.oceanMid} />
            <Text style={s.statText}>{item.like_count ?? 0}</Text>
          </View>
          <View style={s.stat}>
            <Ionicons name="checkmark-circle-outline" size={13} color={C.oceanMid} />
            <Text style={s.statText}>{item.going_count ?? 0} going</Text>
          </View>
          <View style={s.stat}>
            <Ionicons name="star-outline" size={13} color={C.oceanMid} />
            <Text style={s.statText}>{item.interested_count ?? 0} interested</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── EventsList ───────────────────────────────────────────────────────────────

const EventsList = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const siteId = route?.params?.site_id ?? null;
  const isTab = !siteId;

  // 'all' = All Events (v2/listEvents), 'mine' = My Events (v2/myEvents)
  const [mode, setMode] = useState(route?.params?.initialMode ?? 'all');
  const [myStatusFilter, setMyStatusFilter] = useState(null); // null = All

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offline, setOffline] = useState(false);

  const pageRef = useRef(1);
  const lastPageRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const initialFetchDone = useRef(false);

  // ── Connectivity ──
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => setOffline(!state.isConnected));
    return () => unsub();
  }, []);

  // ── Fetch ──
  const fetchEvents = useCallback((p = 1, currentMode = mode, statusFilter = myStatusFilter, isRefresh = false) => {
    if (offline) return;
    if (p === 1) {
      if (isRefresh) { setRefreshing(true); }
      else { setLoading(true); }
      pageRef.current = 1;
      lastPageRef.current = null;
      loadingMoreRef.current = false;
    } else {
      if (loadingMoreRef.current) return;
      if (lastPageRef.current !== null && pageRef.current >= lastPageRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    let endpoint;
    let payload = {per_page: 15, page: p};

    if (currentMode === 'mine') {
      endpoint = 'v2/myEvents';
      if (statusFilter) payload.status = statusFilter;
    } else {
      endpoint = 'v2/listEvents';
      if (siteId) payload.site_id = siteId;
    }

    console.log(`[EventsList] POST ${endpoint}`, payload);
    comnPost(endpoint, payload)
      .then(res => {
        const data = res?.data?.data;
        const items = data?.data ?? data ?? [];
        const cur = data?.current_page ?? p;
        const last = data?.last_page ?? p;

        setEvents(prev => p === 1 ? items : [...prev, ...items]);
        pageRef.current = cur;
        lastPageRef.current = last;
        setLoading(false);
        setRefreshing(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
      })
      .catch(err => {
        console.log('[EventsList] ERROR', err);
        setLoading(false);
        setRefreshing(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, myStatusFilter, siteId, offline]);

  useFocusEffect(
    useCallback(() => {
      if (offline) return;
      if (isTab || !initialFetchDone.current) {
        initialFetchDone.current = true;
        fetchEvents(1, mode, myStatusFilter);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchEvents, offline, isTab]),
  );

  const switchMode = newMode => {
    if (newMode === mode) return;
    setMode(newMode);
    setMyStatusFilter(null);
    setEvents([]);
    fetchEvents(1, newMode, null);
  };

  const switchStatus = newStatus => {
    if (newStatus === myStatusFilter) return;
    setMyStatusFilter(newStatus);
    setEvents([]);
    fetchEvents(1, mode, newStatus);
  };

  const onRefresh = () => fetchEvents(1, mode, myStatusFilter, true);

  const onEndReached = () => {
    if (!loadingMoreRef.current && lastPageRef.current && pageRef.current < lastPageRef.current) {
      fetchEvents(pageRef.current + 1, mode, myStatusFilter);
    }
  };

  const renderItem = ({item}) => (
    <EventCard
      item={item}
      showStatus={mode === 'mine'}
      onPress={() => navigation.navigate(STRING.SCREEN.EVENT_DETAIL, {event: item})}
    />
  );

  const renderEmpty = () => (
    <View style={s.emptyWrap}>
      <Text style={s.emptyIcon}>🎉</Text>
      <Text style={s.emptyTitle}>
        {mode === 'mine' ? 'No events found' : 'No events yet'}
      </Text>
      <Text style={s.emptyText}>
        {mode === 'mine' && myStatusFilter
          ? `No ${myStatusFilter} events.`
          : mode === 'mine'
          ? 'Create your first event!'
          : 'Be the first to create one!'}
      </Text>
      <TouchableOpacity
        style={s.createCta}
        onPress={() => navigation.navigate(STRING.SCREEN.CREATE_EVENT, siteId ? {site_id: siteId} : {})}
        activeOpacity={0.85}>
        <Text style={s.createCtaText}>Create Event</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>

        <View style={s.headerRow}>
          {!isTab && (
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => backPage(navigation)}
              activeOpacity={0.8}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="arrow-back" size={20} color={C.white} />
            </TouchableOpacity>
          )}
          <View style={s.headerText}>
            <Text style={s.headerTitle}>Events</Text>
            {!loading && events.length > 0 && (
              <Text style={s.headerSub}>{events.length} {mode === 'mine' ? 'my events' : 'upcoming'}</Text>
            )}
          </View>
          <TouchableOpacity
            style={s.createBtn}
            onPress={() => navigation.navigate(STRING.SCREEN.CREATE_EVENT, siteId ? {site_id: siteId} : {})}
            activeOpacity={0.85}>
            <Ionicons name="add" size={18} color={C.white} />
            <Text style={s.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Mode toggle — only show on tab (not when opened from site detail) */}
        {isTab && (
          <View style={s.modeRow}>
            <TouchableOpacity
              style={[s.modeTab, mode === 'all' && s.modeTabActive]}
              onPress={() => switchMode('all')}
              activeOpacity={0.8}>
              <Ionicons
                name="earth-outline"
                size={13}
                color={mode === 'all' ? C.oceanDeep : 'rgba(255,255,255,0.8)'}
              />
              <Text style={[s.modeText, mode === 'all' && s.modeTextActive]}>All Events</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modeTab, mode === 'mine' && s.modeTabActive]}
              onPress={() => switchMode('mine')}
              activeOpacity={0.8}>
              <Ionicons
                name="person-outline"
                size={13}
                color={mode === 'mine' ? C.oceanDeep : 'rgba(255,255,255,0.8)'}
              />
              <Text style={[s.modeText, mode === 'mine' && s.modeTextActive]}>My Events</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status sub-filters — only when My Events is active */}
        {isTab && mode === 'mine' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.statusScroll}
            contentContainerStyle={s.statusScrollContent}>
            {MY_STATUS_FILTERS.map(f => (
              <TouchableOpacity
                key={String(f.value)}
                style={[s.statusTab, myStatusFilter === f.value && s.statusTabActive]}
                onPress={() => switchStatus(f.value)}
                activeOpacity={0.8}>
                <Text style={[s.statusText, myStatusFilter === f.value && s.statusTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {/* Offline banner */}
      {offline && (
        <View style={s.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={C.white} />
          <Text style={s.offlineText}>No internet connection</Text>
        </View>
      )}

      {loading ? (
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
          contentContainerStyle={[s.listContent, events.length === 0 && s.emptyContainer]}
          data={events}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.oceanMid]}
              tintColor={C.oceanMid}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={C.oceanMid} style={{marginVertical: 16}} />
            ) : (
              <View style={{height: insets.bottom + 100}} />
            )
          }
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  header: {paddingHorizontal: 20, paddingBottom: 52, position: 'relative', overflow: 'hidden'},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  headerText: {flex: 1},
  headerTitle: {fontSize: 20, fontWeight: '700', color: C.white, letterSpacing: 0.2},
  headerSub: {fontSize: 12, color: C.oceanFoam, marginTop: 2},
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  createBtnText: {fontSize: 13, fontWeight: '600', color: C.white},

  // Mode toggle (All Events / My Events)
  modeRow: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 22,
    padding: 3,
    alignSelf: 'flex-start',
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  modeTabActive: {backgroundColor: C.white},
  modeText: {fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)'},
  modeTextActive: {color: C.oceanDeep},

  // Status sub-filters
  statusScroll: {marginTop: 10},
  statusScrollContent: {gap: 8, paddingRight: 4},
  statusTab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statusTabActive: {backgroundColor: C.white, borderColor: C.white},
  statusText: {fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)'},
  statusTextActive: {color: C.oceanDeep},

  headerCurve: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
    backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#B91C1C', paddingVertical: 8,
  },
  offlineText: {fontSize: 13, color: C.white, fontWeight: '600'},
  list: {flex: 1},
  listContent: {paddingTop: 8, paddingHorizontal: 20},
  emptyContainer: {flex: 1},

  // Card
  card: {
    backgroundColor: C.white, borderRadius: 18, marginBottom: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  cardImage: {width: '100%', height: 170, resizeMode: 'cover'},
  cardImageFallback: {width: '100%', height: 120, alignItems: 'center', justifyContent: 'center'},
  datePill: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  datePillText: {fontSize: 11, fontWeight: '600', color: C.oceanDeep},
  statusPill: {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusPillText: {fontSize: 10, fontWeight: '700', letterSpacing: 0.3},
  cardBody: {padding: 14, gap: 6},
  cardTitle: {fontSize: 15, fontWeight: '700', color: C.textDark, lineHeight: 21},
  locationRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  locationText: {fontSize: 12, color: C.textLight, flex: 1},
  statsRow: {flexDirection: 'row', gap: 14, marginTop: 4},
  stat: {flexDirection: 'row', alignItems: 'center', gap: 4},
  statText: {fontSize: 12, color: C.textMid},
  emptyWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24},
  emptyIcon: {fontSize: 52, opacity: 0.4, marginBottom: 4},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: C.textMid},
  emptyText: {fontSize: 13, color: C.textLight},
  createCta: {
    marginTop: 8, backgroundColor: C.oceanMid, borderRadius: 22,
    paddingHorizontal: 22, paddingVertical: 11,
  },
  createCtaText: {fontSize: 14, fontWeight: '700', color: C.white},
});

export default EventsList;
