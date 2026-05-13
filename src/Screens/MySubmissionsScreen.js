import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {FTP_PATH} from '@env';
import {backPage} from '../Services/CommonMethods';
import {comnPost} from '../Services/Api/CommonServices';
import STRING from '../Services/Constants/STRINGS';

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

const STATUS_CONFIG = {
  pending:  {label: 'Under Review', color: '#D97706', bg: '#FEF3C7'},
  approved: {label: 'Live',         color: '#059669', bg: '#D1FAE5'},
  rejected: {label: 'Rejected',     color: '#DC2626', bg: '#FEE2E2'},
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
      <View style={sk.thumb} />
      <View style={sk.body}>
        <View style={sk.line} />
        <View style={sk.lineSm} />
        <View style={sk.badge} />
      </View>
    </View>
  </Animated.View>
);

const SkeletonList = () => {
  const opacity = useShimmer();
  return (
    <>
      {Array.from({length: 4}).map((_, i) => (
        <SkeletonCard key={i} opacity={opacity} />
      ))}
    </>
  );
};

const sk = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  row: {flexDirection: 'row', gap: 12},
  thumb: {width: 72, height: 72, borderRadius: 12, backgroundColor: '#E5E7EB'},
  body: {flex: 1, gap: 8, justifyContent: 'center'},
  line: {height: 16, width: '70%', backgroundColor: '#E5E7EB', borderRadius: 7},
  lineSm: {height: 12, width: '50%', backgroundColor: '#F3F4F6', borderRadius: 6},
  badge: {height: 22, width: 90, backgroundColor: '#F3F4F6', borderRadius: 11},
});

// ─── MySubmissionsScreen ──────────────────────────────────────────────────────

const MySubmissionsScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(() => {
    setLoading(true);
    comnPost('v2/mySubmissions', {per_page: 50})
      .then(res => {
        setSubmissions(res?.data?.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useFocusEffect(fetchSubmissions);

  const confirmDelete = id => {
    Alert.alert(
      'Delete Submission',
      'Are you sure you want to delete this submission?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await comnPost('v2/deleteMySubmission', {id}).catch(() => null);
            if (res?.data?.success) {
              setSubmissions(prev => prev.filter(s => s.id !== id));
            } else {
              Alert.alert('Error', 'Could not delete. Please try again.');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({item}) => {
    const st = item.submission_status || 'pending';
    const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.pending;
    const canEdit = st === 'pending' || st === 'rejected';

    return (
      <View style={s.card}>
        <View style={s.cardRow}>
          {item.image ? (
            <Image source={{uri: `${FTP_PATH}${item.image}`}} style={s.thumb} />
          ) : (
            <View style={[s.thumb, s.thumbFallback]}>
              <Ionicons name="business-outline" size={26} color={C.textLight} />
            </View>
          )}
          <View style={s.cardBody}>
            <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
            <View style={[s.badge, {backgroundColor: cfg.bg}]}>
              <View style={[s.badgeDot, {backgroundColor: cfg.color}]} />
              <Text style={[s.badgeText, {color: cfg.color}]}>{cfg.label}</Text>
            </View>
            {item.rejection_reason ? (
              <Text style={s.rejectionText} numberOfLines={2}>
                {item.rejection_reason}
              </Text>
            ) : null}
          </View>
        </View>

        {canEdit && (
          <View style={s.actions}>
            <TouchableOpacity
              style={s.editBtn}
              onPress={() =>
                navigation.navigate(STRING.SCREEN.SUBMIT_PLACE, {editSubmission: item})
              }
              activeOpacity={0.85}>
              <Ionicons name="pencil-outline" size={14} color={C.oceanMid} />
              <Text style={s.editBtnText}>Edit & Resubmit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => confirmDelete(item.id)}
              activeOpacity={0.85}>
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={s.emptyWrap}>
      <Text style={s.emptyIcon}>🏨</Text>
      <Text style={s.emptyTitle}>No submissions yet</Text>
      <Text style={s.emptyText}>Submit your hotel, restaurant, or homestay for review.</Text>
      <TouchableOpacity
        style={s.submitCta}
        onPress={() => navigation.navigate(STRING.SCREEN.SUBMIT_PLACE)}
        activeOpacity={0.85}>
        <Text style={s.submitCtaText}>Submit Your Place</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

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
          <Text style={s.headerTitle}>My Sites</Text>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => navigation.navigate(STRING.SCREEN.SUBMIT_PLACE)}
            activeOpacity={0.85}>
            <Ionicons name="add" size={18} color={C.white} />
            <Text style={s.addBtnText}>Add</Text>
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
            submissions.length === 0 && s.emptyContainer,
          ]}
          data={submissions}
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

const s = StyleSheet.create({
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addBtnText: {fontSize: 13, fontWeight: '600', color: C.white},
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  cardRow: {flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 12,
    resizeMode: 'cover',
    flexShrink: 0,
  },
  thumbFallback: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {flex: 1, gap: 7},
  cardName: {fontSize: 15, fontWeight: '700', color: C.textDark},
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDot: {width: 6, height: 6, borderRadius: 3},
  badgeText: {fontSize: 12, fontWeight: '700'},
  rejectionText: {fontSize: 12, color: '#DC2626', lineHeight: 17},

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.oceanMid,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  editBtnText: {fontSize: 13, fontWeight: '600', color: C.oceanMid},
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  emptyIcon: {fontSize: 52, opacity: 0.4, marginBottom: 4},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: C.textMid},
  emptyText: {fontSize: 13, color: C.textLight, textAlign: 'center'},
  submitCta: {
    marginTop: 8,
    backgroundColor: C.oceanMid,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  submitCtaText: {fontSize: 14, fontWeight: '700', color: C.white},
});

export default MySubmissionsScreen;
