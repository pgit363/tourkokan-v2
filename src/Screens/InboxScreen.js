import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {backPage} from '../Services/CommonMethods';
import {comnPost, getFromStorage} from '../Services/Api/CommonServices';
import STRING from '../Services/Constants/STRINGS';
import {createLogger} from '../Services/Logger';
import {scaleFontSizes} from '../Services/responsive';

const log = createLogger('InboxScreen');

const {width: SW} = Dimensions.get('window');

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  forestDeep: '#1A3320',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
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
    <View style={sk.row}>
      <View style={sk.icon} />
      <View style={sk.body}>
        <View style={sk.line} />
        <View style={sk.lineSm} />
      </View>
    </View>
  </Animated.View>
);

const SkeletonList = () => {
  const opacity = useShimmer();
  return (
    <>
      {Array.from({length: 6}).map((_, i) => (
        <SkeletonCard key={i} opacity={opacity} />
      ))}
    </>
  );
};

const sk = StyleSheet.create(scaleFontSizes({
  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  icon: {width: 38, height: 38, borderRadius: 19, backgroundColor: '#E5E7EB'},
  body: {flex: 1, gap: 8},
  line: {height: 14, width: '70%', backgroundColor: '#E5E7EB', borderRadius: 6},
  lineSm: {height: 11, width: '45%', backgroundColor: '#F3F4F6', borderRadius: 6},
}));

// ─── InboxScreen ──────────────────────────────────────────────────────────────

const InboxScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchMessages = useCallback(async () => {
    // Restrict the API call in offline mode (the bell already gates entry; this
    // is a safety net so myMessages never fires when mode is offline).
    const storedMode = JSON.parse((await getFromStorage(STRING.STORAGE.MODE)) ?? 'true');
    if (!storedMode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    comnPost('v2/myMessages', {per_page: 50})
      .then(res => {
        setMessages(res?.data?.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const openMessage = async item => {
    const nowExpanded = expandedId === item.id ? null : item.id;
    setExpandedId(nowExpanded);
    if (nowExpanded && !item.is_read) {
      setReadingId(item.id);
      try {
        await comnPost('v2/readMessage', {id: item.id});
        setMessages(prev =>
          prev.map(m => (m.id === item.id ? {...m, is_read: true} : m)),
        );
      } catch (e) { log.warn("[caught]", e); }
      setReadingId(null);
    }
  };

  const formatDate = iso => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderItem = ({item}) => {
    const isExpanded = expandedId === item.id;
    const isUnread = !item.is_read;

    return (
      <TouchableOpacity
        style={[s.card, isUnread && s.cardUnread]}
        onPress={() => openMessage(item)}
        activeOpacity={0.85}>
        <View style={s.cardTop}>
          <View style={[s.iconWrap, isUnread && s.iconWrapUnread]}>
            <Ionicons
              name={isUnread ? 'mail-unread' : 'mail-open-outline'}
              size={20}
              color={isUnread ? C.white : C.textLight}
            />
          </View>
          <View style={s.cardMeta}>
            <Text
              style={[s.subject, isUnread && s.subjectUnread]}
              numberOfLines={isExpanded ? undefined : 1}>
              {item.subject || 'Message from Admin'}
            </Text>
            <Text style={s.date}>{formatDate(item.created_at)}</Text>
          </View>
          {readingId === item.id ? (
            <ActivityIndicator size="small" color={C.oceanMid} />
          ) : (
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={C.textLight}
            />
          )}
        </View>
        {isExpanded && (
          <Text style={s.messageBody}>{item.message}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={s.emptyWrap}>
      <Text style={s.emptyIcon}>📭</Text>
      <Text style={s.emptyTitle}>No messages yet</Text>
      <Text style={s.emptyText}>Admin messages will appear here.</Text>
    </View>
  );

  return (
    <View style={s.root}>
      <SystemBars style="light" />

      {/* Header */}
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
          <Text style={s.headerTitle}>Inbox</Text>
          <TouchableOpacity
            style={s.refreshBtn}
            onPress={fetchMessages}
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="refresh" size={20} color={C.white} />
          </TouchableOpacity>
        </View>
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {/* List */}
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
          contentContainerStyle={[
            s.listContent,
            messages.length === 0 && s.emptyContainer,
          ]}
          data={messages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{height: insets.bottom + 24}} />}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create(scaleFontSizes({
  root: {flex: 1, backgroundColor: C.cream},

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
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
  listContent: {paddingTop: 8, paddingHorizontal: 20},
  emptyContainer: {flex: 1},

  // Card
  card: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  cardUnread: {
    backgroundColor: '#EEF6FF',
    borderColor: '#B8D8E8',
  },
  cardTop: {flexDirection: 'row', alignItems: 'center', gap: 12},
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapUnread: {backgroundColor: C.oceanMid},
  cardMeta: {flex: 1},
  subject: {fontSize: 14, color: C.textMid, lineHeight: 19},
  subjectUnread: {fontWeight: '700', color: C.textDark},
  date: {fontSize: 11, color: C.textLight, marginTop: 2},
  messageBody: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },

  // Empty
  emptyWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10},
  emptyIcon: {fontSize: 52, opacity: 0.4, marginBottom: 4},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: C.textMid},
  emptyText: {fontSize: 13, color: C.textLight},
}));

export default InboxScreen;
