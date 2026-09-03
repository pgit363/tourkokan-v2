import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
  useWindowDimensions,
  Platform,
  BackHandler,
  StyleSheet,
  Linking,
  Share,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MapView, {Marker} from 'react-native-maps';
import {mapProvider} from '../../Services/mapProvider';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isGuestUser} from '../../Components/Common/GuestGateModal';
import NetInfo from '@react-native-community/netinfo';
import StarRating from 'react-native-star-rating-widget';
import {AWS_URL} from '@env';
import CachedImage from '../../Components/Customs/CachedImage';

import {comnPost, getFromStorage} from '../../Services/Api/CommonServices';
import {useConnectivityGate} from '../../Components/Common/useConnectivityGate';
import {navigateTo} from '../../Services/CommonMethods';
import {useFavourite, seedFavourites, FAV} from '../../Services/favourites';
import {
  themeForCategories, tint, detailPolicy, categoryLabels,
} from '../../Services/categoryTheme';
import CategoryArt from '../../Components/Common/CategoryArt';
import {useDetailMetrics} from '../../Components/Detail/useDetailMetrics';
import {
  SectionHead, FactsGrid, QuickStrip, Block, BlockText, MoreToggle,
  Callout, ListRow, CardRail, TCard, FilterChips, EventRow, BusRow,
  GalleryGrid, ReviewRow, EmptyState,
} from '../../Components/Detail/DetailKit';
import {productsBySite} from '../../Services/Api/MarketplaceServices';
import {productCoverUri, productPrice, unitSuffix} from '../../Services/marketplace';
import STRING from '../../Services/Constants/STRINGS';
import Banner, {footerBannerHeight} from '../../Components/Customs/Banner';
import Popup from '../../Components/Common/Popup';
import BottomSheet from '../../Components/Customs/BottomSheet';
import CommentsSheet from '../../Components/Common/CommentsSheet';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {createLogger} from '../../Services/Logger';

const log = createLogger('SiteDetailPage');


// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  oceanDeep: '#0D3D4A', oceanMid: '#1B6B7B', oceanFoam: '#B8E4EA',
  sandMid: '#C4972A', sandPale: '#FBF3DC',
  cream: '#FAF7F0', white: '#FFFFFF', wa: '#25D366',
  textDark: '#1C1917', textMid: '#44403C', textLight: '#78716C',
};
const RADIUS = 18;
const money = n => (n == null ? '' : '₹' + Number(n).toLocaleString('en-IN'));

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

// ─── Ad Banner (matches HomeScreen AdBanner component) ────────────────────────
const AdBanner = ({bannerImages, label, width, minHeight}) => {
  const {width: winW} = useWindowDimensions();
  // Caller passes the live content width; fall back to the old 16dp gutters.
  const bannerW = width || winW - 32;
  return (
    <View style={st.adBannerWrap}>
      <View style={st.adLabelBadge}>
        <Text style={st.adLabelText}>{label || 'Ad'}</Text>
      </View>
      {bannerImages?.length > 0 ? (
        <Banner
          bannerImages={bannerImages}
          width={bannerW}
          minHeight={minHeight}
          style={{borderRadius: RADIUS - 2, overflow: 'hidden'}}
        />
      ) : (
        <View style={st.adPlaceholder}>
          <Text style={st.adIcon}>📢</Text>
          <Text style={st.adText}>Ad Space Available</Text>
        </View>
      )}
    </View>
  );
};

// ─── Skeleton components ──────────────────────────────────────────────────────
const SkLine = ({w, h = 12, style, opacity}) => (
  <Animated.View
    style={[
      {height: h, borderRadius: h / 2, backgroundColor: '#D1E8EC', width: w || '100%'},
      style, {opacity},
    ]}
  />
);
const SkeletonHero = ({height}) => {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[st.heroWrap, height && {height}, {backgroundColor: '#C4D9E0', opacity}]}>
      <View style={st.heroPlaceholder}><Text style={{fontSize: 60, opacity: 0.3}}>🛕</Text></View>
    </Animated.View>
  );
};
const SkeletonInfo = () => {
  const opacity = useShimmer();
  return (
    <View style={{padding: 20, gap: 10}}>
      <SkLine w="40%" h={10} opacity={opacity} />
      <SkLine w="75%" h={22} style={{marginTop: 4}} opacity={opacity} />
      <SkLine w="85%" h={14} style={{marginTop: 6}} opacity={opacity} />
      <SkLine w="50%" h={12} style={{marginTop: 2}} opacity={opacity} />
    </View>
  );
};
const SkeletonContent = () => {
  const opacity = useShimmer();
  return (
    <View style={{padding: 16, gap: 12}}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <SkLine key={i} w={i % 3 === 2 ? '65%' : '100%'} h={13} opacity={opacity} />
      ))}
    </View>
  );
};
const SkeletonAdBanner = () => {
  const opacity = useShimmer();
  return (
    <Animated.View style={[{
      backgroundColor: '#E4F2F4', borderRadius: 18, minHeight: 120,
    }, {opacity}]} />
  );
};
// ─── Main component ───────────────────────────────────────────────────────────
const SiteDetailPage = ({navigation, route}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  // Live responsive metrics: every size below is derived from the CURRENT
  // window, so rotation, a fold opening and split-screen all re-lay-out.
  const m = useDetailMetrics();
  const {heroH, gutter} = m;
  const refRBSheet = useRef();

  const [city, setCity] = useState(route.params?.city || {});
  const {isFav, pending: favPending, toggle: toggleFav} = useFavourite(
    FAV.SITE,
    route.params?.city?.id,
    route.params?.city,
  );
  // Per-category visual theme (accent/deep/kind) — drives the hero wash,
  // badges, section dots and CTAs so a Temple reads saffron, a Beach aqua, etc.
  const theme = useMemo(
    () => themeForCategories(city?.categories),
    [city?.categories],
  );
  // The kind decides WHICH sections render and in WHAT order (see detailPolicy):
  // discovery = destination, vendor = business, civic = govt/school.
  const policy = useMemo(() => detailPolicy(theme.kind), [theme.kind]);
  const catLabels = useMemo(() => categoryLabels(city?.categories), [city?.categories]);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [bannerObject, setBannerObject] = useState({});
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);
  const [trendingGroup, setTrendingGroup] = useState(null);
  const [offerings, setOfferings] = useState([]);   // vendor: menu / rooms / packages
  const [events, setEvents] = useState([]);         // upcoming events near this site
  const [userRating, setUserRating] = useState(0);
  const [isGuestPopup, setIsGuestPopup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {modal: connectivityModal, ensureOnline} = useConnectivityGate();

  // ── Back handler ─────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.goBack();
        return true;
      });
      return () => handler.remove();
    }, [navigation]),
  );

  // ── Init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => setOffline(!state.isConnected));
    loadBanners();
    fetchFreshData();
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Vendor offerings (menu / rooms / packages) — real marketplace products ────
  // Only businesses have a catalog; discovery + civic listings skip the call.
  useEffect(() => {
    let alive = true;
    if (!policy.offerings || !city?.id) { setOfferings([]); return; }
    productsBySite(city.id, 1)
      .then(res => {
        const rows = res?.data?.data?.data || res?.data?.data || [];
        if (alive && Array.isArray(rows)) setOfferings(rows.slice(0, 4));
      })
      .catch(e => log.warn('[offerings]', e));
    return () => { alive = false; };
  }, [policy.offerings, city?.id]);

  // ── Events near this site ────────────────────────────────────────────────────
  // listEvents has no per-site filter yet, so ask for the taluka's upcoming
  // events (site_id is sent too, forward-compatible) and prefer this site's own.
  useEffect(() => {
    let alive = true;
    const id = city?.id;
    const taluka = city?.site?.name || city?.name;
    if (!id) return;
    const payload = {upcoming: true, site_id: id};
    if (taluka) payload.taluka = taluka;
    comnPost('v2/listEvents', payload)
      .then(res => {
        const rows = res?.data?.data?.data || res?.data?.data || [];
        if (!alive || !Array.isArray(rows)) return;
        const mine = rows.filter(e => String(e?.site_id) === String(id));
        setEvents((mine.length ? mine : rows).slice(0, 3));
      })
      .catch(e => log.warn('[events]', e));
    return () => { alive = false; };
  }, [city?.id, city?.site?.name, city?.name]);

  const loadBanners = async () => {
    try {
      const raw = await getFromStorage(t('STORAGE.LANDING_RESPONSE'));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.banners) setBannerObject(parsed.banners);
      }
    } catch (e) { log.warn("[caught]", e); }
  };

  const fetchFreshData = async () => {
    try {
      const storedMode = JSON.parse(await getFromStorage(STRING.STORAGE.MODE));
      if (!storedMode) return;
      const net = await NetInfo.fetch();
      if (!net.isConnected) return;
      const id = route.params?.city?.id;
      if (!id) return;
      setIsLoading(true);
      const fetchedAt = Date.now();
      const res = await comnPost('v2/getSite', {id});
      if (res?.data?.data) {
        const fresh = res.data.data;
        setCity(fresh);
        // Server truth re-seeds the shared store (a local toggle made while this
        // request was in flight still wins — see seedFavourites).
        seedFavourites(fresh, FAV.SITE, fetchedAt);
        setUserRating(parseFloat(fresh.rating_avg_rate) || 0);
        await AsyncStorage.setItem(`siteDetail_${id}`, JSON.stringify(fresh));
      }
    } catch (e) { log.warn("[caught]", e); } finally {
      setIsLoading(false);
    }
  };

  // ── Pull-to-refresh ──────────────────────────────────────────────────────────
  // Connectivity guard per docs/offline-mode-connectivity-guard.md: only fetch
  // when connected AND in online mode; otherwise tell the user why.
  const onRefresh = () =>
    ensureOnline(async () => {
      setRefreshing(true);
      await fetchFreshData();
      setRefreshing(false);
    });

  // ── Guest helper ─────────────────────────────────────────────────────────────
  const handleGuestLogin = async () => {
    setIsGuestPopup(false);
    await AsyncStorage.clear();
    navigation.reset({index: 0, routes: [{name: STRING.SCREEN.EMAIL}]});
  };

  // ── Favourite ────────────────────────────────────────────────────────────────
  const onFavPress = async () => {
    try {
      if (await isGuestUser()) { setIsGuestPopup(true); return; }
      const storedMode = JSON.parse(await getFromStorage(STRING.STORAGE.MODE));
      const net = await NetInfo.fetch();
      if (!net.isConnected || !storedMode) {
        setAlertMessage(!net.isConnected
          ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE')
          : t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE'));
        setIsAlert(true);
        return;
      }
      // Central store: optimistic flip, real success check, rollback on failure —
      // and every other screen showing this site updates with it, which is why
      // Home no longer needs to refetch to show the change.
      await toggleFav();
    } catch (e) { log.warn("[caught]", e); }
  };

  // ── Star rating submit ────────────────────────────────────────────────────────
  const onStarRatingPress = async rate => {
    try {
      if (await isGuestUser()) { setIsGuestPopup(true); return; }
      const storedMode = JSON.parse(await getFromStorage(STRING.STORAGE.MODE));
      const net = await NetInfo.fetch();
      if (!net.isConnected || !storedMode) {
        setAlertMessage(!net.isConnected
          ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE')
          : t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE'));
        setIsAlert(true);
        return;
      }
      setUserRating(rate);
      const userId = await AsyncStorage.getItem(t('STORAGE.USER_ID'));
      comnPost('v2/addUpdateRating', {
        user_id: userId,
        rateable_type: t('TABLE.SITE'),
        rateable_id: city.id,
        rate,
      }).then(() => {
        AsyncStorage.setItem('isUpdated', 'true');
      }).catch(() => {});
    } catch (e) { log.warn("[caught]", e); }
  };

  // ── Share ─────────────────────────────────────────────────────────────────────
  const onShare = async () => {
    if (await isGuestUser()) { setIsGuestPopup(true); return; }
    try {
      await Share.share({
        message: `${city.name} — ${city.tag_line || ''}\nExplore on TourKokan!`,
        title: city.name,
      });
    } catch (e) { log.warn("[caught]", e); }
  };

  // ── Directions ───────────────────────────────────────────────────────────────
  const onDirections = () => {
    const lat = parseFloat(city.latitude);
    const lng = parseFloat(city.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    const url = Platform.OS === 'ios'
      ? `maps://?ll=${lat},${lng}&q=${encodeURIComponent(city.name)}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(city.name)})`;
    Linking.canOpenURL(url)
      .then(ok => Linking.openURL(ok ? url : `https://maps.google.com/?q=${lat},${lng}`))
      .catch(() => {});
  };

  // ── Vendor contact (call / whatsapp) — the site's public business number ──────
  // Civic sites usually carry their number in meta_data (landline/helpline)
  // rather than the `phone` column — fall back to it so "Call office" works.
  const metaPhone = useMemo(() => {
    let md = city?.meta_data;
    if (typeof md === 'string') {
      try { md = JSON.parse(md); } catch (e) { md = null; }
    }
    if (!md || typeof md !== 'object') return '';
    const key = Object.keys(md).find(k =>
      /^(landline|phone|helpline|contact_number|mobile|telephone)$/i.test(k),
    );
    const raw = key ? String(md[key]) : '';
    // keep it dial-able: digits, +, -, spaces only
    return /\d{5,}/.test(raw.replace(/\D/g, '')) ? raw.replace(/[^\d+\-\s]/g, '').trim() : '';
  }, [city?.meta_data]);
  const phoneNum = city?.phone || city?.contact?.phone || metaPhone || '';
  const waNum = city?.whatsapp || city?.phone || '';
  const isVendor = theme.kind === 'vendor';
  const hasContact = isVendor && (!!phoneNum || !!waNum);
  const onCall = () => {
    if (phoneNum) Linking.openURL(`tel:${phoneNum}`).catch(() => {});
  };
  const onWhatsApp = () => {
    if (!waNum) return;
    const text = encodeURIComponent(`Hi, I'm interested in ${city.name} on TourKokan.`);
    Linking.openURL(`whatsapp://send?phone=${waNum}&text=${text}`).catch(() =>
      Linking.openURL(`https://wa.me/${waNum}?text=${text}`).catch(() => {}),
    );
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getImgUri = useCallback(item => {
    if (!item) return null;
    let uri = null;
    if (typeof item === 'string') uri = item.startsWith('http') ? item : `${AWS_URL}${item}`;
    else if (item.path) uri = `${AWS_URL}${item.path}`;
    else if (item.image) uri = `${AWS_URL}${item.image}`;
    else if (item.gallery?.[0]?.path) uri = `${AWS_URL}${item.gallery[0].path}`;
    log.debug('[SiteDetail getImgUri]', uri);
    return uri;
  }, []);

  const getHeroUri = useCallback(() => {
    const gallery = city?.gallery || [];
    let uri = null;
    if (gallery[activeGalleryIdx]?.path) uri = `${AWS_URL}${gallery[activeGalleryIdx].path}`;
    else if (gallery[activeGalleryIdx]?.image) uri = `${AWS_URL}${gallery[activeGalleryIdx].image}`;
    else if (city?.image) uri = `${AWS_URL}${city.image}`;
    log.debug('[SiteDetail hero img]', city?.name, uri);
    return uri;
  }, [city, activeGalleryIdx]);

  const getRating = () => {
    const r = parseFloat(city?.rating_avg_rate);
    return isNaN(r) ? 0 : r;
  };

  const getParentName = () => city?.site?.name || '';

  const renderStars = (rating, size = 15) =>
    [1, 2, 3, 4, 5].map(i => (
      <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={size} color="#D97706" />
    ));

  // ── Section: Hero ─────────────────────────────────────────────────────────────
  // ── Section: Hero — full-bleed photo with the identity overlaid ──────────────
  const renderHero = () => {
    const heroUri = getHeroUri();
    const rating = getRating();
    // "🛕 Temple · Kokan View" — leaf category plus its parent group.
    const badgeText = [catLabels.leaf, catLabels.group].filter(Boolean).join(' · ');
    return (
      <View style={[st.heroWrap, {height: heroH}]}>
        {heroUri ? (
          <CachedImage source={{uri: heroUri}} style={st.heroImage} resizeMode="cover" />
        ) : (
          // No site photo → themed category art rather than a stock photo that
          // would repeat across every listing in the same category.
          <CategoryArt categories={city?.categories} style={st.heroImage} />
        )}
        {/* Legibility + category wash: dark→category-deep at the bottom */}
        <LinearGradient
          colors={[tint(theme.deep, 0.92), tint(theme.deep, 0.18), 'rgba(0,0,0,0.10)']}
          locations={[0, 0.55, 1]}
          style={st.heroOverlay} start={{x: 0, y: 1}} end={{x: 0, y: 0}}
        />

        {/* Top controls */}
        <View style={[st.heroTopRow, {top: insets.top + 12, left: gutter, right: gutter}]}>
          <TouchableOpacity style={st.heroCircle} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <View style={st.heroTopRight}>
            <TouchableOpacity style={st.heroCircle} onPress={onShare} activeOpacity={0.85}>
              <Ionicons name="share-social-outline" size={18} color={C.white} />
            </TouchableOpacity>
            <TouchableOpacity style={st.heroCircle} onPress={onFavPress} activeOpacity={0.85}>
              {favPending ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={19} color={isFav ? '#FF6B6B' : C.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {offline && (
          <View style={st.offlineBadge}>
            <Ionicons name="cloud-offline-outline" size={12} color={C.white} />
            <Text style={st.offlineBadgeText}>{t('SITE_DETAIL.OFFLINE_DATA')}</Text>
          </View>
        )}

        {/* Overlaid identity — badge · title · tagline · rating */}
        <View style={[st.heroContent, {left: gutter, right: gutter, bottom: m.ms(28)}]}>
          <View style={st.heroBadgeRow}>
            {!!badgeText && (
              <View style={[st.heroBadge, {backgroundColor: theme.accent}]}>
                <Text style={[st.heroBadgeTxt, {fontSize: m.ms(11)}]}>{theme.glyph} {badgeText}</Text>
              </View>
            )}
            {city.is_hot_place ? (
              <View style={[st.heroBadge, {backgroundColor: 'rgba(20,18,16,0.42)'}]}>
                <Text style={[st.heroBadgeTxt, {fontSize: m.ms(11)}]}>🔥 {t('SITE_DETAIL.HOT_PLACE')}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[st.heroTitle, {fontSize: m.ms(27)}]} numberOfLines={2}>{city.name}</Text>
          {!!city.tag_line && (
            <Text style={[st.heroTag, {fontSize: m.ms(13)}]} numberOfLines={2}>{city.tag_line}</Text>
          )}
          {/* Civic listings are utilitarian — no ratings hero (per the design). */}
          {policy.heroRating && rating > 0 && (
            <View style={st.heroRateRow}>
              <Ionicons name="star" size={m.ms(13)} color="#FFC94D" />
              <Text style={[st.heroRateNum, {fontSize: m.ms(13)}]}>{rating.toFixed(1)}</Text>
              <Text style={[st.heroRateSub, {fontSize: m.ms(12)}]}>
                · {t('SITE_DETAIL.REVIEWS_COUNT', {count: city.comment_count || 0})}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ══ Section renderers — keyed by the id used in the kind's policy.order ══════

  // Contact bar (vendors only): Call · Directions · WhatsApp
  const renderContactBar = () => {
    if (!hasContact) return null;
    return (
      <View style={[st.contactBar, {marginHorizontal: gutter}]}>
        {!!phoneNum && (
          <TouchableOpacity style={[st.contactBtn, {borderColor: tint(theme.accent, 0.35)}]} onPress={onCall} activeOpacity={0.85}>
            <Ionicons name="call" size={16} color={theme.accent} />
            <Text style={[st.contactBtnTxt, {color: theme.accent}]}>{t('SITE_DETAIL.CALL')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[st.contactBtn, {borderColor: tint(theme.accent, 0.35)}]} onPress={onDirections} activeOpacity={0.85}>
          <Ionicons name="navigate" size={15} color={theme.accent} />
          <Text style={[st.contactBtnTxt, {color: theme.accent}]}>{t('SITE_DETAIL.DIRECTIONS')}</Text>
        </TouchableOpacity>
        {!!waNum && (
          <TouchableOpacity style={[st.contactBtn, st.contactBtnWa]} onPress={onWhatsApp} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={17} color="#fff" />
            <Text style={[st.contactBtnTxt, {color: '#fff'}]}>{t('SITE_DETAIL.WHATSAPP')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Facts grid straight from meta_data — deity / built / festival / hours…
  const renderFacts = () => {
    let md = city?.meta_data;
    if (typeof md === 'string') {
      try { md = JSON.parse(md); } catch (e) { md = null; }
    }
    if (!md || typeof md !== 'object' || Array.isArray(md)) return null;
    const prettyKey = k => String(k).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const items = Object.entries(md)
      .filter(([k, v]) => v != null && v !== '' && typeof v !== 'object' && k !== 'coord' && k !== 'how_to_reach')
      .slice(0, 6)
      .map(([k, v]) => ({k: prettyKey(k), v: String(v)}));
    if (items.length === 0) return null;
    return <View style={st.gap14}><FactsGrid m={m} theme={theme} items={items} /></View>;
  };

  // Quick strip — emoji · bold accent value · label, from counts that exist.
  const renderQuick = () => {
    const items = [];
    const villages = city.sites_count || city.sites?.length || 0;
    if (villages > 0) items.push({emoji: '🏘️', val: String(villages), label: t('SITE_DETAIL.VILLAGES_LABEL')});
    if (city.is_hot_place) items.push({emoji: '🔥', val: t('SITE_DETAIL.HOT'), label: t('SITE_DETAIL.PLACE_LABEL')});
    const photos = city.gallery_count || city.gallery?.length || 0;
    if (photos > 0) items.push({emoji: '📷', val: String(photos), label: t('SITE_DETAIL.PHOTOS_LABEL')});
    if (city.comment_count > 0) items.push({emoji: '⭐', val: String(city.comment_count), label: t('SITE_DETAIL.REVIEWS_LABEL')});
    if (items.length === 0) return null;
    return <View style={st.gap14}><QuickStrip m={m} theme={theme} items={items} /></View>;
  };

  const renderAbout = () => {
    if (!city.description) return null;
    return (
      <View style={st.gap14}>
        <Block m={m} label={t('SITE_DETAIL.ABOUT')}>
          <BlockText m={m} numberOfLines={descExpanded ? undefined : 5}>{city.description}</BlockText>
          <MoreToggle
            m={m} theme={theme} expanded={descExpanded}
            onPress={() => setDescExpanded(v => !v)}
            labelMore={t('BUTTON.READ_MORE')} labelLess={t('BUTTON.READ_LESS')}
          />
        </Block>
      </View>
    );
  };

  const renderSpeciality = () => {
    const txt = city?.speciality || city?.rules;
    if (!txt) return null;
    return (
      <View style={st.gap14}>
        <Callout m={m} theme={theme} icon={theme.kind === 'civic' ? '📄' : '✨'}>{txt}</Callout>
      </View>
    );
  };

  // Vendor offerings — the business's real marketplace products.
  const renderOfferings = () => {
    if (!policy.offerings || offerings.length === 0) return null;
    const codes = (city?.categories || []).map(c => String(c?.code || '').toLowerCase());
    const has = list => codes.some(c => list.includes(c));
    const title = has(['restaurant', 'cafe', 'bakery', 'fish_market'])
      ? t('SITE_DETAIL.OFFERINGS_MENU')
      : has(['hotel', 'hotel_rooms', 'lodge', 'resort', 'farm_house'])
      ? t('SITE_DETAIL.OFFERINGS_ROOMS')
      : has(['tour_operator', 'travel_agency', 'boat_operator'])
      ? t('SITE_DETAIL.OFFERINGS_TRIPS')
      : t('SITE_DETAIL.OFFERINGS');
    return (
      <View>
        <SectionHead m={m} theme={theme} title={title} />
        {offerings.map((p, i) => {
          const uri = productCoverUri(p);
          const price = productPrice(p);
          return (
            <ListRow
              key={p.id || i} m={m} theme={theme}
              source={uri ? {uri} : null}
              fallback={<CategoryArt categories={city?.categories} />}
              title={p.name}
              sub={[p.product_category?.name, p.short_description].filter(Boolean).join(' · ')}
              price={price != null ? `${money(price)} ${unitSuffix(p.unit)}`.trim() : null}
              onPress={() => navigateTo(navigation, t('SCREEN.PRODUCT_DETAIL'), {id: p.id})}
            />
          );
        })}
      </View>
    );
  };

  // Sponsored slots — CITY_MIDDLE / CITY_FOOTER. Civic listings carry no ads.
  const renderAd = (slot, label) => {
    if (!policy.ads) return null;
    return (
      <View style={[st.adSection, {paddingHorizontal: gutter}]}>
        {(isLoading && !bannerObject[slot]) ? (
          <SkeletonAdBanner />
        ) : (
          <AdBanner
            bannerImages={bannerObject?.[slot]}
            label={label}
            width={m.inner}
            // Footer slots get a taller box so a wide creative isn't a thin strip.
            minHeight={slot.endsWith('FOOTER') ? footerBannerHeight(m.inner) : undefined}
          />
        )}
      </View>
    );
  };

  const renderVillages = () => {
    const sites = city?.sites || [];
    if (sites.length === 0) return null;
    return (
      <View>
        <SectionHead
          m={m} theme={theme} title={t('VILLAGES')} more={t('SITE_DETAIL.SEE_ALL')}
          onMore={() =>
            ensureOnline(() =>
              navigateTo(navigation, t('SCREEN.CITY_PLACE_SEARCH'), {
                initialParentId: city.id,
                initialCityName: city.name,
              }),
            )
          }
        />
        {sites.slice(0, 5).map(item => {
          const uri = getImgUri(item);
          const rate = parseFloat(item.rating_avg_rate) || 0;
          const sub = item.tag_line || item.description?.substring(0, 55) || '';
          return (
            <ListRow
              key={item.id} m={m} theme={theme}
              source={uri ? {uri} : null}
              fallback={<CategoryArt categories={item.categories} />}
              title={item.name}
              sub={rate > 0 ? [sub, `⭐ ${rate.toFixed(1)}`].filter(Boolean).join(' · ') : sub}
              onPress={() => navigation.push(t('SCREEN.SITE_DETAIL'), {city: item})}
            />
          );
        })}
      </View>
    );
  };

  // Trending nearby — city.trending is a dict keyed by category code.
  const renderTrending = () => {
    const tr = city?.trending;
    if (!tr || typeof tr !== 'object' || Array.isArray(tr)) return null;
    const groups = Object.entries(tr).filter(([, v]) => Array.isArray(v) && v.length > 0);
    if (groups.length === 0) return null;
    const activeKey = trendingGroup && tr[trendingGroup]?.length ? trendingGroup : groups[0][0];
    const items = (tr[activeKey] || []).slice(0, 12);
    const pretty = k =>
      String(k).replace(/_/g, ' ').replace(/s$/, '').replace(/\b\w/g, c => c.toUpperCase());
    return (
      <View>
        <SectionHead m={m} theme={theme} title={t('SITE_DETAIL.TRENDING_NEARBY')} />
        <FilterChips
          m={m} theme={theme} activeKey={activeKey}
          items={groups.map(([k]) => ({key: k, label: pretty(k)}))}
          onSelect={setTrendingGroup}
        />
        <CardRail m={m}>
          {items.map((item, i) => {
            const uri = getImgUri(item);
            const rate = parseFloat(item.rating_avg_rate) || 0;
            return (
              <TCard
                key={item.id || i} m={m}
                source={uri ? {uri} : null}
                fallback={<CategoryArt categories={item.categories} />}
                title={item.name}
                meta={rate > 0 ? rate.toFixed(1) : null}
                metaIcon={rate > 0 ? 'star' : null}
                onPress={() => navigation.push(t('SCREEN.SITE_DETAIL'), {city: item})}
              />
            );
          })}
        </CardRail>
      </View>
    );
  };

  const renderHotPlaces = () => {
    const hot = city?.hot_sites || [];
    if (hot.length === 0) return null;
    return (
      <View>
        <SectionHead m={m} theme={theme} title={t('SITE_DETAIL.HOT_PLACES')} />
        <CardRail m={m}>
          {hot.slice(0, 12).map((item, i) => {
            const uri = getImgUri(item);
            return (
              <TCard
                key={item.id || i} m={m}
                source={uri ? {uri} : null}
                fallback={<CategoryArt categories={item.categories} />}
                title={item.name}
                meta={item.categories?.[0]?.name || null}
                flameLabel={`🔥 ${t('SITE_DETAIL.HOT')}`}
                onPress={() => navigation.push(t('SCREEN.SITE_DETAIL'), {city: item})}
              />
            );
          })}
        </CardRail>
      </View>
    );
  };

  // Events near here — real upcoming rows when they exist, otherwise the
  // browse-all card so the entry point into EventsList never disappears.
  const renderEvents = () => {
    const goList = () => navigation.navigate(STRING.SCREEN.EVENTS_LIST, {site_id: city.id});
    if (events.length > 0) {
      return (
        <View>
          <SectionHead
            m={m} theme={theme} title={t('SITE_DETAIL.EVENTS_NEAR')}
            more={t('SITE_DETAIL.ALL_EVENTS')} onMore={goList}
          />
          {events.map((e, i) => {
            const d = new Date(e.start_date);
            const valid = !isNaN(d.getTime());
            return (
              <EventRow
                key={e.id || i} m={m} theme={theme}
                day={valid ? String(d.getDate()) : '—'}
                mon={valid ? d.toLocaleString('en-US', {month: 'short'}) : ''}
                title={e.title}
                venue={[e.venue_name, e.taluka].filter(Boolean).join(' · ')}
                onPress={() =>
                  navigation.navigate(STRING.SCREEN.EVENT_DETAIL, {event: e})
                }
              />
            );
          })}
        </View>
      );
    }
    return (
      <View>
        <SectionHead m={m} theme={theme} title={t('SITE_DETAIL.EVENTS')} />
        <TouchableOpacity
          style={[st.eventsBanner, {marginHorizontal: gutter, minHeight: m.ms(94), backgroundColor: theme.accent}]}
          onPress={goList}
          activeOpacity={0.85}>
          <Ionicons name="calendar" size={m.ms(32)} color="#FFFFFF" />
          <View style={st.flex1}>
            <Text style={[st.eventsBannerTitle, {fontSize: m.ms(17)}]}>
              {t('SITE_DETAIL.EVENTS_AT', {name: city.name || ''})}
            </Text>
            <Text style={[st.eventsBannerSub, {fontSize: m.ms(12)}]}>{t('SITE_DETAIL.EVENTS_CTA')}</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={m.ms(26)} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>
    );
  };

  // How to reach — renders only when the backend actually has route data for
  // this site (`routes`/`bus_routes`) or a `meta_data.how_to_reach` note.
  const renderReach = () => {
    const rows = Array.isArray(city?.routes)
      ? city.routes
      : Array.isArray(city?.bus_routes)
      ? city.bus_routes
      : [];
    let md = city?.meta_data;
    if (typeof md === 'string') {
      try { md = JSON.parse(md); } catch (e) { md = null; }
    }
    const note = md && typeof md === 'object' ? md.how_to_reach : null;
    if (rows.length === 0 && !note) return null;
    return (
      <View>
        <SectionHead m={m} theme={theme} title={t('SITE_DETAIL.HOW_TO_REACH')} />
        {rows.slice(0, 5).map((r, i) => (
          <BusRow
            key={r.id || i} m={m} theme={theme}
            tag={(r.bus_type?.type || r.type || 'BUS').toString().toUpperCase().slice(0, 6)}
            path={r.name || [r.source_place?.name, r.destination_place?.name].filter(Boolean).join(' → ')}
            sub={[r.bus_type?.type, r.start_time].filter(Boolean).join(' · ')}
            time={r.total_time || null}
            onPress={r.id ? () => navigateTo(navigation, t('SCREEN.ROUTES_LIST'), {item: r}) : undefined}
          />
        ))}
        {!!note && (
          <View style={st.gap8}>
            <Callout m={m} theme={theme} icon="🚌">{String(note)}</Callout>
          </View>
        )}
      </View>
    );
  };

  // Location — map card with the address chip overlaid, as in the design.
  const renderLocation = () => {
    const lat = parseFloat(city.latitude);
    const lng = parseFloat(city.longitude);
    const hasCoords = !isNaN(lat) && !isNaN(lng);
    if (!hasCoords && !getParentName()) return null;
    return (
      <View>
        <SectionHead
          m={m} theme={theme} title={t('SITE_DETAIL.LOCATION')}
          more={hasCoords ? t('SITE_DETAIL.DIRECTIONS') : null} onMore={onDirections}
        />
        {hasCoords && (
          <View style={[st.mapOuterCard, {marginHorizontal: gutter, height: m.ms(150)}]}>
            <MapView
              style={StyleSheet.absoluteFill}
              provider={mapProvider}
              initialRegion={{latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05}}
              scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false}>
              <Marker coordinate={{latitude: lat, longitude: lng}} title={city.name} />
            </MapView>
            <TouchableOpacity style={st.mapAddr} onPress={onDirections} activeOpacity={0.85}>
              <Text style={st.mapAddrTxt} numberOfLines={1}>
                {[city.name, getParentName()].filter(Boolean).join(', ')}
              </Text>
              <Text style={[st.mapAddrLink, {color: theme.accent}]}>{t('SITE_DETAIL.OPEN_MAP')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {!hasCoords && !!getParentName() && (
          <View style={[st.addressCard, {marginHorizontal: gutter}]}>
            <View style={st.addressRow}>
              <View style={st.addressIconWrap}>
                <Ionicons name="business-outline" size={15} color={theme.accent} />
              </View>
              <View style={st.addressTextWrap}>
                <Text style={st.addressLabel}>{t('SITE_DETAIL.AREA_TALUKA')}</Text>
                <Text style={st.addressValue}>{getParentName()}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderGallery = () => {
    const gallery = city?.gallery || [];
    return (
      <View>
        <SectionHead
          m={m} theme={theme} title={t('SITE_DETAIL.PHOTOS')}
          more={gallery.length > 0 ? String(gallery.length) : null}
        />
        {gallery.length === 0 ? (
          <EmptyState m={m} icon="📷" text={t('SITE_DETAIL.NO_PHOTOS')} />
        ) : (
          <GalleryGrid
            m={m}
            sources={gallery.map(g => {
              const uri = getImgUri(g);
              return uri ? {uri} : null;
            })}
            fallback={<CategoryArt categories={city?.categories} />}
            onPressItem={i => setActiveGalleryIdx(i)}
          />
        )}
      </View>
    );
  };

  const renderReviews = () => {
    const rating = getRating();
    const comments = city?.comment || [];
    const initials = user =>
      !user?.name ? '?' : user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return (
      <View>
        <SectionHead
          m={m} theme={theme} title={t('SITE_DETAIL.REVIEWS')}
          more={t('SITE_DETAIL.WRITE')}
          onMore={async () => {
            if (await isGuestUser()) { setIsGuestPopup(true); return; }
            refRBSheet.current?.open();
          }}
        />

        <View style={[st.reviewTopRow, {marginHorizontal: gutter}]}>
          <View style={st.reviewScoreSide}>
            <Text style={[st.reviewBigNum, {color: theme.accent}]}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
            <View style={st.starsRow}>{renderStars(rating, m.ms(16))}</View>
            <Text style={st.reviewSubCount}>
              {t('SITE_DETAIL.REVIEWS_COUNT', {count: city.comment_count || 0})}
            </Text>
          </View>
          <View style={st.reviewRateSide}>
            <Text style={st.rateThisLabel}>{t('SITE_DETAIL.RATE_THIS')}</Text>
            <StarRating
              rating={userRating}
              onChange={onStarRatingPress}
              enableHalfStar={false}
              starSize={m.ms(26)}
              color="#D97706"
            />
            <Text style={st.rateHintText}>{t('SITE_DETAIL.RATE_HINT')}</Text>
          </View>
        </View>

        {comments.length > 0 ? (
          comments.map(item => {
            const raw = item.users ?? item.user;
            const user = Array.isArray(raw) ? raw[0] : raw;
            const pic = user?.profile_picture;
            return (
              <ReviewRow
                key={item.id} m={m} theme={theme}
                initials={initials(user)}
                avatar={pic ? {uri: pic.startsWith('http') ? pic : `${AWS_URL}${pic}`} : null}
                name={user?.name || t('SITE_DETAIL.TRAVELER')}
                text={item.comment}
                badge={
                  <View style={st.commentVerifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={theme.accent} />
                    <Text style={[st.commentVerifiedText, {color: theme.accent}]}>{t('SITE_DETAIL.VERIFIED')}</Text>
                  </View>
                }
              />
            );
          })
        ) : (
          <EmptyState m={m} icon="💬" text={t('SITE_DETAIL.NO_REVIEWS')} />
        )}
      </View>
    );
  };

  // The one place that maps a policy section id → its renderer.
  const SECTIONS = {
    contact: renderContactBar,
    facts: renderFacts,
    quick: renderQuick,
    about: renderAbout,
    special: renderSpeciality,
    offerings: renderOfferings,
    adMid: () => renderAd('CITY_MIDDLE', t('SITE_DETAIL.SPONSORED')),
    villages: renderVillages,
    trending: renderTrending,
    hot: renderHotPlaces,
    events: renderEvents,
    reach: renderReach,
    location: renderLocation,
    gallery: renderGallery,
    adFoot: () => renderAd('CITY_FOOTER', t('SITE_DETAIL.AD')),
    reviews: renderReviews,
  };

  const booting = isLoading && !city.name;

  // ── Root render ───────────────────────────────────────────────────────────────
  return (
    <View style={st.root}>
      <SystemBars style="light" />
      <Popup message={alertMessage} onPress={() => setIsAlert(false)} visible={isAlert} />
      {connectivityModal}

      <ScrollView
        style={st.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.accent]}
            tintColor={theme.accent}
          />
        }>

        {booting ? <SkeletonHero height={heroH} /> : renderHero()}

        {/* Content sheet — rounded top overlapping the hero. Centred and capped
            on tablets so the column never stretches to a 1000dp line length. */}
        <View style={[st.sheet, {width: m.contentW, marginLeft: m.sideInset}]}>
          {booting ? (
            <>
              <SkeletonInfo />
              <SkeletonContent />
            </>
          ) : (
            policy.order.map(key => {
              const node = SECTIONS[key]?.();
              return node ? <React.Fragment key={key}>{node}</React.Fragment> : null;
            })
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom action bar — the CTA pair follows the listing's kind. */}
      <View style={[st.bottomBar, {paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: gutter}]}>
        {policy.bottomBar === 'whatsapp' && hasContact ? (
          <>
            <TouchableOpacity style={[st.bottomBtnIcon, {borderColor: tint(theme.accent, 0.4)}]} onPress={onShare} activeOpacity={0.85}>
              <Ionicons name="share-social-outline" size={19} color={theme.accent} />
            </TouchableOpacity>
            {!!phoneNum && (
              <TouchableOpacity style={[st.bottomBtnIcon, {borderColor: tint(theme.accent, 0.4)}]} onPress={onCall} activeOpacity={0.85}>
                <Ionicons name="call" size={18} color={theme.accent} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[st.bottomBtnPrimary, {backgroundColor: C.wa, flex: 1}]} onPress={onWhatsApp} activeOpacity={0.9}>
              <Ionicons name="logo-whatsapp" size={18} color={C.white} />
              <Text style={st.bottomBtnPrimaryText}>{t('SITE_DETAIL.ENQUIRE')}</Text>
            </TouchableOpacity>
          </>
        ) : policy.bottomBar === 'civic' ? (
          <>
            {!!phoneNum && (
              <TouchableOpacity style={[st.bottomBtnSecondary, {borderColor: tint(theme.accent, 0.4)}]} onPress={onCall} activeOpacity={0.85}>
                <Ionicons name="call" size={18} color={theme.accent} />
                <Text style={[st.bottomBtnSecondaryText, {color: theme.accent}]}>{t('SITE_DETAIL.CALL_OFFICE')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[st.bottomBtnPrimary, {backgroundColor: theme.accent}]} onPress={onDirections} activeOpacity={0.85}>
              <Ionicons name="navigate" size={18} color={C.white} />
              <Text style={st.bottomBtnPrimaryText}>{t('SITE_DETAIL.GET_DIRECTIONS')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[st.bottomBtnSecondary, {borderColor: tint(theme.accent, 0.4)}]} onPress={onShare} activeOpacity={0.85}>
              <Ionicons name="share-social-outline" size={18} color={theme.accent} />
              <Text style={[st.bottomBtnSecondaryText, {color: theme.accent}]}>{t('SITE_DETAIL.SHARE')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.bottomBtnPrimary, {backgroundColor: theme.accent}]} onPress={onDirections} activeOpacity={0.85}>
              <Ionicons name="navigate" size={18} color={C.white} />
              <Text style={st.bottomBtnPrimaryText}>{t('SITE_DETAIL.GET_DIRECTIONS')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Comments bottom sheet */}
      <BottomSheet
        refRBSheet={refRBSheet}
        height={DIMENSIONS.halfHeight + 50}
        Component={
          <CommentsSheet
            key={city?.comment?.length}
            commentable_type={t('TABLE.SITE')}
            commentable_id={city.id}
            navigation={navigation}
            reload={() => {
              fetchFreshData();
              AsyncStorage.setItem('isUpdated', 'true');
            }}
            setLoader={() => {}}
            openCommentsSheet={() => refRBSheet.current?.open()}
            closeCommentsSheet={() => refRBSheet.current?.close()}
          />
        }
      />

      {/* ── Guest Gate Modal ── */}
      <Modal
        visible={isGuestPopup}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsGuestPopup(false)}>
        <View style={guestSt.backdrop}>
          <View style={guestSt.card}>
            <View style={guestSt.iconWrap}>
              <Text style={guestSt.iconText}>🔒</Text>
            </View>
            <Text style={guestSt.title}>Members Only</Text>
            <Text style={guestSt.message}>
              Please register or login to like, rate, and comment on places.
            </Text>
            <TouchableOpacity
              style={guestSt.loginBtn}
              onPress={handleGuestLogin}
              activeOpacity={0.85}>
              <Text style={guestSt.loginBtnText}>Login / Register</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={guestSt.cancelBtn}
              onPress={() => setIsGuestPopup(false)}
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
const st = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  flex1: {flex: 1},
  gap8: {marginTop: 8},
  gap14: {marginTop: 14},
  starsRow: {flexDirection: 'row', gap: 2, marginTop: 4},
  mapAddr: {
    position: 'absolute', left: 10, right: 10, bottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  mapAddrTxt: {flex: 1, fontSize: 11.5, color: C.textMid},
  mapAddrLink: {fontSize: 11.5, fontWeight: '800'},
  eventsBannerTitle: {fontWeight: '700', color: '#FFFFFF', marginBottom: 2},
  eventsBannerSub: {color: 'rgba(255,255,255,0.8)'},
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 90},

  // Hero
  heroWrap: {width: '100%', overflow: 'hidden'},
  heroImage: {...StyleSheet.absoluteFillObject, width: '100%', height: '100%'},
  heroTopRow: {position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  heroTopRight: {flexDirection: 'row', gap: 10},
  heroCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(20,18,16,0.38)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  heroContent: {position: 'absolute', left: 16, right: 16, bottom: 30},
  heroBadgeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 9},
  heroBadge: {paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999},
  heroBadgeTxt: {color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.2},
  heroTitle: {color: '#fff', fontSize: 27, fontWeight: '800', letterSpacing: -0.4, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 12},
  heroTag: {color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '500', marginTop: 3, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 8},
  heroRateRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10},
  heroRateNum: {color: '#fff', fontSize: 13, fontWeight: '800'},
  heroRateSub: {color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500'},
  sheet: {
    backgroundColor: C.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    marginTop: -22, paddingTop: 8, position: 'relative', zIndex: 2,
  },
  contactBar: {flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 14},
  contactBtn: {
    flex: 1, height: 44, borderRadius: 13, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  contactBtnWa: {backgroundColor: C.wa, borderColor: 'transparent', flex: 1.3},
  contactBtnTxt: {fontSize: 12.5, fontWeight: '800'},
  bottomBtnIcon: {
    width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.white, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  heroPlaceholder: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  heroOverlay: {...StyleSheet.absoluteFillObject},
  offlineBadge: {
    position: 'absolute', bottom: 12, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50,
  },
  offlineBadgeText: {fontSize: 11, color: C.white, fontWeight: '600'},

  // Gallery strip

  // Content block — standard section padding

  // Title card inner divider (above description)

  // Title card — white bg, elevated appearance

  // Section card wrapper

  // Section header

  // Category badges

  // Title

  // Inline rating row

  // Tag line styled gradient

  // Location row

  // Description

  // Rating card
  ratingCard: {
    flexDirection: 'row', gap: 16,
    backgroundColor: C.white, borderRadius: RADIUS, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },

  // Quick info pills

  // Location / Map
  mapOuterCard: {
    borderRadius: RADIUS + 2,
    borderWidth: 1.5, borderColor: 'rgba(27,107,123,0.22)',
    backgroundColor: C.oceanFoam,
    padding: 3, marginBottom: 10, overflow: 'hidden',
  },

  // Address card
  addressCard: {
    backgroundColor: C.white, borderRadius: RADIUS,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  addressRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13,
  },
  addressIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(27,107,123,0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  addressTextWrap: {flex: 1},
  addressLabel: {
    fontSize: 10, color: C.textLight, marginBottom: 2,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  addressValue: {fontSize: 14, fontWeight: '600', color: C.textDark},

  // Ad banner (HomeScreen style)
  adSection: {paddingHorizontal: 16, marginTop: 20, marginBottom: 8},
  adBannerWrap: {
    // No minHeight here: Banner auto-sizes to the creative's aspect ratio, and a
    // floor would leave dead space under a wide/short banner. The empty-slot
    // placeholder carries its own minHeight instead.
    backgroundColor: C.sandPale, borderRadius: RADIUS,
    borderWidth: 2, borderColor: C.sandMid, borderStyle: 'dashed',
    overflow: 'hidden',
  },
  adLabelBadge: {
    position: 'absolute', top: 10, right: 10, zIndex: 10,
    backgroundColor: C.sandMid, borderRadius: 50,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  adLabelText: {fontSize: 10, fontWeight: '700', color: C.white, textTransform: 'uppercase', letterSpacing: 0.6},
  adPlaceholder: {padding: 30, alignItems: 'center', justifyContent: 'center', minHeight: 120},
  adIcon: {fontSize: 28, marginBottom: 8},
  adText: {fontSize: 14, fontWeight: '500', color: C.textMid, textAlign: 'center'},

  // Section count pill

  // Photos grid

  // Reviews — top two-column layout
  reviewTopRow: {
    flexDirection: 'row', gap: 12, marginBottom: 14,
    backgroundColor: C.white, borderRadius: RADIUS, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  reviewScoreSide: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.07)',
    paddingRight: 12,
  },
  reviewBigNum: {fontSize: 44, fontWeight: '700', color: C.textDark, lineHeight: 50},
  reviewSubCount: {fontSize: 11, color: C.textLight, marginTop: 4},
  reviewRateSide: {flex: 1.4, alignItems: 'center', justifyContent: 'center', gap: 4},
  rateThisLabel: {fontSize: 12, fontWeight: '600', color: C.textMid},
  rateHintText: {fontSize: 10, color: C.textLight},

  // Write review button — secondary outline style

  // Comments list
  commentVerifiedBadge: {flexDirection: 'row', alignItems: 'center', gap: 3},
  commentVerifiedText: {fontSize: 10, color: C.oceanMid, fontWeight: '600'},

  // Named section wrapper (for Popular Spots / Nearby)
  eventsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, backgroundColor: C.oceanMid,
    paddingHorizontal: 18, paddingVertical: 18,
  },

  // Villages

  // Empty state

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: C.white,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)',
  },
  bottomBtnPrimary: {
    flex: 2, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: C.oceanMid, borderRadius: 14, paddingVertical: 14,
  },
  bottomBtnPrimaryText: {fontSize: 14, fontWeight: '700', color: C.white},
  bottomBtnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(27,107,123,0.1)',
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: 'rgba(27,107,123,0.25)',
  },
  bottomBtnSecondaryText: {fontSize: 14, fontWeight: '700', color: C.oceanMid},
});

// ─── Guest Modal styles ───────────────────────────────────────────────────────
const guestSt = StyleSheet.create({
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
});

// ─── Redux ────────────────────────────────────────────────────────────────────
const mapStateToProps = state => ({mode: state.commonState.mode});
const mapDispatchToProps = () => ({});
export default connect(mapStateToProps, mapDispatchToProps)(SiteDetailPage);
