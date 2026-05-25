import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {FTP_PATH} from '@env';
import {useTranslation} from 'react-i18next';
import {useAppDialog} from '../Components/Common/AppDialog';
import {backPage} from '../Services/CommonMethods';
import {comnPost} from '../Services/Api/CommonServices';
import {isVendorUser} from '../Components/Common/GuestGateModal';
import STRING from '../Services/Constants/STRINGS';


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
  pending:  {label: 'Under Review', color: '#D97706', bg: '#FEF3C7', icon: 'time-outline'},
  approved: {label: 'Live',         color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline'},
  rejected: {label: 'Rejected',     color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline'},
};

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────

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
    <View style={sk.image} />
    <View style={sk.body}>
      <View style={sk.line} />
      <View style={sk.lineSm} />
      <View style={sk.row}>
        <View style={sk.badge} />
        <View style={sk.badge} />
      </View>
    </View>
  </Animated.View>
);

const SkeletonList = () => {
  const opacity = useShimmer();
  return (
    <>
      {Array.from({length: 3}).map((_, i) => (
        <SkeletonCard key={i} opacity={opacity} />
      ))}
    </>
  );
};

const sk = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  image: {width: '100%', height: 160, backgroundColor: '#E5E7EB'},
  body: {padding: 14, gap: 8},
  line: {height: 18, width: '65%', backgroundColor: '#E5E7EB', borderRadius: 8},
  lineSm: {height: 13, width: '45%', backgroundColor: '#F3F4F6', borderRadius: 6},
  row: {flexDirection: 'row', gap: 8},
  badge: {height: 24, width: 80, backgroundColor: '#F3F4F6', borderRadius: 12},
});

// ─── MySubmissionsScreen ──────────────────────────────────────────────────────

const MySubmissionsScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {show: showDialog, dialog} = useAppDialog();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorGateVisible, setVendorGateVisible] = useState(false);

  const handleAddSite = async () => {
    if (await isVendorUser()) {
      navigation.navigate(STRING.SCREEN.SUBMIT_PLACE);
    } else {
      setVendorGateVisible(true);
    }
  };

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
    showDialog({
      type: 'delete',
      title: t('MY_SUBMISSIONS.DELETE_TITLE'),
      message: t('MY_SUBMISSIONS.DELETE_MSG'),
      confirmText: t('MY_SUBMISSIONS.DELETE_BTN'),
      cancelText: t('BUTTON.CANCEL'),
      onConfirm: async () => {
        const res = await comnPost('v2/deleteMySubmission', {id}).catch(() => null);
        if (res?.data?.success) {
          setSubmissions(prev => prev.filter(s => s.id !== id));
        } else {
          showDialog({type: 'error', title: t('ALERT.FAILED'), message: t('MY_SUBMISSIONS.DELETE_ERROR')});
        }
      },
    });
  };

  const renderItem = ({item}) => {
    const st = item.submission_status || 'pending';
    const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.pending;
    const isApproved = st === 'approved';
    const editLabel = isApproved ? t('MY_SUBMISSIONS.EDIT') : t('MY_SUBMISSIONS.EDIT_RESUBMIT');

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate(STRING.SCREEN.SITE_DETAIL, {city: item})}>

        {/* ── Cover image ── */}
        <View style={s.imageWrap}>
          {item.image ? (
            <Image
              source={{uri: `${FTP_PATH}${item.image}`}}
              style={s.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={s.imageFallback}>
              <Ionicons name="business-outline" size={44} color="rgba(255,255,255,0.5)" />
            </View>
          )}

          {/* Gradient overlay at bottom of image */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={s.imageGradient}
            pointerEvents="none"
          />

          {/* Status badge on image */}
          <View style={[s.statusBadge, {backgroundColor: cfg.bg}]}>
            <Ionicons name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[s.statusBadgeText, {color: cfg.color}]}>{cfg.label}</Text>
          </View>

          {/* Tap hint */}
          <View style={s.tapHint} pointerEvents="none">
            <Ionicons name="eye-outline" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={s.tapHintText}>View Details</Text>
          </View>
        </View>

        {/* ── Card body ── */}
        <View style={s.cardBody}>
          <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>

          {/* Metadata row */}
          <View style={s.metaRow}>
            {!!item.taluka && (
              <View style={s.metaChip}>
                <Ionicons name="location-outline" size={12} color={C.textLight} />
                <Text style={s.metaChipText}>{item.taluka}</Text>
              </View>
            )}
            {!!item.category?.name && (
              <View style={s.metaChip}>
                <Ionicons name="pricetag-outline" size={12} color={C.textLight} />
                <Text style={s.metaChipText}>{item.category.name}</Text>
              </View>
            )}
          </View>

          {/* Rejection reason */}
          {!!item.rejection_reason && (
            <View style={s.rejectionBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
              <Text style={s.rejectionText} numberOfLines={2}>{item.rejection_reason}</Text>
            </View>
          )}

          {/* ── Actions ── */}
          <View style={s.actions}>
            <TouchableOpacity
              style={s.editBtn}
              onPress={e => {
                e.stopPropagation?.();
                navigation.navigate(STRING.SCREEN.SUBMIT_PLACE, {editSubmission: item});
              }}
              activeOpacity={0.85}>
              <Ionicons name="pencil-outline" size={14} color={C.white} />
              <Text style={s.editBtnText}>{editLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.deleteBtn}
              onPress={e => {
                e.stopPropagation?.();
                confirmDelete(item.id);
              }}
              activeOpacity={0.85}>
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={s.emptyWrap}>
      <Text style={s.emptyIcon}>🏨</Text>
      <Text style={s.emptyTitle}>{t('MY_SUBMISSIONS.NO_SUBMISSIONS')}</Text>
      <Text style={s.emptyText}>{t('MY_SUBMISSIONS.NO_SUBMISSIONS_SUB')}</Text>
      <TouchableOpacity
        style={s.submitCta}
        onPress={handleAddSite}
        activeOpacity={0.85}>
        <Text style={s.submitCtaText}>{t('MY_SUBMISSIONS.SUBMIT_CTA')}</Text>
      </TouchableOpacity>
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
          <Text style={s.headerTitle}>{t('MY_SUBMISSIONS.TITLE')}</Text>
          <TouchableOpacity
            style={s.addBtn}
            onPress={handleAddSite}
            activeOpacity={0.85}>
            <Ionicons name="add" size={18} color={C.white} />
            <Text style={s.addBtnText}>{t('MY_SUBMISSIONS.ADD')}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {/* ── Count pill (when loaded) ── */}
      {!loading && submissions.length > 0 && (
        <View style={s.countRow}>
          <Text style={s.countText}>{submissions.length} site{submissions.length !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* ── List ── */}
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
      {dialog}

      {/* Vendor Gate Modal */}
      <Modal
        visible={vendorGateVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVendorGateVisible(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setVendorGateVisible(false)}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            <View style={s.modalIconWrap}>
              <Text style={s.modalIcon}>🏪</Text>
            </View>
            <Text style={s.modalTitle}>{t('VENDOR.NOT_VENDOR_TITLE')}</Text>
            <Text style={s.modalMsg}>{t('VENDOR.NOT_VENDOR_MSG')}</Text>
            <TouchableOpacity
              style={s.modalPrimaryBtn}
              onPress={() => {
                setVendorGateVisible(false);
                navigation.navigate(STRING.SCREEN.PROFILE_VIEW);
              }}
              activeOpacity={0.85}>
              <Text style={s.modalPrimaryText}>{t('VENDOR.REQUEST_ACCESS')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modalSecondaryBtn}
              onPress={() => setVendorGateVisible(false)}
              activeOpacity={0.7}>
              <Text style={s.modalSecondaryText}>{t('VENDOR.MAYBE_LATER')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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

  // Count
  countRow: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // List
  list: {flex: 1},
  listContent: {paddingTop: 10, paddingHorizontal: 20},
  emptyContainer: {flex: 1},

  // Card
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },

  // Cover image
  imageWrap: {
    width: '100%',
    height: 170,
    position: 'relative',
    backgroundColor: '#C8D6D9',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: `${C.oceanDeep}CC`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {fontSize: 12, fontWeight: '700'},
  tapHint: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapHintText: {fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)'},

  // Card body
  cardBody: {padding: 14, gap: 10},
  cardName: {fontSize: 17, fontWeight: '800', color: C.textDark, letterSpacing: 0.1},

  // Meta chips
  metaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaChipText: {fontSize: 12, color: C.textLight, fontWeight: '500'},

  // Rejection
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  rejectionText: {flex: 1, fontSize: 12, color: '#DC2626', lineHeight: 18},

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.oceanMid,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  editBtnText: {fontSize: 13, fontWeight: '700', color: C.white},
  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
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

  // Vendor gate modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: C.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalIcon: {fontSize: 32},
  modalTitle: {fontSize: 17, fontWeight: '700', color: C.oceanDeep, marginBottom: 8, textAlign: 'center'},
  modalMsg: {fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 19, marginBottom: 22},
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: C.oceanMid,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryText: {fontSize: 14, fontWeight: '700', color: C.white},
  modalSecondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSecondaryText: {fontSize: 13, color: C.textLight},
});

export default MySubmissionsScreen;
