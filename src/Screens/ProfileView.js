import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  ScrollView,
  BackHandler,
  RefreshControl,
  Share,
  Alert,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Image} from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connect} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {FTP_PATH} from '@env';
import {
  comnPost,
  dataSync,
  saveToStorage,
  getFromStorage,
} from '../Services/Api/CommonServices';
import {setLoader} from '../Reducers/CommonActions';
import {checkLogin, backPage} from '../Services/CommonMethods';
import STRING from '../Services/Constants/STRINGS';
import MapView, {Marker} from 'react-native-maps';
import Clipboard from '@react-native-clipboard/clipboard';
import CheckNet from '../Components/Common/CheckNet';
import SkeletonBox from '../Components/Common/SkeletonBox';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PHOTO_SIZE = 130;
const MAP_HEIGHT = 220;
const PHOTO_OVERLAP = PHOTO_SIZE / 2; // 55 — half photo sits on the map

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanFoam: '#B8E4EA',
  sandMid: '#C4972A',
  cream: '#FAF7F0',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  white: '#FFFFFF',
  amber: '#F59E0B',
  blue: '#3B82F6',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const calcCompletion = profile => {
  if (!profile || !profile.id) return 0;
  let completed = 0;
  if (profile.name) completed++;
  if (profile.email) completed++;
  if (profile.gender) completed++;
  if (profile.dob) completed++;
  if (profile.addresses && profile.addresses.length > 0) completed++;
  return Math.round((completed / 5) * 100);
};

const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};

const formatMemberSince = dateString => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

const formatWallet = amount => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toFixed(2)}`;
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────

const ProfileViewSkeleton = ({onBack}) => (
  <View>
    {/* Map area */}
    <View style={{height: MAP_HEIGHT, backgroundColor: '#C8D1D6', position: 'relative'}}>
      <TouchableOpacity
        style={{
          position: 'absolute', top: 14, left: 14,
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: 'rgba(0,0,0,0.25)',
          alignItems: 'center', justifyContent: 'center', zIndex: 5,
        }}
        onPress={onBack}
        activeOpacity={0.8}>
        <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </View>

    {/* Profile info row — right of floating photo */}
    <View style={{
      minHeight: PHOTO_OVERLAP + 20,
      paddingTop: 12, paddingBottom: 16,
      paddingLeft: 16 + PHOTO_SIZE + 14,
      paddingRight: 16,
      backgroundColor: C.white,
      justifyContent: 'center',
    }}>
      <SkeletonBox width={150} height={18} borderRadius={5} style={{marginBottom: 8}} />
      <SkeletonBox width={110} height={12} borderRadius={4} style={{marginBottom: 8}} />
      <SkeletonBox width={80} height={20} borderRadius={10} />
    </View>

    {/* Floating photo circle */}
    <View style={{
      position: 'absolute',
      top: MAP_HEIGHT - PHOTO_OVERLAP,
      left: 16,
      width: PHOTO_SIZE, height: PHOTO_SIZE,
      borderRadius: PHOTO_SIZE / 2,
      backgroundColor: '#B0BBC1',
      borderWidth: 3, borderColor: C.white,
    }} />

    {/* Content */}
    <View style={{padding: 16, backgroundColor: C.cream}}>
      {/* Completion card */}
      <SkeletonBox width="100%" height={88} borderRadius={14} style={{marginBottom: 16}} />

      {/* Stats */}
      <SkeletonBox width={120} height={14} borderRadius={4} style={{marginBottom: 10}} />
      <View style={{flexDirection: 'row', gap: 10, marginBottom: 16}}>
        {[0, 1, 2, 3].map(i => (
          <SkeletonBox key={i} width={96} height={90} borderRadius={14} />
        ))}
      </View>

      {/* Payment */}
      <SkeletonBox width={120} height={14} borderRadius={4} style={{marginBottom: 10}} />
      <SkeletonBox width="100%" height={80} borderRadius={14} style={{marginBottom: 16}} />

      {/* Refer */}
      <SkeletonBox width="100%" height={120} borderRadius={14} style={{marginBottom: 16}} />

      {/* Buttons */}
      <SkeletonBox width="100%" height={50} borderRadius={14} style={{marginBottom: 12}} />
      <SkeletonBox width="100%" height={50} borderRadius={14} style={{marginBottom: 20}} />
    </View>
  </View>
);

// ─── Component ─────────────────────────────────────────────────────────────────

const ProfileView = ({navigation, ...props}) => {
  const {t} = useTranslation();

  const [profile, setProfile] = useState({});
  const [currentLatitude, setCurrentLatitude] = useState(null);
  const [currentLongitude, setCurrentLongitude] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const didFirstLoad = useRef(false);
  const contentFade = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    if (didFirstLoad.current) return;
    didFirstLoad.current = true;
    setLoading(false);
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  };

  // ── Back handler ─────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener(
        t('EVENT.HARDWARE_BACK_PRESS'),
        () => {
          backPage(navigation);
          return true;
        },
      );
      return () => handler.remove();
    }, [navigation, t]),
  );

  // ── Re-fetch after returning from Profile.js ─────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isUpdated').then(val => {
        if (val === 'true') {
          AsyncStorage.setItem('isUpdated', 'false');
          if (props.mode) {
            getUserProfile().then(data => {
              if (data) applyProfile(data);
            });
          }
        }
      });
    }, [props.mode]),
  );

  // ── Re-fetch after language change ────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('isLangChanged').then(val => {
        if (val === 'true') {
          AsyncStorage.setItem('isLangChanged', 'false');
          if (props.mode) {
            getUserProfile().then(data => {
              if (data) applyProfile(data);
            });
          }
        }
      });
    }, [props.mode]),
  );

  // ── Initial data load ────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    let unsubscribeNetInfo;

    checkLogin(navigation);

    const init = async () => {
      const localData = await getFromStorage(t('STORAGE.PROFILE_RESPONSE'));
      if (localData && isMounted) {
        const res = JSON.parse(localData);
        setProfile(res);
        if (res?.addresses?.length > 0) {
          setLocationMap(res.addresses[0].latitude, res.addresses[0].longitude);
        }
        fadeIn();
        props.setLoader(false);
      }

      unsubscribeNetInfo = NetInfo.addEventListener(state => {
        if (!isMounted) return;
        setOffline(!state.isConnected);
        dataSync(
          t('STORAGE.PROFILE_RESPONSE'),
          () => getUserProfile(),
          props.mode,
        ).then(resp => {
          if (!isMounted) return;
          if (resp) {
            const res = JSON.parse(resp);
            setProfile(res);
            if (res?.addresses?.length > 0) {
              setLocationMap(
                res.addresses[0].latitude,
                res.addresses[0].longitude,
              );
            }
            fadeIn();
          }
          props.setLoader(false);
          setRefreshing(false);
        });
      });
    };

    init();

    return () => {
      isMounted = false;
      if (unsubscribeNetInfo) unsubscribeNetInfo();
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const setLocationMap = (lat, long) => {
    if (!lat || !long) return;
    const latF = parseFloat(lat);
    const longF = parseFloat(long);
    setInitialRegion({
      latitude: latF,
      longitude: longF,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    setCurrentLatitude(latF);
    setCurrentLongitude(longF);
  };

  const applyProfile = data => {
    setProfile(data);
    if (data?.addresses?.length > 0) {
      setLocationMap(data.addresses[0].latitude, data.addresses[0].longitude);
    }
    fadeIn();
  };

  const getUserProfile = () => {
    if (!props.mode) return Promise.resolve(null);
    return comnPost('v2/user-profile', props.access_token, navigation)
      .then(async res => {
        if (res?.data?.data) {
          const data = res.data.data;
          console.log(data);
          
          await saveToStorage(
            t('STORAGE.PROFILE_RESPONSE'),
            JSON.stringify(data),
          );
          // Update UI directly so fresh fields (wallets_sum_amount etc.) always show
          setProfile(data);
          if (data?.addresses?.length > 0) {
            setLocationMap(data.addresses[0].latitude, data.addresses[0].longitude);
          }
          fadeIn();
          return data;
        }
        return null;
      })
      .catch(() => null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (props.mode) {
      getUserProfile().then(data => {
        if (data) applyProfile(data);
        setRefreshing(false);
        props.setLoader(false);
      });
    } else {
      setRefreshing(false);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleLocationShare = async () => {
    if (profile.addresses && profile.addresses.length > 0) {
      const addr = profile.addresses[0];
      const mapUrl = `https://maps.google.com/?q=${addr.latitude},${addr.longitude}`;
      const msg = addr.place ? `📍 ${addr.place}\n${mapUrl}` : `📍 ${mapUrl}`;
      try {
        await Share.share({message: msg});
      } catch (err) {
        console.error('Location share error:', err);
      }
    }
  };

  const handleLogout = () => setLogoutVisible(true);

  const confirmLogout = async () => {
    setLogoutVisible(false);
    try {
      const state = await NetInfo.fetch();
      const isConnected = state.isConnected;
      const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
      if ((!isConnected && !mode) || (!isConnected && mode) || (isConnected && !mode)) {
        const alertMsg =
          !isConnected && !mode
            ? t('ALERT.NETWORK')
            : !isConnected && mode
            ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE')
            : t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE');
        Alert.alert('', alertMsg, [{text: 'OK'}]);
        return;
      }
      props.setLoader(true);
      const res = await comnPost('v2/logout');
      if (res.data.success) {
        await GoogleSignin.signOut();
        await AsyncStorage.clear();
        navigation.reset({index: 0, routes: [{name: STRING.SCREEN.EMAIL}]});
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      props.setLoader(false);
    }
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(profile.uid || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      const deepLink = `awesomeapp://SignUp?code=${profile.uid}`;
      const shareMessage =
        t('REFER_EARN') + `\nReferral code: ${profile.uid}`;
      await Share.share({message: shareMessage, url: deepLink});
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate(STRING.SCREEN.PROFILE);
  };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const completion = calcCompletion(profile);
  const personalInfoComplete = !!(profile.gender && profile.dob);
  const showCompletionCard = profile.id && completion < 100;
  const showPersonalCard = profile.id && !personalInfoComplete;
  const showInfoBox = profile.id && completion < 100;

  const photoUri = profile.profile_picture
    ? `${FTP_PATH}${profile.profile_picture}`
    : 'https://api-private.atlassian.com/users/2143ab39b9c73bcab4fe6562fff8d23d/avatar';

  const hasLocation =
    initialRegion && currentLatitude && profile.id;

  const favCount = String(
    profile.favourites_count ?? profile.favourites?.length ?? 0,
  );
  const revCount = String(
    profile.reviews_count ?? profile.reviews?.length ?? 0,
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} style={s.safe}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <CheckNet isOff={offline} />

        {loading ? (
          <ProfileViewSkeleton onBack={() => backPage(navigation)} />
        ) : (
        <Animated.View style={{opacity: contentFade}}>

        {/* ── Top section: map + floating photo + profile info ── */}
        <View style={s.topSection}>

          {/* Map clip — bounded, rounded at top */}
          <View style={s.mapClip}>
            {profile.id ? (
              hasLocation ? (
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  region={{
                    latitude: currentLatitude,
                    longitude: currentLongitude,
                    latitudeDelta: initialRegion?.latitudeDelta || 0.01,
                    longitudeDelta: initialRegion?.longitudeDelta || 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}>
                  <Marker
                    coordinate={{
                      latitude: currentLatitude,
                      longitude: currentLongitude,
                    }}
                  />
                </MapView>
              ) : (
                <View style={s.mapBg}>
                  <Ionicons
                    name="location-outline"
                    size={36}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text style={s.mapBgText}>
                    {t('PROFILE_SCREEN.NO_LOCATION_SET')}
                  </Text>
                </View>
              )
            ) : (
              <View style={s.mapSkeletonBg} />
            )}

            {/* Back button — top-left */}
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => backPage(navigation)}
              activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color={C.white} />
            </TouchableOpacity>

            {/* Location share — bottom-right */}
            {profile.id && (
              <TouchableOpacity
                style={s.locationShareBtn}
                onPress={handleLocationShare}
                activeOpacity={0.8}>
                <Ionicons name="navigate-outline" size={18} color={C.white} />
              </TouchableOpacity>
            )}
          </View>

          {/* Profile info row — sits directly below map & photo */}
          <View style={s.profileInfoRow}>
            <View style={s.nameRow}>
              <Text style={s.profileName} numberOfLines={1}>
                {profile.name || ''}
              </Text>
              {profile.isVerified === 1 && (
                <View style={s.verifiedBadge}>
                  <Ionicons name="checkmark" size={11} color={C.white} />
                </View>
              )}
            </View>
            <Text style={s.profileEmail} numberOfLines={1}>
              {profile.email || ''}
            </Text>
            {!!profile.created_at && (
              <View style={s.memberSincePill}>
                <Text style={s.memberSinceText}>
                  {`${t('PROFILE_SCREEN.MEMBER_SINCE')} ${formatMemberSince(profile.created_at)}`}
                </Text>
              </View>
            )}
          </View>

          {/* Floating photo — half on map, half on info row */}
          <View style={s.photoWrap}>
            <Image
              source={{uri: photoUri}}
              style={s.photo}
              containerStyle={s.photoContainer}
              PlaceholderContent={
                <View style={s.photoPlaceholder}>
                  <Text style={s.photoEmoji}>🌸</Text>
                </View>
              }
            />
          </View>
        </View>

        {/* ── Content section ── */}
        <View style={s.content}>

          {/* Profile completion card */}
          {showCompletionCard && (
            <View style={s.completionCard}>
              <View style={s.completionHeader}>
                <View style={s.completionTitleRow}>
                  <Text style={s.completionEmoji}>📋</Text>
                  <Text style={s.completionTitle}>
                    {t('PROFILE_SCREEN.COMPLETE_PROFILE')}
                  </Text>
                </View>
                <Text style={s.completionPercent}>{completion}%</Text>
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressBar, {width: `${completion}%`}]} />
              </View>
              <Text style={s.completionText}>
                {t('PROFILE_SCREEN.COMPLETION_TEXT')}
              </Text>
            </View>
          )}

          {/* Personal info card */}
          {showPersonalCard && (
            <View
              style={[
                s.detailCard,
                !personalInfoComplete && s.detailCardIncomplete,
              ]}>
              <View style={s.detailHeader}>
                <Text style={s.detailHeaderTitle}>
                  {t('PROFILE_SCREEN.PERSONAL_INFO')}
                </Text>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={handleEditProfile}
                  activeOpacity={0.8}>
                  <Text style={s.editBtnText}>
                    {`✏️  ${t('PROFILE_SCREEN.EDIT')}`}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={s.detailRow}>
                <View style={s.detailItem}>
                  <Text style={s.detailLabel}>
                    {t('PROFILE_SCREEN.GENDER')}
                  </Text>
                  <Text
                    style={[
                      s.detailValue,
                      !profile.gender && s.detailValueEmpty,
                    ]}>
                    {profile.gender || t('PROFILE_SCREEN.NOT_SET')}
                  </Text>
                </View>
                <View style={s.detailDivider} />
                <View style={s.detailItem}>
                  <Text style={s.detailLabel}>
                    {t('PROFILE_SCREEN.DOB')}
                  </Text>
                  <Text
                    style={[
                      s.detailValue,
                      !profile.dob && s.detailValueEmpty,
                    ]}>
                    {profile.dob
                      ? formatDate(profile.dob)
                      : t('PROFILE_SCREEN.NOT_SET')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* My Activity */}
          <View style={s.statsSection}>
            <Text style={s.sectionTitle}>
              {t('PROFILE_SCREEN.MY_ACTIVITY')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.statsScroll}>
              <TouchableOpacity style={s.statCard} activeOpacity={0.8}>
                <Text style={s.statIcon}>❤️</Text>
                <Text style={s.statValue}>{favCount}</Text>
                <Text style={s.statLabel}>
                  {t('PROFILE_SCREEN.FAVORITES')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.statCard} activeOpacity={0.8}>
                <Text style={s.statIcon}>⭐</Text>
                <Text style={s.statValue}>{revCount}</Text>
                <Text style={s.statLabel}>
                  {t('PROFILE_SCREEN.REVIEWS')}
                </Text>
              </TouchableOpacity>
              <View style={[s.statCard, s.statCardDisabled]}>
                <Text style={s.statIcon}>🎫</Text>
                <Text style={s.statValue}>--</Text>
                <Text style={s.statLabel}>
                  {t('PROFILE_SCREEN.BOOKINGS')}
                </Text>
              </View>
              <View style={[s.statCard, s.statCardDisabled]}>
                <Text style={s.statIcon}>📍</Text>
                <Text style={s.statValue}>--</Text>
                <Text style={s.statLabel}>
                  {t('PROFILE_SCREEN.VISITED')}
                </Text>
              </View>
            </ScrollView>
          </View>

          {/* Payments */}
          <View style={s.paymentSection}>
            <Text style={s.sectionTitle}>
              {t('PROFILE_SCREEN.PAYMENTS_TITLE')}
            </Text>
            <TouchableOpacity style={s.paymentCard} activeOpacity={0.85}>
              <Text style={s.paymentIcon}>💰</Text>
              <View style={s.paymentInfo}>
                <Text style={s.paymentLabel}>
                  {t('PROFILE_SCREEN.WALLET_LABEL')}
                </Text>
                <Text style={s.paymentValue}>
                  {formatWallet(profile.wallets_sum_amount)}
                </Text>
                <Text style={s.paymentDesc}>
                  {t('PROFILE_SCREEN.WALLET_DESC')}
                </Text>
              </View>
              <Text style={s.paymentArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Refer & Share */}
          <View style={s.referSection}>
            <View style={s.referHeader}>
              <Text style={s.referEmoji}>🎁</Text>
              <Text style={s.referTitle}>
                {t('PROFILE_SCREEN.REFER_TITLE')}
              </Text>
              <Text style={s.referSubtitle}>
                {t('PROFILE_SCREEN.REFER_SUBTITLE')}
              </Text>
            </View>
            {/* Code chip — tap to copy directly to clipboard */}
            <TouchableOpacity
              style={[s.codeChip, copied && s.codeChipCopied]}
              onPress={handleCopy}
              activeOpacity={0.8}>
              <Text style={s.codeChipValue}>
                {profile.uid || '------'}
              </Text>
              <View style={s.codeChipDivider} />
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={16}
                color={copied ? C.white : 'rgba(255,255,255,0.85)'}
              />
              <Text style={s.codeChipAction}>
                {copied ? 'Copied!' : t('PROFILE_SCREEN.COPY')}
              </Text>
            </TouchableOpacity>

            {/* Share link button */}
            <TouchableOpacity
              style={s.shareLinkBtn}
              onPress={handleShare}
              activeOpacity={0.8}>
              <Ionicons name="share-social-outline" size={18} color={C.oceanMid} />
              <Text style={s.shareLinkText}>
                {t('PROFILE_SCREEN.SHARE')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Edit Profile */}
          <TouchableOpacity
            style={s.editProfileBtn}
            onPress={handleEditProfile}
            activeOpacity={0.8}>
            <Text style={s.editProfileBtnText}>
              {`✏️   ${t('PROFILE_SCREEN.EDIT_PROFILE')}`}
            </Text>
          </TouchableOpacity>

          {/* Info box */}
          {showInfoBox && (
            <View style={s.infoBox}>
              <Text style={s.infoIcon}>💡</Text>
              <Text style={s.infoText}>
                {t('PROFILE_SCREEN.PROFILE_HELP')}
              </Text>
            </View>
          )}

          {/* Sign Out */}
          <TouchableOpacity
            style={s.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}>
            <Text style={s.logoutBtnText}>
              {`🚪   ${t('PROFILE_SCREEN.SIGN_OUT')}`}
            </Text>
          </TouchableOpacity>

        </View>

        </Animated.View>
        )}

      </ScrollView>

      {/* ── Logout confirmation modal ── */}
      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLogoutVisible(false)}>
        <Pressable style={s.lModal} onPress={() => setLogoutVisible(false)}>
          <Pressable style={s.lCard} onPress={() => {}}>
            <View style={s.lIconWrap}>
              <Text style={s.lIconEmoji}>🚪</Text>
            </View>
            <Text style={s.lTitle}>{t('PROFILE_SCREEN.LOGOUT_CONFIRM_TITLE')}</Text>
            <Text style={s.lMessage}>{t('PROFILE_SCREEN.LOGOUT_CONFIRM')}</Text>
            <View style={s.lBtnRow}>
              <TouchableOpacity
                style={s.lBtnCancel}
                onPress={() => setLogoutVisible(false)}
                activeOpacity={0.85}>
                <Text style={s.lBtnCancelText}>{t('BUTTON.NO')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.lBtnConfirm}
                onPress={confirmLogout}
                activeOpacity={0.85}>
                <Text style={s.lBtnConfirmText}>{t('BUTTON.YES')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.white},
  scroll: {flex: 1, backgroundColor: C.cream},

  // ── Top section (map + photo + info)
  topSection: {
    backgroundColor: C.white,
    position: 'relative',
  },

  // ── Map
  mapClip: {
    height: MAP_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: C.oceanDeep,
  },
  mapBg: {
    flex: 1,
    backgroundColor: C.oceanMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBgText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 8,
  },
  mapSkeletonBg: {
    flex: 1,
    backgroundColor: '#C8D6DA',
  },

  // Back btn — inside mapClip, absolutely positioned
  backBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  // Location share btn — inside mapClip, bottom-right
  locationShareBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  // ── Floating profile photo (half on map, half below)
  photoWrap: {
    position: 'absolute',
    top: MAP_HEIGHT - PHOTO_OVERLAP, // = 155
    left: 16,
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 3,
    borderColor: C.white,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    backgroundColor: C.oceanFoam,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: {fontSize: 40, textAlign: 'center'},

  // ── Profile info row (below map, text to right of floating photo)
  profileInfoRow: {
    minHeight: PHOTO_OVERLAP + 20, // tall enough to show photo's lower half
    paddingTop: 12,
    paddingBottom: 16,
    paddingLeft: 16 + PHOTO_SIZE + 14, // skip: left margin + photo width + gap
    paddingRight: 16,
    backgroundColor: C.white,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textDark,
    marginRight: 6,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmail: {
    fontSize: 13,
    color: C.textMid,
    marginBottom: 8,
  },
  memberSincePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  memberSinceText: {
    fontSize: 11,
    color: C.textLight,
  },

  // ── Content
  content: {
    padding: 16,
  },

  // ── Completion card
  completionCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  completionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionEmoji: {fontSize: 15, marginRight: 6},
  completionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  completionPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D97706',
  },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: C.sandMid,
    borderRadius: 3,
  },
  completionText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },

  // ── Detail card
  detailCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  detailCardIncomplete: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.amber,
    backgroundColor: '#FFFBEB',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  detailHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textDark,
  },
  editBtn: {
    backgroundColor: C.oceanMid,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.white,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {flex: 1},
  detailDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 14,
  },
  detailLabel: {
    fontSize: 10,
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textDark,
  },
  detailValueEmpty: {
    color: C.textLight,
    fontStyle: 'italic',
    fontSize: 13,
    fontWeight: '400',
  },

  // ── Stats
  statsSection: {marginBottom: 16},
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 10,
  },
  statsScroll: {paddingBottom: 4},
  statCard: {
    minWidth: 100,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  statCardDisabled: {opacity: 0.4},
  statIcon: {fontSize: 26, marginBottom: 6, textAlign: 'center'},
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: C.oceanMid,
    marginBottom: 3,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: C.textLight,
    textAlign: 'center',
  },

  // ── Payments
  paymentSection: {marginBottom: 16},
  paymentCard: {
    backgroundColor: C.sandMid,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {fontSize: 40, marginRight: 14},
  paymentInfo: {flex: 1},
  paymentLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  paymentValue: {
    fontSize: 26,
    fontWeight: '700',
    color: C.white,
    marginBottom: 3,
  },
  paymentDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 15,
  },
  paymentArrow: {
    fontSize: 26,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 8,
  },

  // ── Refer
  referSection: {
    backgroundColor: C.oceanMid,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  referHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  referEmoji: {fontSize: 28, marginBottom: 6, textAlign: 'center'},
  referTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
    marginBottom: 3,
    textAlign: 'center',
  },
  referSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 5,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
  },
  // Code chip — tap to copy
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    marginBottom: 12,
    gap: 8,
  },
  codeChipCopied: {
    backgroundColor: 'rgba(34,197,94,0.3)',
    borderColor: 'rgba(34,197,94,0.6)',
    borderStyle: 'solid',
  },
  codeChipValue: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 2,
  },
  codeChipDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  codeChipAction: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },

  // Share link button — distinct solid white style
  shareLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
    borderRadius: 50,
    paddingVertical: 12,
    gap: 8,
  },
  shareLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.oceanMid,
  },

  // ── Edit Profile btn
  editProfileBtn: {
    borderWidth: 1.5,
    borderColor: C.oceanMid,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: C.white,
    marginBottom: 12,
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.oceanMid,
  },

  // ── Info box
  infoBox: {
    backgroundColor: '#DBEAFE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {fontSize: 20, marginRight: 10},
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },

  // ── Logout btn
  logoutBtn: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: C.white,
    marginBottom: 20,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMid,
  },

  // ── Logout modal (matches ModePopup card style)
  lModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  lCard: {
    width: '100%',
    backgroundColor: C.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  lIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFE4E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lIconEmoji: {fontSize: 32},
  lTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  lMessage: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  lBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  lBtnCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  lBtnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMid,
  },
  lBtnConfirm: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  lBtnConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white,
  },
});

// ─── Redux ─────────────────────────────────────────────────────────────────────

const mapStateToProps = state => ({
  access_token: state.commonState.access_token,
  mode: state.commonState.mode,
});

const mapDispatchToProps = dispatch => ({
  setLoader: data => dispatch(setLoader(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProfileView);
