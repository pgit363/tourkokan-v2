import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  BackHandler,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {connect} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {AWS_URL} from '@env';
import {comnPost} from '../Services/Api/CommonServices';
import STRING from '../Services/Constants/STRINGS';
import {backPage} from '../Services/CommonMethods';

const STATUS_TABS = [
  {key: null, label: 'All'},
  {key: 'pending', label: 'Pending'},
  {key: 'approved', label: 'Approved'},
  {key: 'rejected', label: 'Rejected'},
  {key: 'completed', label: 'Completed'},
  {key: 'cancelled', label: 'Cancelled'},
];

const STATUS_COLORS = {
  pending: {bg: '#FEF3C7', text: '#92400E'},
  approved: {bg: '#D1FAE5', text: '#065F46'},
  rejected: {bg: '#FEE2E2', text: '#991B1B'},
  completed: {bg: '#DBEAFE', text: '#1E40AF'},
  cancelled: {bg: '#F3F4F6', text: '#374151'},
  draft: {bg: '#F3F4F6', text: '#374151'},
};

const PAGE_SIZE = 10;

const C = {
  bg: '#FAF7F0',
  card: '#FFFFFF',
  primary: '#0D3D4A',
  accent: '#1B6B7B',
  amber: '#F59E0B',
  text: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  border: '#E7E5E4',
  white: '#FFFFFF',
};

// ─── Event Card ──────────────────────────────────────────────────────────────

const EventCard = ({item, onPress}) => {
  const imgUri = item.banner_image_url || (item.banner_image ? `${AWS_URL}/${item.banner_image}` : null);
  const sc = STATUS_COLORS[item.status] || STATUS_COLORS.draft;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {imgUri ? (
        <Image source={{uri: imgUri}} style={styles.cardImg} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
          <Text style={{fontSize: 28}}>🎪</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.statusPill, {backgroundColor: sc.bg}]}>
            <Text style={[styles.statusText, {color: sc.text}]}>
              {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : ''}
            </Text>
          </View>
        </View>
        {!!item.start_date && (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={C.textLight} />
            <Text style={styles.metaText}>{item.start_date}</Text>
          </View>
        )}
        {!!item.location && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={C.textLight} />
            <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

const MyEvents = ({navigation}) => {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchingRef = useRef(false);

  const fetchEvents = useCallback(async (p, st, isRefresh = false) => {
    if (p === 1 && !isRefresh && fetchingRef.current) return;
    if (p > 1 && fetchingRef.current) return;
    fetchingRef.current = true;

    if (isRefresh) {
      setRefreshing(true);
    } else if (p === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const payload = {page: p, limit: PAGE_SIZE};
    if (st) payload.status = st;

    try {
      const res = await comnPost('v2/myEvents', payload, navigation);
      const list = res?.data?.data?.data || res?.data?.data || [];
      const total = res?.data?.data?.total ?? list.length;

      setEvents(prev => p === 1 || isRefresh ? list : [...prev, ...list]);
      setHasMore(p * PAGE_SIZE < total);
      setPage(p);
    } catch (e) {
      console.log('myEvents error', e);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.goBack();
        return true;
      });
      return () => handler.remove();
    }, [navigation]),
  );

  useFocusEffect(
    useCallback(() => {
      fetchEvents(1, status, false);
    }, [status]),
  );

  const onRefresh = () => fetchEvents(1, status, true);

  const onEndReached = () => {
    if (!fetchingRef.current && hasMore) {
      fetchEvents(page + 1, status);
    }
  };

  const changeStatus = (s) => {
    if (s === status) return;
    setStatus(s);
    setPage(1);
    setHasMore(true);
    setEvents([]);
  };

  const renderItem = ({item}) => (
    <EventCard
      item={item}
      onPress={() => navigation.navigate(STRING.SCREEN.EVENT_DETAIL, {event: item})}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={C.accent} />
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => backPage(navigation)} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate(STRING.SCREEN.CREATE_EVENT)}
          activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={C.white} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Status filter tabs */}
      <View style={styles.tabsWrap}>
        <FlatList
          data={STATUS_TABS}
          keyExtractor={item => String(item.key)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          renderItem={({item}) => {
            const active = item.key === status;
            return (
              <TouchableOpacity
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => changeStatus(item.key)}
                activeOpacity={0.75}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Full-screen loader for initial fetch */}
      {loading && (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      )}

      {/* List */}
      {!loading && (
        <FlatList
          data={events}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎪</Text>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptyDesc}>Tap "New" to create your first event.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 17, fontWeight: '700', color: C.primary, marginLeft: 4},
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 4,
  },
  newBtnText: {fontSize: 14, fontWeight: '600', color: C.white},
  tabsWrap: {backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border},
  tabsContent: {paddingHorizontal: 12, paddingVertical: 10, gap: 8},
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {backgroundColor: C.primary},
  tabText: {fontSize: 13, fontWeight: '500', color: C.textMid},
  tabTextActive: {color: C.white},
  listContent: {padding: 14, gap: 12, paddingBottom: 30},
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  cardImg: {width: '100%', height: 160},
  cardImgPlaceholder: {backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center'},
  cardBody: {padding: 12},
  cardTitleRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8},
  cardTitle: {flex: 1, fontSize: 15, fontWeight: '700', color: C.text},
  statusPill: {borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start'},
  statusText: {fontSize: 11, fontWeight: '600'},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4},
  metaText: {fontSize: 12, color: C.textLight},
  loaderWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  footerLoader: {paddingVertical: 20, alignItems: 'center'},
  empty: {alignItems: 'center', paddingTop: 80, paddingHorizontal: 32},
  emptyIcon: {fontSize: 48, marginBottom: 12},
  emptyTitle: {fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 6},
  emptyDesc: {fontSize: 14, color: C.textLight, textAlign: 'center'},
});

const mapStateToProps = () => ({});

export default connect(mapStateToProps)(MyEvents);
