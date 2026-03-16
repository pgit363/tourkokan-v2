import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useFocusEffect} from '@react-navigation/native';
import {getFromStorage} from '../../Services/Api/CommonServices';
import {setLoader, setMode, setSource, setDestination} from '../../Reducers/CommonActions';
import {backPage, checkLogin, goBackHandler, navigateTo} from '../../Services/CommonMethods';
import Banner from '../../Components/Customs/Banner';
import MSRTCSearchPanel from '../../Components/Common/MSRTCSearchPanel';

// ─── Constants ────────────────────────────────────────────────────────────────

const RECENT_KEY = 'recent_routes';
const MAX_RECENT = 5;
const {width: SW} = Dimensions.get('window');
const BANNER_H = Math.round(SW / 3);
// Tab bar height (PILL_H 64 + FAB_SIZE/2 32 + FAB_LIFT 8)
const TAB_BAR_H = 104;

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanFoam: '#B8E4EA',
  forestDeep: '#1A3320',
  cream: '#FAF7F0',
  sandMid: '#C4972A',
  sandPale: '#FBF3DC',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
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
  return anim.interpolate({inputRange: [0, 1], outputRange: [0.35, 0.8]});
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => {
  const opacity = useShimmer();
  return (
    <Animated.View style={[sk.card, {opacity}]}>
      <View style={sk.fieldFull} />
      <View style={sk.gap} />
      <View style={sk.fieldFull} />
      <View style={sk.searchBtn} />
    </Animated.View>
  );
};

const sk = StyleSheet.create({
  card: {backgroundColor: C.white, borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: -8},
  fieldFull: {height: 52, backgroundColor: '#F3F4F6', borderRadius: 12, marginBottom: 4},
  gap: {height: 32},
  searchBtn: {height: 52, backgroundColor: '#E5E7EB', borderRadius: 50, marginTop: 16},
});

// ─── Ad Banner (same style as HomeScreen middle) ──────────────────────────────

const AdBanner = ({bannerImages}) => (
  <View style={s.adBannerWrap}>
    <View style={s.adLabelBadge}>
      <Text style={s.adLabelText}>Premium Ad</Text>
    </View>
    {bannerImages?.length > 0 ? (
      <Banner
        bannerImages={bannerImages}
        style={{height: BANNER_H, borderRadius: 16, overflow: 'hidden'}}
      />
    ) : (
      <View style={s.adPlaceholder}>
        <Text style={s.adIcon}>📢</Text>
        <Text style={s.adText}>Ad Space Available</Text>
        <Text style={s.adSize}>340×160px · Click to advertise</Text>
      </View>
    )}
  </View>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const MSRTCSearch = ({navigation, route, ...props}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  const [recentRoutes, setRecentRoutes] = useState([]);
  const [bannerObject, setBannerObject] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Extra padding so last item clears the tab bar
  const scrollPadBottom = TAB_BAR_H + bottomPad + 16;

  // ── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    checkLogin(navigation);
    const backHandler = goBackHandler(navigation);

    const init = async () => {
      await loadBanner();
      setIsLoading(false);
    };
    init();

    return () => backHandler.remove();
  }, []);

  // Reload every time the tab/screen comes into focus (e.g. back from AllRoutesSearch)
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(RECENT_KEY)
        .then(raw => setRecentRoutes(raw ? JSON.parse(raw).slice(0, MAX_RECENT) : []))
        .catch(() => {});
    }, []),
  );

  const loadBanner = async () => {
    try {
      const landingData = await getFromStorage(t('STORAGE.LANDING_RESPONSE'));
      if (landingData) {
        const parsed = JSON.parse(landingData);
        if (parsed?.banners) setBannerObject(parsed.banners);
      }
    } catch {}
  };

  const clearRecentRoutes = async () => {
    await AsyncStorage.removeItem(RECENT_KEY);
    setRecentRoutes([]);
  };

  // ── Recent route tap — pre-fill Redux source/destination ──────────────────

  const handleRecentTap = item => {
    props.setSource({id: item.sourceId, name: item.sourceName});
    props.setDestination({id: item.destId, name: item.destName});
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 12}]}>

        <TouchableOpacity
          style={s.backBtn}
          onPress={() => backPage(navigation)}
          activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>

        <View style={s.headerContent}>
          <View style={s.headerLogoWrap}>
            <View style={s.headerLogoBg} />
            <Image
              source={require('../../Assets/Images/Bus1_png_high.png')}
              style={s.headerBusIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={s.headerTitle}>{t('MSRTC_SCREEN.TITLE')}</Text>
          <Text style={s.headerSubtitle}>{t('MSRTC_SCREEN.SUBTITLE')}</Text>
        </View>

        {/* Curved bottom of header */}
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, {paddingBottom: scrollPadBottom}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {isLoading ? (
          <SkeletonCard />
        ) : (
          <>
            {/* ── Search panel (new component) ── */}
            <MSRTCSearchPanel navigation={navigation} />

            {/* ── Recent Routes ── */}
            {recentRoutes.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeaderRow}>
                  <Text style={s.sectionTitle}>{t('MSRTC_SCREEN.RECENT_TITLE')}</Text>
                  <TouchableOpacity
                    onPress={clearRecentRoutes}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Text style={s.clearAll}>{t('MSRTC_SCREEN.CLEAR_ALL')}</Text>
                  </TouchableOpacity>
                </View>

                {recentRoutes.map((r, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.recentItem}
                    onPress={() => handleRecentTap(r)}
                    activeOpacity={0.75}>
                    <View style={s.recentIconCircle}>
                      <Ionicons name="time-outline" size={20} color={C.oceanMid} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={s.recentRoute} numberOfLines={1}>
                        {r.sourceName} → {r.destName}
                      </Text>
                      <Text style={s.recentTime}>
                        {new Date(r.ts).toLocaleDateString()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={C.textLight} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── Ad Banner at end of scroll content ── */}
            <View style={s.bannerWrap}>
              <AdBanner bannerImages={bannerObject?.ROUTE_LIST_FOOTER} />
            </View>
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
    paddingBottom: 36,
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
    marginBottom: 16,
  },
  headerContent: {alignItems: 'center'},
  headerLogoWrap: {
    width: 109,
    height: 109,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerLogoBg: {
    position: 'absolute',
    width: 109,
    height: 109,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerBusIcon: {width: 77, height: 77},
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: C.white,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.oceanFoam,
    opacity: 0.9,
  },
  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: C.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // Scroll
  scroll: {flex: 1},
  scrollContent: {},

  // Sections
  section: {paddingHorizontal: 20, marginTop: 28},
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAll: {fontSize: 12, color: C.oceanMid, fontWeight: '600'},

  // Recent item
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  recentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(27,107,123,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentRoute: {fontSize: 14, fontWeight: '600', color: C.textDark, marginBottom: 2},
  recentTime: {fontSize: 11, color: C.textLight},

  // Banner at end of scroll
  bannerWrap: {
    marginHorizontal: 20,
    marginTop: 28,
  },

  // Ad Banner — same style as HomeScreen AdBanner
  adBannerWrap: {
    backgroundColor: C.sandPale,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: C.sandMid,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 100,
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
  adLabelText: {fontSize: 10, fontWeight: '700', color: C.white, textTransform: 'uppercase', letterSpacing: 0.6},
  adPlaceholder: {
    padding: 26,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  adIcon: {fontSize: 26, marginBottom: 6},
  adText: {fontSize: 13, fontWeight: '500', color: C.textMid, marginBottom: 3, textAlign: 'center'},
  adSize: {fontSize: 11, color: C.textLight, textAlign: 'center'},
});

// ─── Redux ─────────────────────────────────────────────────────────────────────

const mapStateToProps = state => ({
  source: state.commonState.source,
  destination: state.commonState.destination,
  mode: state.commonState.mode,
});

const mapDispatchToProps = dispatch => ({
  setLoader: data => dispatch(setLoader(data)),
  setMode: data => dispatch(setMode(data)),
  setSource: data => dispatch(setSource(data)),
  setDestination: data => dispatch(setDestination(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(MSRTCSearch);
