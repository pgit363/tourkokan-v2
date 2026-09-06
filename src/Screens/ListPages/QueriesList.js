import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isGuestUser} from '../../Components/Common/GuestGateModal';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  BackHandler,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  backPage,
  checkLogin,
} from '../../Services/CommonMethods';
import {
  comnPost,
  dataSync,
  saveToStorage,
  getFromStorage,
} from '../../Services/Api/CommonServices';
import {setLoader} from '../../Reducers/CommonActions';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import STRING from '../../Services/Constants/STRINGS';
import ContactUs from '../ContactUs';
import ModePopup from '../../Components/Common/ModePopup';
import {setMode} from '../../Reducers/CommonActions';
import {createLogger} from '../../Services/Logger';
import {scaleFontSizes} from '../../Services/responsive';
import {shadow} from '../../Services/shadow';

const log = createLogger('QueriesList');

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanLight: '#4AABB8',
  oceanFoam: '#B8E4EA',
  sandMid: '#C4972A',
  earthMid: '#6B4226',
  forestDeep: '#1A3320',
  forestMid: '#2E5C3A',
  forestPale: '#D4EDD9',
  cream: '#EDE8DE',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  white: '#FFFFFF',
  green: '#059669',
  amber: '#F59E0B',
  indigo: '#4F46E5',
  greenBg: '#D1FAE5',
  indigoBg: '#E0E7FF',
  amberBg: '#FEF3C7',
  border: 'rgba(0,0,0,0.05)',
};

const TABS = [
  {key: 'All', labelKey: 'QUERIES_SCREEN.TAB_ALL', icon: '📋', status: ''},
  {key: 'Unread', labelKey: 'QUERIES_SCREEN.TAB_UNREAD', icon: '📭', status: 'unread'},
  {key: 'Read', labelKey: 'QUERIES_SCREEN.TAB_READ', icon: '📬', status: 'read'},
  {key: 'Replied', labelKey: 'QUERIES_SCREEN.TAB_REPLIED', icon: '✅', status: 'replied'},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = dateStr => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getStatusColor = status => {
  switch (status) {
    case 'unread':
      return COLORS.amber;
    case 'read':
      return COLORS.indigo;
    case 'replied':
      return COLORS.green;
    default:
      return COLORS.oceanMid;
  }
};

const getStatusBadgeBg = status => {
  switch (status) {
    case 'unread':
      return COLORS.amberBg;
    case 'read':
      return COLORS.indigoBg;
    case 'replied':
      return COLORS.greenBg;
    default:
      return COLORS.oceanFoam;
  }
};

const getStatusLabel = (t, status) => {
  switch (status) {
    case 'unread':
      return `📭 ${t('QUERIES_SCREEN.TAB_UNREAD')}`;
    case 'read':
      return `📬 ${t('QUERIES_SCREEN.TAB_READ')}`;
    case 'replied':
      return `✅ ${t('QUERIES_SCREEN.TAB_REPLIED')}`;
    default:
      return status;
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeader}>
      <View style={[styles.skeletonLine, styles.skeletonTitle]} />
      <View style={[styles.skeletonLine, styles.skeletonBadge]} />
    </View>
    <View style={[styles.skeletonLine, styles.skeletonText]} />
    <View style={[styles.skeletonLine, {height: 12, width: '80%', marginBottom: 4}]} />
    <View style={[styles.skeletonLine, styles.skeletonFooter]} />
  </View>
);

const QueryCard = React.memo(({item, isExpanded, onToggle}) => {
  const {t} = useTranslation();
  const statusColor = getStatusColor(item.status);
  const badgeBg = getStatusBadgeBg(item.status);
  const hasReply = item.reply !== null && item.reply !== '';

  return (
    <View
      style={[
        styles.queryCard,
        {borderLeftColor: statusColor},
        isExpanded && styles.queryCardExpanded,
      ]}>
      {/* Header row */}
      <View style={styles.queryCardHeader}>
        <Text
          style={styles.querySubject}
          numberOfLines={isExpanded ? undefined : 2}>
          {item.message}
        </Text>
        <View style={[styles.statusBadge, {backgroundColor: badgeBg}]}>
          <Text style={[styles.statusBadgeText, {color: statusColor}]}>
            {getStatusLabel(t, item.status)}
          </Text>
        </View>
      </View>

      {/* Message preview — shows same field, separate for expand control */}
      {isExpanded && item.message ? (
        <Text style={styles.queryMessage}>{item.message}</Text>
      ) : null}

      {/* Admin Reply (only when expanded and reply exists) */}
      {isExpanded && hasReply && (
        <View style={styles.adminReply}>
          <View style={styles.replyLabel}>
            <View style={styles.replyIconBadge}>
              <Text style={styles.replyIconText}>💁</Text>
            </View>
            <Text style={styles.replyLabelText}>{t('QUERIES_SCREEN.ADMIN_REPLY')}</Text>
          </View>
          <View style={styles.replyContent}>
            <Text style={styles.replyContentText}>{item.reply}</Text>
          </View>
          <View style={styles.replyMeta}>
            <Text style={styles.replyMetaText}>
              📅 {formatDate(item.updated_at)}
            </Text>
            <Text style={styles.replyMetaText}>👤 {t('QUERIES_SCREEN.SUPPORT')}</Text>
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.queryFooter}>
        <View style={styles.queryMeta}>
          <Text style={styles.queryMetaText}>📅 {formatDate(item.created_at)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.eyeBtn, isExpanded && styles.eyeBtnActive]}
          onPress={() => onToggle(item.id)}
          activeOpacity={0.7}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={styles.eyeIcon}>{isExpanded ? '👁‍🗨' : '👁'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

const QueriesList = ({navigation, route, ...props}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const isMounted = useRef(true);
  const modeRef = useRef(props.mode);

  const [queries, setQueries] = useState([]);
  const [counts, setCounts] = useState({all: 0, unread: 0, read: 0, replied: 0});
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    next_page_url: null,
  });
  const [showModePopup, setShowModePopup] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [step, setStep] = useState(route.params?.step || 0);
  const [errorMessage, setErrorMessage] = useState('');
  const [showGuestPopup, setShowGuestPopup] = useState(false);

  const handleAddQuery = async () => {
    if (await isGuestUser()) {
      setShowGuestPopup(true);
      return;
    }
    setStep(1);
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setShowGuestPopup(false);
    await AsyncStorage.clear();
    navigation.reset({index: 0, routes: [{name: STRING.SCREEN.EMAIL}]});
  };

  // Keep modeRef current so NetInfo listener always reads the latest mode
  useEffect(() => {
    modeRef.current = props.mode;
  }, [props.mode]);

  // Re-fetch when language changes
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isLangChanged').then(val => {
        if (val === 'true') {
          AsyncStorage.setItem('isLangChanged', 'false');
          const status = getTabStatus(activeTab);
          fetchQueries({page: 1, status, reset: true, silent: true});
        }
      });
    }, [activeTab, fetchQueries]),
  );

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    let unsubscribeNetInfo;
    const backHandler = BackHandler.addEventListener(
      STRING.EVENT.HARDWARE_BACK_PRESS,
      goBackStep,
    );

    checkLogin(navigation);

    const applyResult = result => {
      if (!isMounted.current) return;
      if (typeof result === 'string') {
        // Offline: result is the cached JSON string from AsyncStorage
        try {
          const cached = JSON.parse(result);
          if (Array.isArray(cached)) {
            setQueries(cached);
          } else if (cached?.data) {
            setQueries(cached.data);
            if (cached.counts) setCounts(cached.counts);
          }
        } catch (e) { log.warn("[caught]", e); }
      } else if (result && typeof result === 'object') {
        // Online: result is the axios response from comnPost
        const resData = result?.data?.data;
        if (resData?.data) {
          setQueries(resData.data);
          if (resData.counts) setCounts(resData.counts);
          setPagination({
            current_page: resData.current_page,
            last_page: resData.last_page,
            next_page_url: resData.next_page_url,
          });
          // Persist fresh data for offline use
          saveToStorage(
            STRING.STORAGE.QUERIES,
            JSON.stringify({data: resData.data, counts: resData.counts}),
          );
        }
      }
    };

    const init = async () => {
      // 1. Load local data immediately — show without waiting for API
      const localRaw = await getFromStorage(STRING.STORAGE.QUERIES);
      if (localRaw) {
        applyResult(localRaw);
        setLoading(false);
      }

      // 2. Subscribe to NetInfo; dataSync decides online→API or offline→cache.
      // Act only on the first event or a genuine connectivity change — NetInfo
      // fires on every detail change.
      let wasConnected = null;
      unsubscribeNetInfo = NetInfo.addEventListener(state => {
        const connected = !!state.isConnected;
        setIsOnline(connected);
        const changed = wasConnected !== connected;
        wasConnected = connected;
        if (!changed) return;

        // If offline mode is active or no internet, just load from cache — don't call API
        if (!connected || !modeRef.current) {
          getFromStorage(STRING.STORAGE.QUERIES).then(localRaw => {
            if (!isMounted.current) return;
            if (localRaw) applyResult(localRaw);
            setLoading(false);
            props.setLoader(false);
          });
          return;
        }

        dataSync(
          STRING.STORAGE.QUERIES,
          () => comnPost('v2/getQueries', {page: 1}),
          modeRef.current,
        ).then(result => {
          if (!isMounted.current) return;
          applyResult(result);
          setLoading(false);
          props.setLoader(false);
        });
      });
    };

    init();

    return () => {
      backHandler.remove();
      if (unsubscribeNetInfo) unsubscribeNetInfo();
      isMounted.current = false;
    };
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getTabStatus = tabKey => {
    const tab = TABS.find(t => t.key === tabKey);
    return tab ? tab.status : '';
  };

  const goBackStep = () => {
    if (step === 0) {
      backPage(navigation);
    } else {
      setStep(0);
    }
    return true;
  };

  // ─── API ────────────────────────────────────────────────────────────────────

  const fetchQueries = useCallback(
    async ({page = 1, status = '', reset = false, silent = false}) => {
      if (!modeRef.current) {
        setShowModePopup(true);
        if (!silent) setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!silent && reset) setLoading(true);
      if (!reset) setLoadingMore(true);
      setErrorMessage('');

      try {
        const payload = {page};
        if (status) payload.status = status;

        const res = await comnPost('v2/getQueries', payload);

        if (!isMounted.current) return;

        if (res?.data?.success && res.data.data) {
          const resData = res.data.data;
          const newQueries = resData.data || [];

          if (reset) {
            setQueries(newQueries);
          } else {
            setQueries(prev => [...prev, ...newQueries]);
          }

          if (resData.counts) {
            setCounts(resData.counts);
          }

          setPagination({
            current_page: resData.current_page,
            last_page: resData.last_page,
            next_page_url: resData.next_page_url,
          });

          if (reset) {
            saveToStorage(
              STRING.STORAGE.QUERIES,
              JSON.stringify({data: newQueries, counts: resData.counts}),
            );
          }
        } else {
          setErrorMessage('Failed to load queries. Please try again.');
        }
      } catch (_) {
        if (isMounted.current) {
          setErrorMessage('Unable to connect. Please check your internet connection.');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
          props.setLoader(false);
        }
      }
    },
    // modeRef is a ref — no need to list it as dep; it's always current
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleTabPress = useCallback(
    async tabKey => {
      if (tabKey === activeTab) return;

      if (!isOnline || !modeRef.current) {
        setShowModePopup(true);
        return;
      }

      setActiveTab(tabKey);
      setExpandedCards({});
      const status = getTabStatus(tabKey);
      await fetchQueries({page: 1, status, reset: true});
    },
    [activeTab, isOnline, fetchQueries],
  );

  const handleToggleCard = useCallback(id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards(prev => ({...prev, [id]: !prev[id]}));
  }, []);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !pagination.next_page_url) return;

    if (!isOnline || !modeRef.current) {
      setShowModePopup(true);
      return;
    }

    const status = getTabStatus(activeTab);
    fetchQueries({
      page: pagination.current_page + 1,
      status,
      reset: false,
    });
  }, [loadingMore, pagination, isOnline, activeTab, fetchQueries]);

  const handleRefresh = useCallback(() => {
    if (!isOnline || !modeRef.current) {
      setShowModePopup(true);
      return;
    }
    setRefreshing(true);
    const status = getTabStatus(activeTab);
    fetchQueries({page: 1, status, reset: true, silent: true});
  }, [isOnline, activeTab, fetchQueries]);

  const handleModeChange = useCallback(
    newMode => {
      // Update ref immediately so fetchQueries reads the correct mode synchronously
      modeRef.current = newMode;
      // Persist to AsyncStorage so other screens see the updated mode
      saveToStorage(STRING.STORAGE.MODE, JSON.stringify(newMode));
      props.setMode(newMode);
      setShowModePopup(false);
      if (newMode) {
        const status = getTabStatus(activeTab);
        fetchQueries({page: 1, status, reset: true});
      }
    },
    [activeTab, fetchQueries],
  );

  const renderItem = useCallback(
    ({item}) => (
      <QueryCard
        item={item}
        isExpanded={!!expandedCards[item.id]}
        onToggle={handleToggleCard}
      />
    ),
    [expandedCards, handleToggleCard],
  );

  // Called by ContactUs after successful query submission
  const handleQuerySubmitted = useCallback(() => {
    setStep(0);
    setExpandedCards({});
    setActiveTab('All');
    // fetchQueries handles setLoading(true/false) internally when reset=true
    fetchQueries({page: 1, status: '', reset: true});
  }, [fetchQueries]);

  // ─── Step 1: ContactUs form ─────────────────────────────────────────────────

  if (step === 1) {
    return (
      <ContactUs
        navigation={navigation}
        step={step}
        setStep={setStep}
        route_id={route.params?.route_id}
        reportContext={route.params?.reportContext}
        onQuerySubmitted={handleQuerySubmitted}
      />
    );
  }

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{counts.all ?? 0}</Text>
          <Text style={styles.statLabel}>{t('QUERIES_SCREEN.TOTAL')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{counts.unread ?? 0}</Text>
          <Text style={styles.statLabel}>{t('QUERIES_SCREEN.UNREAD_LABEL')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{counts.replied ?? 0}</Text>
          <Text style={styles.statLabel}>{t('QUERIES_SCREEN.REPLIED_LABEL')}</Text>
        </View>
      </View>

      {/* Offline banner */}
      {(!isOnline || !props.mode) && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color={COLORS.sandMid} />
          <Text style={styles.offlineBannerText}>
            {!props.mode ? t('QUERIES_SCREEN.OFFLINE_CACHED') : t('QUERIES_SCREEN.NO_INTERNET_CACHED')}
          </Text>
        </View>
      )}

      {/* Error message */}
      {!!errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
          <TouchableOpacity
            onPress={() =>
              fetchQueries({page: 1, status: getTabStatus(activeTab), reset: true})
            }>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color={COLORS.oceanMid} />
          <Text style={styles.loadMoreText}>{t('QUERIES_SCREEN.LOADING_MORE')}</Text>
        </View>
      );
    }
    if (!pagination.next_page_url && queries.length > 0) {
      return <View style={styles.listEnd} />;
    }
    return null;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>{t('QUERIES_SCREEN.NO_QUERIES')}</Text>
        <Text style={styles.emptyText}>
          {!isOnline || !props.mode
            ? t('QUERIES_SCREEN.CONNECT_TO_LOAD')
            : t('QUERIES_SCREEN.NO_QUERIES_YET')}
        </Text>
      </View>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => backPage(navigation)}
              activeOpacity={0.8}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="chevron-back" size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addQueryBtn}
              onPress={handleAddQuery}
              activeOpacity={0.85}>
              <Text style={styles.addQueryBtnText}>➕  {t('QUERIES_SCREEN.ADD_QUERY')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>{t('QUERIES_SCREEN.TITLE')}</Text>
          <Text style={styles.headerSubtitle}>{t('QUERIES_SCREEN.SUBTITLE')}</Text>
        </SafeAreaView>
      </View>
      {/* Curved bottom edge — outside header so it isn't clipped */}
      <View style={styles.headerCurve} />

      {/* ── Filter Tabs ── */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.8}>
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {t(tab.labelKey)}
                </Text>
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {counts[tab.key.toLowerCase()] ?? 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Body ── */}
      {loading ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, {paddingBottom: insets.bottom + 40}]}
          showsVerticalScrollIndicator={false}>
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, {paddingBottom: insets.bottom + 40}]}
          data={queries}
          keyExtractor={(item, idx) =>
            item.id ? item.id.toString() : `q-${idx}`
          }
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.oceanMid]}
              tintColor={COLORS.oceanMid}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Mode Popup ── */}
      <ModePopup
        visible={showModePopup}
        currentMode={props.mode}
        onClose={() => setShowModePopup(false)}
        onModeChange={handleModeChange}
      />

      {/* ── Guest Gate Modal ── */}
      <Modal
        visible={showGuestPopup}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowGuestPopup(false)}>
        <View style={guestSt.backdrop}>
          <View style={guestSt.card}>
            <View style={guestSt.iconWrap}>
              <Text style={guestSt.iconText}>🔒</Text>
            </View>
            <Text style={guestSt.title}>Members Only</Text>
            <Text style={guestSt.message}>
              Please register or login to raise a query.
            </Text>
            <TouchableOpacity
              style={guestSt.loginBtn}
              onPress={handleGuestLogin}
              activeOpacity={0.85}>
              <Text style={guestSt.loginBtnText}>Login / Register</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={guestSt.cancelBtn}
              onPress={() => setShowGuestPopup(false)}
              activeOpacity={0.7}>
              <Text style={guestSt.cancelBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create(scaleFontSizes({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  // Header
  header: {
    backgroundColor: COLORS.oceanDeep,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addQueryBtn: {
    backgroundColor: COLORS.sandMid,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addQueryBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  headerCurve: {
    height: 40,
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
    marginTop: -40,
    zIndex: 1,
  },

  // Tabs
  tabsContainer: {
    backgroundColor: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    marginTop: 0,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: 5,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: COLORS.oceanMid,
    borderColor: 'transparent',
  },
  tabIcon: {
    fontSize: 13,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMid,
  },
  tabLabelActive: {
    color: COLORS.white,
  },
  tabBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMid,
  },
  tabBadgeTextActive: {
    color: COLORS.white,
  },

  // Body
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 40,
  },

  // List header (stats + banners)
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },

  // Stats Bar
  statsBar: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.oceanMid,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    letterSpacing: 0.5,
    fontWeight: '500',
  },

  // Banners
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(196,151,42,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  offlineBannerText: {
    fontSize: 12,
    color: COLORS.sandMid,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(220,38,38,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  retryText: {
    fontSize: 12,
    color: COLORS.oceanMid,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Query Card
  queryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.oceanMid,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 0,
  },
  queryCardExpanded: {
    shadowOpacity: 0.1,
    shadowRadius: 12,
    ...shadow(0),
  },
  queryCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  querySubject: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 21,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  queryMessage: {
    fontSize: 13,
    color: COLORS.textMid,
    lineHeight: 20,
    marginBottom: 12,
  },

  // Admin Reply
  adminReply: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderStyle: 'dashed',
  },
  replyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  replyIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.oceanFoam,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyIconText: {
    fontSize: 12,
  },
  replyLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.oceanMid,
  },
  replyContent: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.oceanMid,
    padding: 12,
    borderRadius: 8,
  },
  replyContentText: {
    fontSize: 13,
    color: COLORS.textDark,
    lineHeight: 21,
  },
  replyMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  replyMetaText: {
    fontSize: 11,
    color: COLORS.textLight,
  },

  // Card Footer
  queryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: 4,
  },
  queryMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  queryMetaText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  eyeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeBtnActive: {
    backgroundColor: COLORS.oceanMid,
  },
  eyeIcon: {
    fontSize: 15,
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  skeletonLine: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  skeletonTitle: {
    height: 16,
    width: '65%',
  },
  skeletonBadge: {
    height: 22,
    width: '22%',
    borderRadius: 50,
  },
  skeletonText: {
    height: 12,
    width: '100%',
    marginBottom: 6,
  },
  skeletonFooter: {
    height: 12,
    width: '35%',
    marginTop: 12,
  },

  // Load more / Empty
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  listEnd: {
    height: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
}));

// ─── Redux ────────────────────────────────────────────────────────────────────

const mapStateToProps = state => ({
  access_token: state.commonState.access_token,
  mode: state.commonState.mode,
  isLoading: state.commonState.isLoading,
});

const mapDispatchToProps = dispatch => ({
  setLoader: data => dispatch(setLoader(data)),
  setMode: data => dispatch(setMode(data)),
});

const guestSt = StyleSheet.create(scaleFontSizes({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {fontSize: 34},
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D3D4A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#1B6B7B',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#78716C',
  },
}));

export default connect(mapStateToProps, mapDispatchToProps)(QueriesList);
