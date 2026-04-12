import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  BackHandler,
  StyleSheet,
  Linking,
  Share,
  Modal,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isGuestUser} from '../../Components/Common/GuestGateModal';
import NetInfo from '@react-native-community/netinfo';
import StarRating from 'react-native-star-rating-widget';
import {FTP_PATH} from '@env';

import {comnPost, getFromStorage} from '../../Services/Api/CommonServices';
import {navigateTo} from '../../Services/CommonMethods';
import STRING from '../../Services/Constants/STRINGS';
import Banner from '../../Components/Customs/Banner';
import Popup from '../../Components/Common/Popup';
import BottomSheet from '../../Components/Customs/BottomSheet';
import CommentsSheet from '../../Components/Common/CommentsSheet';
import PopularSpotsSection from '../../Components/Common/PopularSpotsSection';
import NearbyPlacesSection from '../../Components/Common/NearbyPlacesSection';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';

const {width: SW} = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  oceanDeep: '#0D3D4A', oceanMid: '#1B6B7B', oceanFoam: '#B8E4EA',
  sandMid: '#C4972A', sandPale: '#FBF3DC',
  cream: '#FAF7F0', white: '#FFFFFF',
  textDark: '#1C1917', textMid: '#44403C', textLight: '#78716C',
};
const RADIUS = 18;
const HERO_H = Math.round(SW * 0.75);

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

// ─── Category emoji helper ────────────────────────────────────────────────────
const CAT_EMOJI = {
  beach: '🏖', fort: '🏰', temple: '🛕', waterfall: '💧',
  food: '🍛', nature: '🌿', city: '🏙️', hotel: '🏨',
  kokan: '🌊', view: '🔭', accommodation: '🏠', wildlife: '🐾',
  heritage: '🏛', adventure: '🧗', park: '🌳', lake: '🏞',
};
const getCatEmoji = code => {
  if (!code) return '📍';
  const lc = (code || '').toLowerCase();
  const found = Object.entries(CAT_EMOJI).find(([k]) => lc.includes(k));
  return found ? found[1] : '📍';
};

// ─── Ad Banner (matches HomeScreen AdBanner component) ────────────────────────
const AdBanner = ({bannerImages, label, bannerHeight}) => (
  <View style={st.adBannerWrap}>
    <View style={st.adLabelBadge}>
      <Text style={st.adLabelText}>{label || 'Ad'}</Text>
    </View>
    {bannerImages?.length > 0 ? (
      <Banner
        bannerImages={bannerImages}
        style={{height: bannerHeight || SW / 3, borderRadius: RADIUS - 2, overflow: 'hidden'}}
      />
    ) : (
      <View style={st.adPlaceholder}>
        <Text style={st.adIcon}>📢</Text>
        <Text style={st.adText}>Ad Space Available</Text>
      </View>
    )}
  </View>
);

// ─── Skeleton components ──────────────────────────────────────────────────────
const SkLine = ({w, h = 12, style, opacity}) => (
  <Animated.View
    style={[
      {height: h, borderRadius: h / 2, backgroundColor: '#D1E8EC', width: w || '100%'},
      style, {opacity},
    ]}
  />
);
const SkeletonHero = () => {
  const opacity = useShimmer();
  return (
    <Animated.View style={[st.heroWrap, {backgroundColor: '#C4D9E0', opacity}]}>
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
const SkeletonRating = () => {
  const opacity = useShimmer();
  return (
    <View style={{paddingHorizontal: 16, paddingBottom: 16}}>
      <View style={[st.ratingCard, {padding: 16}]}>
        <View style={{gap: 8, flex: 1}}>
          <SkLine w={60} h={44} opacity={opacity} style={{borderRadius: 8}} />
          <SkLine w="60%" h={12} opacity={opacity} />
        </View>
        <View style={{flex: 2, gap: 6}}>
          {[0,1,2,3,4].map(i => <SkLine key={i} h={8} opacity={opacity} />)}
        </View>
      </View>
    </View>
  );
};
const SkeletonContent = () => {
  const opacity = useShimmer();
  return (
    <View style={{padding: 16, gap: 12}}>
      {[0,1,2,3,4,5].map(i => (
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
  const refRBSheet = useRef();

  const [city, setCity] = useState(route.params?.city || {});
  const [isFav, setIsFav] = useState(!!route.params?.city?.is_favorite);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [activeMediaTab, setActiveMediaTab] = useState('photos');
  const [isLoading, setIsLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [bannerObject, setBannerObject] = useState({});
  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isGuestPopup, setIsGuestPopup] = useState(false);

  // ── Back handler ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => handler.remove();
  }, [navigation]);

  // ── Init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => setOffline(!state.isConnected));
    loadBanners();
    fetchFreshData();
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBanners = async () => {
    try {
      const raw = await getFromStorage(t('STORAGE.LANDING_RESPONSE'));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.banners) setBannerObject(parsed.banners);
      }
    } catch {}
  };

  const fetchFreshData = async () => {
    try {
      const storedMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
      if (!storedMode) return;
      const net = await NetInfo.fetch();
      if (!net.isConnected) return;
      const id = route.params?.city?.id;
      if (!id) return;
      setIsLoading(true);
      const res = await comnPost('v2/getSite', {id});
      if (res?.data?.data) {
        const fresh = res.data.data;
        setCity(fresh);
        setIsFav(!!fresh.is_favorite);
        setUserRating(parseFloat(fresh.rating_avg_rate) || 0);
        await AsyncStorage.setItem(`siteDetail_${id}`, JSON.stringify(fresh));
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

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
      const storedMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
      const net = await NetInfo.fetch();
      if (!net.isConnected || !storedMode) {
        setAlertMessage(!net.isConnected
          ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE')
          : t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE'));
        setIsAlert(true);
        return;
      }
      const userId = await AsyncStorage.getItem(t('STORAGE.USER_ID'));
      setIsFav(v => !v);
      comnPost('v2/addDeleteFavourite', {
        user_id: userId,
        favouritable_type: t('TABLE.SITE'),
        favouritable_id: city.id,
      }).then(() => {
        AsyncStorage.setItem('isUpdated', 'true');
      }).catch(() => {});
    } catch {}
  };

  // ── Star rating submit ────────────────────────────────────────────────────────
  const onStarRatingPress = async rate => {
    try {
      if (await isGuestUser()) { setIsGuestPopup(true); return; }
      const storedMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
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
    } catch {}
  };

  // ── Share ─────────────────────────────────────────────────────────────────────
  const onShare = async () => {
    try {
      await Share.share({
        message: `${city.name} — ${city.tag_line || ''}\nExplore on TourKokan!`,
        title: city.name,
      });
    } catch {}
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

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getImgUri = useCallback(item => {
    if (!item) return null;
    if (typeof item === 'string') return item.startsWith('http') ? item : `${FTP_PATH}${item}`;
    if (item.path) return `${FTP_PATH}${item.path}`;
    if (item.image) return `${FTP_PATH}${item.image}`;
    if (item.gallery?.[0]?.path) return `${FTP_PATH}${item.gallery[0].path}`;
    return null;
  }, []);

  const getHeroUri = useCallback(() => {
    const gallery = city?.gallery || [];
    if (gallery[activeGalleryIdx]?.path) return `${FTP_PATH}${gallery[activeGalleryIdx].path}`;
    if (gallery[activeGalleryIdx]?.image) return `${FTP_PATH}${gallery[activeGalleryIdx].image}`;
    if (city?.image) return `${FTP_PATH}${city.image}`;
    return null;
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
  const renderHero = () => {
    const heroUri = getHeroUri();
    const emoji = getCatEmoji(city?.categories?.[0]?.code);
    return (
      <View style={st.heroWrap}>
        {heroUri ? (
          <Image source={{uri: heroUri}} style={st.heroImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[C.oceanFoam, '#D4EDD9']} style={st.heroPlaceholder}>
            <Text style={st.heroEmoji}>{emoji}</Text>
          </LinearGradient>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.42)', 'transparent', 'transparent']}
          style={st.heroOverlay} start={{x: 0, y: 1}} end={{x: 0, y: 0}}
        />
        <TouchableOpacity
          style={[st.heroBtn, {top: insets.top + 12, left: 16}]}
          onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={20} color={C.textDark} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.heroBtn, {top: insets.top + 12, right: 16}]}
          onPress={onFavPress} activeOpacity={0.85}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'} size={20}
            color={isFav ? '#E53E3E' : C.textDark}
          />
        </TouchableOpacity>
        {offline && (
          <View style={st.offlineBadge}>
            <Ionicons name="cloud-offline-outline" size={12} color={C.white} />
            <Text style={st.offlineBadgeText}>{t('SITE_DETAIL.OFFLINE_DATA')}</Text>
          </View>
        )}
      </View>
    );
  };

  // ── Section: Gallery strip (click changes hero) ───────────────────────────────
  const renderGalleryStrip = () => {
    const gallery = city?.gallery || [];
    if (gallery.length === 0) return null;
    const visible = gallery.slice(0, 6);
    const extra = gallery.length - visible.length;
    return (
      <View style={st.galleryStripWrap}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.galleryStrip}>
          {visible.map((img, idx) => {
            const uri = getImgUri(img);
            const isActive = idx === activeGalleryIdx;
            return (
              <TouchableOpacity
                key={idx}
                style={[st.galleryThumb, isActive && st.galleryThumbActive]}
                onPress={() => setActiveGalleryIdx(idx)}
                activeOpacity={0.8}>
                {uri ? (
                  <Image source={{uri}} style={st.galleryThumbImg} resizeMode="cover" />
                ) : (
                  <Text style={{fontSize: 22}}>📷</Text>
                )}
                {isActive && <View style={st.galleryActiveIndicator} />}
              </TouchableOpacity>
            );
          })}
          {extra > 0 && (
            <View style={[st.galleryThumb, st.galleryThumbExtra]}>
              <Text style={st.galleryExtraText}>+{extra}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // ── Section: Title + tagline + description (single card) ─────────────────────
  const renderTitleSection = () => {
    const rating = getRating();
    return (
      <View style={st.titleCard}>
        {/* Top row: category badges + hot badge */}
        <View style={st.badgeRow}>
          {city?.categories?.map(cat => (
            <View key={cat.id} style={st.badge}>
              <Text style={st.badgeText}>{getCatEmoji(cat.code)} {cat.name}</Text>
            </View>
          ))}
          {city.is_hot_place ? (
            <View style={[st.badge, st.badgeHot]}>
              <Text style={[st.badgeText, {color: C.sandMid}]}>🔥 Hot Place</Text>
            </View>
          ) : null}
        </View>

        {/* City name */}
        <Text style={st.placeTitle}>{city.name}</Text>

        {/* Inline rating row */}
        {rating > 0 && (
          <View style={st.inlineRatingRow}>
            <View style={st.inlineStars}>{renderStars(rating, 13)}</View>
            <Text style={st.inlineRatingNum}>{rating.toFixed(1)}</Text>
            <Text style={st.inlineRatingDot}>·</Text>
            <Text style={st.inlineReviewCount}>{city.comment_count || 0} reviews</Text>
          </View>
        )}

        {/* Tag line — styled gradient pill */}
        {city.tag_line ? (
          <LinearGradient
            colors={['rgba(27,107,123,0.10)', 'rgba(184,228,234,0.15)']}
            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
            style={st.tagLineGradient}>
            <Ionicons name="sparkles-outline" size={13} color={C.oceanMid} />
            <Text style={st.tagLineText}>{city.tag_line}</Text>
          </LinearGradient>
        ) : null}

        {/* Location chip */}
        {getParentName() ? (
          <View style={st.locationRow}>
            <View style={st.locationChip}>
              <Ionicons name="location-outline" size={13} color={C.oceanMid} />
              <Text style={st.locationChipText}>{getParentName()}</Text>
            </View>
          </View>
        ) : null}

        {/* Description — same card, separated by divider */}
        {city.description ? (
          <>
            <View style={st.titleDivider} />
            <Text style={st.description} numberOfLines={descExpanded ? undefined : 4}>
              {city.description}
            </Text>
            <TouchableOpacity
              style={st.readMoreBtn}
              onPress={() => setDescExpanded(v => !v)} activeOpacity={0.8}>
              <Text style={st.readMoreText}>
                {descExpanded ? t('BUTTON.READ_LESS') : t('BUTTON.READ_MORE')}
              </Text>
              <Ionicons name={descExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.oceanMid} />
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    );
  };

  // ── Section: Rating card ──────────────────────────────────────────────────────
  const renderRatingCard = () => {
    const rating = getRating();
    const pcts = [88, 8, 2, 1, 1];
    return (
      <View style={st.contentBlock}>
        <View style={st.ratingCard}>
          <View style={st.ratingLeft}>
            <Text style={st.ratingBig}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
            <View style={{flexDirection: 'row', gap: 2, marginVertical: 5}}>
              {renderStars(rating)}
            </View>
            <Text style={st.ratingCount}>{city.comment_count || 0} {t('SITE_DETAIL.REVIEWS')}</Text>
          </View>
          <View style={st.ratingDivider} />
          <View style={st.ratingRight}>
            {[5, 4, 3, 2, 1].map((star, idx) => (
              <View key={star} style={st.starRow}>
                <Text style={st.starRowLabel}>{star}⭐</Text>
                <View style={st.starBarBg}>
                  <View style={[st.starBarFill, {width: `${rating > 0 ? pcts[idx] : 0}%`}]} />
                </View>
                <Text style={st.starRowPct}>{rating > 0 ? pcts[idx] : 0}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // ── Section: Quick info pills ─────────────────────────────────────────────────
  const renderQuickInfo = () => {
    const pills = [];
    if (city?.categories?.[0]) pills.push({icon: 'pricetag-outline', label: city.categories[0].name});
    if ((city.gallery_count || city.gallery?.length) > 0)
      pills.push({icon: 'images-outline', label: `${city.gallery_count || city.gallery?.length} Photos`});
    if (city.comment_count > 0)
      pills.push({icon: 'chatbubble-outline', label: `${city.comment_count} Reviews`});
    if (city.sites_count > 0 || city.sites?.length > 0)
      pills.push({icon: 'home-outline', label: `${city.sites_count || city.sites?.length} Villages`});
    if (pills.length === 0) return null;
    return (
      <View style={st.contentBlock}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.quickInfoRow}>
          {pills.map((p, i) => (
            <View key={i} style={st.infoPill}>
              <Ionicons name={p.icon} size={13} color={C.oceanMid} />
              <Text style={st.infoPillText}>{p.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ── Section: Location map ─────────────────────────────────────────────────────
  const renderLocationSection = () => {
    const lat = parseFloat(city.latitude);
    const lng = parseFloat(city.longitude);
    const hasCoords = !isNaN(lat) && !isNaN(lng);
    if (!hasCoords && !getParentName()) return null;

    return (
      <View style={st.contentBlock}>
        {/* Section header */}
        <View style={[st.sectionHeaderRow, {marginBottom: 14}]}>
          <View style={st.sectionTitleRow}>
            <View style={st.sectionTitleDot} />
            <Text style={st.sectionTitle}>Location</Text>
          </View>
          {hasCoords && (
            <TouchableOpacity style={st.mapOpenBtn} onPress={onDirections} activeOpacity={0.85}>
              <Ionicons name="navigate-outline" size={13} color={C.oceanMid} />
              <Text style={st.mapOpenBtnText}>{t('SITE_DETAIL.OPEN_MAPS')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Map with styled border */}
        {hasCoords && (
          <View style={st.mapOuterCard}>
            <View style={st.mapInnerCard}>
              <MapView
                style={st.mapView}
                provider={PROVIDER_GOOGLE}
                initialRegion={{latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05}}
                scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false}>
                <Marker coordinate={{latitude: lat, longitude: lng}} title={city.name} />
              </MapView>
            </View>
          </View>
        )}

        {/* Address info below map */}
        {getParentName() ? (
          <View style={st.addressCard}>
            <View style={st.addressRow}>
              <View style={st.addressIconWrap}>
                <Ionicons name="business-outline" size={15} color={C.oceanMid} />
              </View>
              <View style={st.addressTextWrap}>
                <Text style={st.addressLabel}>Area / Taluka</Text>
                <Text style={st.addressValue}>{getParentName()}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  // ── Media tabs: Photos | Reviews ──────────────────────────────────────────────
  const MEDIA_TABS = [
    {id: 'photos', label: `📸  Photos (${city?.gallery?.length || 0})`},
    {id: 'reviews', label: `💬  Reviews (${city?.comment_count || 0})`},
  ];

  const renderMediaTabs = () => (
    <View style={st.mediaTabsWrap}>
      <View style={st.mediaTabsInner}>
        {MEDIA_TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[st.mediaTab, activeMediaTab === tab.id && st.mediaTabActive]}
            onPress={() => setActiveMediaTab(tab.id)}
            activeOpacity={0.8}>
            <Text style={[st.mediaTabText, activeMediaTab === tab.id && st.mediaTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPhotosContent = () => {
    const gallery = city?.gallery || [];
    if (gallery.length === 0) {
      return (
        <View style={st.emptySection}>
          <Text style={st.emptyIcon}>📷</Text>
          <Text style={st.emptyText}>{t('SITE_DETAIL.NO_PHOTOS')}</Text>
        </View>
      );
    }
    return (
      <View style={st.photoGrid}>
        {gallery.map((img, idx) => {
          const uri = getImgUri(img);
          const isLarge = idx % 5 === 0;
          return (
            <TouchableOpacity
              key={idx}
              style={[st.photoItem, isLarge && st.photoItemLarge]}
              onPress={() => setActiveGalleryIdx(idx % (city?.gallery?.length || 1))}
              activeOpacity={0.9}>
              {uri ? (
                <Image source={{uri}} style={st.photoImg} resizeMode="cover" />
              ) : (
                <View style={[st.photoImg, st.photoPlaceholder]}>
                  <Text style={{fontSize: 28}}>📷</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderReviewsContent = () => {
    const rating = getRating();
    const comments = city?.comment || [];

    const getUserInitials = user => {
      if (!user?.name) return '?';
      return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
      <>
        {/* Compact rating + rate-this row */}
        <View style={st.reviewTopRow}>
          <View style={st.reviewScoreSide}>
            <Text style={st.reviewBigNum}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
            <View style={{flexDirection: 'row', gap: 2, marginTop: 4}}>
              {renderStars(rating, 16)}
            </View>
            <Text style={st.reviewSubCount}>{city.comment_count || 0} reviews</Text>
          </View>
          <View style={st.reviewRateSide}>
            <Text style={st.rateThisLabel}>Rate this place</Text>
            <StarRating
              rating={userRating}
              onChange={onStarRatingPress}
              enableHalfStar={false}
              starSize={26}
              color="#D97706"
            />
            <Text style={st.rateHintText}>Tap stars to rate</Text>
          </View>
        </View>

        {/* Write a review CTA */}
        <TouchableOpacity
          style={st.writeReviewBtn}
          onPress={async () => {
            if (await isGuestUser()) { setIsGuestPopup(true); return; }
            refRBSheet.current?.open();
          }}
          activeOpacity={0.85}>
          <Ionicons name="create-outline" size={16} color={C.oceanMid} />
          <Text style={st.writeReviewBtnText}>Write a Review</Text>
          <Ionicons name="chevron-forward" size={15} color={C.oceanMid} style={{marginLeft: 'auto'}} />
        </TouchableOpacity>

        {/* Existing comments */}
        {comments.length > 0 ? (
          <View style={st.commentsList}>
            {comments.map(item => {
              const raw = item.users ?? item.user;
              const user = Array.isArray(raw) ? raw[0] : raw;
              const initials = getUserInitials(user);
              return (
                <View key={item.id} style={st.commentCard}>
                  {/* Avatar */}
                  <View style={st.commentAvatarWrap}>
                    {user?.profile_picture ? (
                      <Image
                        source={{uri: `${FTP_PATH}${user.profile_picture}`}}
                        style={st.commentAvatar}
                      />
                    ) : (
                      <View style={st.commentAvatarFallback}>
                        <Text style={st.commentAvatarInitials}>{initials}</Text>
                      </View>
                    )}
                  </View>
                  {/* Content */}
                  <View style={st.commentContent}>
                    <View style={st.commentHeader}>
                      <Text style={st.commentUserName}>{user?.name || 'Traveler'}</Text>
                      <View style={st.commentVerifiedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={C.oceanMid} />
                        <Text style={st.commentVerifiedText}>Verified</Text>
                      </View>
                    </View>
                    <Text style={st.commentText}>{item.comment}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={st.emptySection}>
            <Text style={st.emptyIcon}>💬</Text>
            <Text style={st.emptyText}>No reviews yet. Be the first!</Text>
          </View>
        )}
      </>
    );
  };

  const renderMediaSection = () => (
    <View style={[st.contentBlock, {paddingHorizontal: 0}]}>
      {/* Section header */}
      <View style={[st.sectionHeaderRow, {paddingHorizontal: 16, marginBottom: 14}]}>
        <View style={st.sectionTitleRow}>
          <View style={st.sectionTitleDot} />
          <Text style={st.sectionTitle}>Photos & Reviews</Text>
        </View>
      </View>

      {/* Tab switcher */}
      {renderMediaTabs()}

      {/* Tab content */}
      <View style={{paddingHorizontal: 16, paddingTop: 12}}>
        {activeMediaTab === 'photos' ? renderPhotosContent() : renderReviewsContent()}
      </View>
    </View>
  );

  // ── Section: Villages ─────────────────────────────────────────────────────────
  const renderVillagesSection = () => {
    const sites = city?.sites || [];
    if (sites.length === 0) return null;
    const visible = sites.slice(0, 5);

    return (
      <View style={st.contentBlock}>
        <View style={[st.sectionHeaderRow, {marginBottom: 14}]}>
          <View style={st.sectionTitleRow}>
            <View style={st.sectionTitleDot} />
            <Text style={st.sectionTitle}>🏘 Villages</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigateTo(navigation, t('SCREEN.CITY_PLACE_SEARCH'), {
                initialParentId: city.id,
                initialCityName: city.name,
              })
            }
            style={st.seeMoreBtn}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={st.seeMoreBtnText}>{t('BUTTON.SEE_MORE')}</Text>
            <Ionicons name="chevron-forward" size={13} color={C.oceanMid} />
          </TouchableOpacity>
        </View>
        {visible.map(item => {
          const uri = getImgUri(item);
          return (
            <TouchableOpacity
              key={item.id}
              style={st.villageCard}
              onPress={() => navigateTo(navigation, t('SCREEN.SITE_DETAIL'), {city: item})}
              activeOpacity={0.85}>
              <View style={st.villageThumb}>
                {uri ? (
                  <Image source={{uri}} style={st.villageThumbImg} resizeMode="cover" />
                ) : (
                  <View style={st.villageThumbPlaceholder}>
                    <Text style={{fontSize: 22}}>🏘</Text>
                  </View>
                )}
              </View>
              <View style={st.villageInfo}>
                <Text style={st.villageName} numberOfLines={1}>{item.name}</Text>
                {item.tag_line ? (
                  <Text style={st.villageSub} numberOfLines={1}>{item.tag_line}</Text>
                ) : item.description ? (
                  <Text style={st.villageSub} numberOfLines={1}>{item.description.substring(0, 55)}</Text>
                ) : null}
                {parseFloat(item.rating_avg_rate) > 0 ? (
                  <View style={st.villageRatingRow}>
                    <Ionicons name="star" size={11} color="#D97706" />
                    <Text style={st.villageRatingText}>{Number(item.rating_avg_rate).toFixed(1)}</Text>
                  </View>
                ) : null}
              </View>
              <View style={st.villageChevron}>
                <Ionicons name="chevron-forward" size={16} color={C.textLight} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ── Section title helper ──────────────────────────────────────────────────────
  const SectionHeader = ({title}) => (
    <View style={[st.sectionHeaderRow, {marginBottom: 14}]}>
      <View style={st.sectionTitleRow}>
        <View style={st.sectionTitleDot} />
        <Text style={st.sectionTitle}>{title}</Text>
      </View>
    </View>
  );

  // ── Root render ───────────────────────────────────────────────────────────────
  return (
    <View style={st.root}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
      <Popup message={alertMessage} onPress={() => setIsAlert(false)} visible={isAlert} />

      <ScrollView style={st.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={st.scrollContent}>

        {/* 1. Hero */}
        {(isLoading && !city.name) ? <SkeletonHero /> : renderHero()}

        {/* 2. Gallery strip */}
        {renderGalleryStrip()}

        {/* 3. Title + tagline + location + description (unified card) */}
        {(isLoading && !city.name) ? <SkeletonInfo /> : renderTitleSection()}

        {/* 4. Rating card */}
        {(isLoading && !city.name) ? <SkeletonRating /> : renderRatingCard()}

        {/* 5. Quick info pills */}
        {renderQuickInfo()}

        {/* 6. Location map */}
        {renderLocationSection()}

        {/* 7. Mid Ad Banner */}
        <View style={st.adSection}>
          {(isLoading && !bannerObject.CITY_MIDDLE) ? (
            <SkeletonAdBanner />
          ) : (
            <AdBanner
              bannerImages={bannerObject?.CITY_MIDDLE}
              label="Sponsored"
              bannerHeight={SW / 2.5}
            />
          )}
        </View>

        {/* 8. Photos & Reviews tabs */}
        {(isLoading && !city.name) ? <SkeletonContent /> : renderMediaSection()}

        {/* 9. Popular Spots */}
        <View style={st.namedSection}>
          <View style={[st.sectionHeaderRow, {paddingHorizontal: 20, marginBottom: 14}]}>
            <View style={st.sectionTitleRow}>
              <View style={st.sectionTitleDot} />
              <Text style={st.sectionTitle}>Popular Spots</Text>
            </View>
          </View>
          <PopularSpotsSection navigation={navigation} trending={{}} offline={!offline} hideTitle />
        </View>

        {/* 10. Nearby Places */}
        <View style={st.namedSection}>
          <View style={[st.sectionHeaderRow, {paddingHorizontal: 20, marginBottom: 14}]}>
            <View style={st.sectionTitleRow}>
              <View style={st.sectionTitleDot} />
              <Text style={st.sectionTitle}>Nearby Places</Text>
            </View>
          </View>
          <NearbyPlacesSection hideTitle />
        </View>

        {/* 11. Villages */}
        {renderVillagesSection()}

        {/* 12. Footer Ad Banner */}
        <View style={[st.adSection, {marginBottom: 8}]}>
          {(isLoading && !bannerObject.CITY_FOOTER) ? (
            <SkeletonAdBanner />
          ) : (
            <AdBanner
              bannerImages={bannerObject?.CITY_FOOTER}
              label="Ad"
              bannerHeight={SW / 3.5}
            />
          )}
        </View>

      </ScrollView>

      {/* Fixed bottom action bar */}
      <View style={[st.bottomBar, {paddingBottom: Math.max(insets.bottom, 12)}]}>
        <TouchableOpacity style={st.bottomBtnSecondary} onPress={onShare} activeOpacity={0.85}>
          <Ionicons name="share-social-outline" size={18} color={C.oceanMid} />
          <Text style={st.bottomBtnSecondaryText}>{t('SITE_DETAIL.SHARE')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.bottomBtnPrimary} onPress={onDirections} activeOpacity={0.85}>
          <Ionicons name="navigate" size={18} color={C.white} />
          <Text style={st.bottomBtnPrimaryText}>{t('SITE_DETAIL.GET_DIRECTIONS')}</Text>
        </TouchableOpacity>
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
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 90},

  // Hero
  heroWrap: {width: '100%', height: HERO_H, overflow: 'hidden'},
  heroImage: {width: '100%', height: '100%'},
  heroPlaceholder: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  heroEmoji: {fontSize: 80},
  heroOverlay: {...StyleSheet.absoluteFillObject},
  heroBtn: {
    position: 'absolute', width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  offlineBadge: {
    position: 'absolute', bottom: 12, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50,
  },
  offlineBadgeText: {fontSize: 11, color: C.white, fontWeight: '600'},

  // Gallery strip
  galleryStripWrap: {marginTop: -42, paddingHorizontal: 16, zIndex: 10, marginBottom: 4},
  galleryStrip: {gap: 8, paddingBottom: 6},
  galleryThumb: {
    width: 66, height: 66, borderRadius: 12,
    backgroundColor: C.oceanFoam,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 2.5, borderColor: C.white,
  },
  galleryThumbActive: {borderColor: C.oceanMid, borderWidth: 2.5},
  galleryThumbImg: {width: '100%', height: '100%'},
  galleryThumbExtra: {backgroundColor: C.oceanMid},
  galleryExtraText: {fontSize: 14, fontWeight: '700', color: C.white},
  galleryActiveIndicator: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: C.oceanMid,
  },

  // Content block — standard section padding
  contentBlock: {paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8},

  // Title card inner divider (above description)
  titleDivider: {height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginVertical: 14},

  // Title card — white bg, elevated appearance
  titleCard: {
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    backgroundColor: C.white, borderRadius: RADIUS,
    padding: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },

  // Section card wrapper
  sectionCard: {
    backgroundColor: C.white, borderRadius: RADIUS,
    padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  sectionTitleDot: {
    width: 4, height: 18, borderRadius: 2, backgroundColor: C.oceanMid,
  },
  sectionTitle: {fontSize: 16, fontWeight: '700', color: C.textDark},

  // Category badges
  badgeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10},
  badge: {
    backgroundColor: C.oceanFoam, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 50, borderWidth: 1, borderColor: 'rgba(27,107,123,0.15)',
  },
  badgeHot: {backgroundColor: 'rgba(196,151,42,0.12)', borderColor: 'rgba(196,151,42,0.3)'},
  badgeText: {fontSize: 11, fontWeight: '600', color: C.oceanDeep},

  // Title
  placeTitle: {
    fontSize: SW > 380 ? 26 : 22, fontWeight: '700', color: C.textDark,
    marginBottom: 6, lineHeight: SW > 380 ? 32 : 28,
  },

  // Inline rating row
  inlineRatingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12,
  },
  inlineStars: {flexDirection: 'row', gap: 1},
  inlineRatingNum: {fontSize: 13, fontWeight: '700', color: '#D97706'},
  inlineRatingDot: {fontSize: 13, color: C.textLight},
  inlineReviewCount: {fontSize: 12, color: C.textLight},

  // Tag line styled gradient
  tagLineGradient: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(27,107,123,0.18)',
  },
  tagLineText: {
    flex: 1, fontSize: 13, fontStyle: 'italic',
    color: C.oceanDeep, lineHeight: 19, fontWeight: '500',
  },

  // Location row
  locationRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  locationChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(27,107,123,0.08)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(27,107,123,0.15)',
  },
  locationChipText: {fontSize: 12, color: C.oceanMid, fontWeight: '600'},

  // Description
  description: {fontSize: 14, lineHeight: 22, color: C.textMid},
  readMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, alignSelf: 'flex-start',
  },
  readMoreText: {fontSize: 13, fontWeight: '600', color: C.oceanMid},

  // Rating card
  ratingCard: {
    flexDirection: 'row', gap: 16,
    backgroundColor: C.white, borderRadius: RADIUS, padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  ratingLeft: {alignItems: 'center', justifyContent: 'center', minWidth: 80},
  ratingBig: {fontSize: 44, fontWeight: '700', color: C.textDark, lineHeight: 52},
  ratingCount: {fontSize: 11, color: C.textLight, marginTop: 2, textAlign: 'center'},
  ratingDivider: {width: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginVertical: 4},
  ratingRight: {flex: 1, justifyContent: 'center', gap: 5},
  starRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  starRowLabel: {fontSize: 10, color: C.textLight, width: 28},
  starBarBg: {flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden'},
  starBarFill: {height: '100%', backgroundColor: '#D97706', borderRadius: 3},
  starRowPct: {fontSize: 10, color: C.textLight, width: 28, textAlign: 'right'},

  // Quick info pills
  quickInfoRow: {gap: 8, paddingBottom: 4},
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.white, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 50, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  infoPillText: {fontSize: 12, color: C.textMid, fontWeight: '500'},

  // Location / Map
  mapOuterCard: {
    borderRadius: RADIUS + 2,
    borderWidth: 1.5, borderColor: 'rgba(27,107,123,0.22)',
    backgroundColor: C.oceanFoam,
    padding: 3, marginBottom: 10, overflow: 'hidden',
  },
  mapInnerCard: {borderRadius: RADIUS, overflow: 'hidden', height: SW * 0.55},
  mapView: {flex: 1},
  mapOpenBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(27,107,123,0.1)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(27,107,123,0.25)',
  },
  mapOpenBtnText: {fontSize: 12, fontWeight: '600', color: C.oceanMid},

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
    backgroundColor: C.sandPale, borderRadius: RADIUS,
    borderWidth: 2, borderColor: C.sandMid, borderStyle: 'dashed',
    overflow: 'hidden', minHeight: 120,
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

  // Media tabs
  mediaTabsWrap: {paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2},
  mediaTabsInner: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12, padding: 4,
  },
  mediaTab: {flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10},
  mediaTabActive: {
    backgroundColor: C.white,
    borderWidth: 1, borderColor: 'rgba(27,107,123,0.15)',
  },
  mediaTabText: {fontSize: 13, fontWeight: '600', color: C.textLight},
  mediaTabTextActive: {color: C.oceanMid},

  // Photos grid
  photoGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  photoItem: {width: (SW - 48) / 2, height: (SW - 48) / 2 * 0.75, borderRadius: 10, overflow: 'hidden'},
  photoItemLarge: {width: SW - 32, height: SW * 0.5},
  photoImg: {width: '100%', height: '100%'},
  photoPlaceholder: {backgroundColor: C.oceanFoam, alignItems: 'center', justifyContent: 'center'},

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
  writeReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(27,107,123,0.07)',
    borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5, borderColor: 'rgba(27,107,123,0.2)',
  },
  writeReviewBtnText: {fontSize: 14, fontWeight: '700', color: C.oceanMid, flex: 1},

  // Comments list
  commentsList: {gap: 10},
  commentCard: {
    flexDirection: 'row', gap: 10,
    backgroundColor: C.white, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  commentAvatarWrap: {flexShrink: 0},
  commentAvatar: {width: 40, height: 40, borderRadius: 20},
  commentAvatarFallback: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.oceanMid,
    alignItems: 'center', justifyContent: 'center',
  },
  commentAvatarInitials: {fontSize: 15, fontWeight: '700', color: C.white},
  commentContent: {flex: 1},
  commentHeader: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4},
  commentUserName: {fontSize: 13, fontWeight: '700', color: C.textDark},
  commentVerifiedBadge: {flexDirection: 'row', alignItems: 'center', gap: 3},
  commentVerifiedText: {fontSize: 10, color: C.oceanMid, fontWeight: '600'},
  commentText: {fontSize: 13, lineHeight: 19, color: C.textMid},

  // Named section wrapper (for Popular Spots / Nearby)
  namedSection: {marginTop: 20},

  // Villages
  villageCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.white, borderRadius: 14, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  villageThumb: {
    width: 64, height: 64, borderRadius: 12,
    overflow: 'hidden', flexShrink: 0,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  villageThumbImg: {width: '100%', height: '100%'},
  villageThumbPlaceholder: {
    flex: 1, backgroundColor: C.oceanFoam,
    alignItems: 'center', justifyContent: 'center',
  },
  villageInfo: {flex: 1},
  villageName: {fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 3},
  villageSub: {fontSize: 11, color: C.textLight, marginBottom: 4, lineHeight: 16},
  villageRatingRow: {flexDirection: 'row', alignItems: 'center', gap: 3},
  villageRatingText: {fontSize: 11, fontWeight: '600', color: '#D97706'},
  villageChevron: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  seeMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(27,107,123,0.08)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(27,107,123,0.18)',
  },
  seeMoreBtnText: {fontSize: 12, fontWeight: '600', color: C.oceanMid},

  // Empty state
  emptySection: {alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20},
  emptyIcon: {fontSize: 44, marginBottom: 12, opacity: 0.35},
  emptyText: {fontSize: 13, color: C.textLight, textAlign: 'center'},

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
