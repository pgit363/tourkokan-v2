import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  BackHandler,
  TextInput,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Image} from '@rneui/themed';
import {connect} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import {Dropdown} from 'react-native-element-dropdown';
import MapView, {Marker} from 'react-native-maps';
import {
  comnPost,
  saveToStorage,
  getFromStorage,
} from '../Services/Api/CommonServices';
import {setLoader, setMode, setProfilePicture} from '../Reducers/CommonActions';
import {checkLogin, backPage, navigateTo} from '../Services/CommonMethods';
import STRING from '../Services/Constants/STRINGS';
import CheckNet from '../Components/Common/CheckNet';
import Popup from '../Components/Common/Popup';
import ModePopup from '../Components/Common/ModePopup';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  sandMid: '#C4972A',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
};

const {width: SCREEN_W} = Dimensions.get('window');
const PHOTO_SIZE = Math.min(SCREEN_W * 0.28, 110);

// ─── Date data ─────────────────────────────────────────────────────────────────

const DAYS = Array.from({length: 31}, (_, i) => {
  const d = String(i + 1).padStart(2, '0');
  return {label: d, value: d};
});

const MONTHS = [
  {label: 'Jan', value: '01'},
  {label: 'Feb', value: '02'},
  {label: 'Mar', value: '03'},
  {label: 'Apr', value: '04'},
  {label: 'May', value: '05'},
  {label: 'Jun', value: '06'},
  {label: 'Jul', value: '07'},
  {label: 'Aug', value: '08'},
  {label: 'Sep', value: '09'},
  {label: 'Oct', value: '10'},
  {label: 'Nov', value: '11'},
  {label: 'Dec', value: '12'},
];

const CY = new Date().getFullYear();
const YEARS = Array.from({length: 80}, (_, i) => {
  const y = String(CY - i);
  return {label: y, value: y};
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

const parseDate = str => {
  if (!str) return {day: null, month: null, year: null};
  const parts = str.split('-');
  if (parts.length !== 3) return {day: null, month: null, year: null};
  return {
    day: parts[2].padStart(2, '0'),
    month: parts[1].padStart(2, '0'),
    year: parts[0],
  };
};

const formatDateToAPI = ({day, month, year}) => {
  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
};

// ─── Profile (Edit) Screen ─────────────────────────────────────────────────────

const Profile = ({navigation, ...props}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  // ── Profile data
  const [profile, setProfile] = useState({});

  // ── Editable fields
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState({day: null, month: null, year: null});
  const [gender, setGender] = useState('');

  // ── Location
  const [locationLat, setLocationLat] = useState(null);
  const [locationLng, setLocationLng] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // ── Initial snapshot (to detect changes)
  const initialRef = useRef({});

  // ── UI state
  const [offline, setOffline] = useState(false);
  const [modePopupVisible, setModePopupVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlert, setIsAlert] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Back handler (same pattern as Settings / TermsScreen)
  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          backPage(navigation);
          return true;
        },
      );
      return () => handler.remove();
    }, [navigation]),
  );

  // ── Initial load
  useEffect(() => {
    AsyncStorage.setItem('isUpdated', 'false');
    checkLogin(navigation);
    props.setLoader(true);

    const load = async () => {
      // Load from cache first for instant display
      const stored = await getFromStorage(t('STORAGE.PROFILE_RESPONSE'));
      if (stored) {
        applyProfile(JSON.parse(stored));
        props.setLoader(false);
      }

      // Check connectivity
      const netState = await NetInfo.fetch();
      setOffline(!netState.isConnected);

      // If online, refresh from API
      if (netState.isConnected && props.mode) {
        const fresh = await getUserProfile();
        if (fresh) applyProfile(fresh);
        props.setLoader(false);
      } else {
        props.setLoader(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Listen to connectivity changes after mount
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setOffline(!state.isConnected);
    });
    return () => unsub();
  }, []);

  // ── Apply profile to form fields
  const applyProfile = data => {
    setProfile(data);
    setMobile(data.mobile || '');
    setDob(parseDate(data.dob));
    setGender(data.gender || '');
    const addr = data.addresses?.[0];
    const lat = addr?.latitude ? parseFloat(addr.latitude) : null;
    const lng = addr?.longitude ? parseFloat(addr.longitude) : null;
    setLocationLat(lat);
    setLocationLng(lng);

    // Snapshot initial values for change detection
    initialRef.current = {
      mobile: data.mobile || '',
      dob: data.dob || null,
      gender: data.gender || '',
      locationLat: lat,
      locationLng: lng,
    };
  };

  const getUserProfile = async () => {
    console.log('[Profile] GET user-profile → payload:', {access_token: props.access_token});
    try {
      const res = await comnPost('v2/user-profile', props.access_token);
      console.log('[Profile] GET user-profile ← response:', JSON.stringify(res?.data, null, 2));
      if (res?.data?.data) {
        await saveToStorage(
          t('STORAGE.PROFILE_RESPONSE'),
          JSON.stringify(res.data.data),
        );
        return res.data.data;
      }
      return null;
    } catch (err) {
      console.error('[Profile] GET user-profile ✗ error:', err);
      return null;
    }
  };

  // ── Change detection
  const hasChanges = () => {
    const init = initialRef.current;
    const currentDob = formatDateToAPI(dob);
    return (
      mobile !== init.mobile ||
      currentDob !== init.dob ||
      gender !== init.gender ||
      locationLat !== init.locationLat ||
      locationLng !== init.locationLng
    );
  };


  // ── Location auto-detect
  const detectLocation = async () => {
    const netState = await NetInfo.fetch();
    const isConnected = netState.isConnected;

    if (!props.mode && isConnected) {
      setModePopupVisible(true);
      return;
    }
    if (props.mode && !isConnected) {
      Alert.alert('', t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE'));
      return;
    }
    if (!props.mode && !isConnected) {
      Alert.alert('', t('ALERT.NETWORK'));
      return;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('LOCATION_ACCESS_REQUIRED'),
            message: t('NEEDS_TO_ACCESS'),
            buttonPositive: t('BUTTON.OK'),
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('', t('ALERT.LOCATION_SERVICES_DISABLED'));
          return;
        }
      } catch {
        return;
      }
    }

    setDetectingLocation(true);
    Geolocation.getCurrentPosition(
      pos => {
        setLocationLat(pos.coords.latitude);
        setLocationLng(pos.coords.longitude);
        setDetectingLocation(false);
      },
      err => {
        console.warn('Location error:', err);
        setDetectingLocation(false);
        Alert.alert('', t('ALERT.LOCATION_SERVICES_DISABLED'));
      },
      {enableHighAccuracy: false, timeout: 15000, maximumAge: 10000},
    );
  };

  // ── Save
  const handleSave = async () => {
    const netState = await NetInfo.fetch();
    const isConnected = netState.isConnected;

    if (!props.mode && isConnected) {
      setModePopupVisible(true);
      return;
    }
    if (props.mode && !isConnected) {
      Alert.alert('', t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE'));
      return;
    }
    if (!props.mode && !isConnected) {
      Alert.alert('', t('ALERT.NETWORK'));
      return;
    }

    props.setLoader(true);
    setIsSaving(true);
    const data = {};
    if (mobile) data.mobile = mobile;
    const dobVal = formatDateToAPI(dob);
    if (dobVal) data.dob = dobVal;
    if (gender) data.gender = gender;
    if (locationLat != null) data.latitude = locationLat;
    if (locationLng != null) data.longitude = locationLng;

    console.log('[Profile] POST updateProfile → payload:', data);

    comnPost('v2/updateProfile', data)
      .then(res => {
        console.log('[Profile] POST updateProfile ← response:', JSON.stringify(res?.data, null, 2));
        props.setLoader(false);
        setIsSaving(false);
        AsyncStorage.setItem('isUpdated', 'true');
        if (res.data.success) {
          const updated = {...profile, mobile, dob: formatDateToAPI(dob), gender};
          saveToStorage(t('STORAGE.PROFILE_RESPONSE'), JSON.stringify(updated));
          props.setProfilePicture(profile.profile_picture || null);
          navigateTo(navigation, STRING.SCREEN.PROFILE_VIEW);
        } else {
          const raw = res.data.message;
          const msg = typeof raw === 'string'
            ? raw
            : Object.values(raw).flat()[0] ?? t('ALERT.FAILED');
          setAlertMessage(msg);
          setIsAlert(true);
          setIsSuccess(false);
        }
      })
      .catch(err => {
        console.error('[Profile] POST updateProfile ✗ error:', err);
        props.setLoader(false);
        setIsSaving(false);
        setAlertMessage(t('ALERT.FAILED'));
        setIsAlert(true);
        setIsSuccess(false);
      });
  };

  const closePopup = () => {
    if (isSuccess) {
      navigateTo(navigation, STRING.SCREEN.PROFILE_VIEW);
    }
    setIsAlert(false);
  };

  const handleModeChange = async newMode => {
    props.setMode(newMode);
    await saveToStorage(STRING.STORAGE.MODE, JSON.stringify(newMode));
    setModePopupVisible(false);
  };

  // ── Derived values
  const photoUri = profile.profile_picture || null;

  const hasLocation = !!(locationLat && locationLng);
  const dobHasValue = !!(dob.day || dob.month || dob.year);

  const genderOptions = [
    {label: t('EDIT_PROFILE.GENDER_MALE'), value: 'Male'},
    {label: t('EDIT_PROFILE.GENDER_FEMALE'), value: 'Female'},
    {label: t('EDIT_PROFILE.GENDER_OTHER'), value: 'Other'},
    {label: t('EDIT_PROFILE.GENDER_PREFER_NOT'), value: 'Prefer not to say'},
  ];

  // ── Render
  return (
    <View style={s.screen}>

      {/* ── Header ── */}
      <View style={[s.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => backPage(navigation)}
          activeOpacity={0.8}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="chevron-back" size={18} color={C.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('EDIT_PROFILE.TITLE')}</Text>
      </View>
      <View style={s.headerCurve} />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <CheckNet isOff={offline} />

        {/* ── Profile Photo (read-only — synced from Google) ── */}
        <View style={s.photoSection}>
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
          <View style={s.photoNote}>
            <Ionicons name="logo-google" size={12} color={C.textLight} />
            <Text style={s.photoNoteText}>Synced from Google</Text>
          </View>
        </View>

        {/* ── Account Info (read-only) ── */}
        <Text style={s.sectionLabel}>{t('EDIT_PROFILE.ACCOUNT_INFO')}</Text>
        <View style={s.card}>
          <View style={s.readRow}>
            <View style={s.iconWrap}>
              <Ionicons name="person-outline" size={18} color={C.oceanMid} />
            </View>
            <View style={s.readContent}>
              <Text style={s.readLabel}>{t('EDIT_PROFILE.FULL_NAME')}</Text>
              <Text style={s.readValue} numberOfLines={1}>
                {profile.name || '—'}
              </Text>
            </View>
            <Ionicons name="lock-closed-outline" size={14} color={C.textLight} />
          </View>

          <View style={s.divider} />

          <View style={s.readRow}>
            <View style={s.iconWrap}>
              <Ionicons name="mail-outline" size={18} color={C.oceanMid} />
            </View>
            <View style={s.readContent}>
              <Text style={s.readLabel}>{t('EDIT_PROFILE.EMAIL')}</Text>
              <Text style={s.readValue} numberOfLines={1}>
                {profile.email || '—'}
              </Text>
            </View>
            <Ionicons name="lock-closed-outline" size={14} color={C.textLight} />
          </View>
        </View>

        {/* ── Personal Details (editable) ── */}
        <Text style={s.sectionLabel}>{t('EDIT_PROFILE.PERSONAL_DETAILS')}</Text>
        <View style={s.card}>

          {/* Mobile */}
          <View style={s.fieldRow}>
            <View style={s.iconWrap}>
              <Ionicons name="call-outline" size={18} color={C.oceanMid} />
            </View>
            <View style={s.fieldContent}>
              <Text style={s.fieldLabel}>{t('EDIT_PROFILE.MOBILE')}</Text>
              <TextInput
                style={s.textInput}
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                placeholder={t('EDIT_PROFILE.MOBILE_PLACEHOLDER')}
                placeholderTextColor={C.textLight}
                maxLength={15}
              />
            </View>
          </View>

          <View style={s.divider} />

          {/* Date of Birth */}
          <View style={s.fieldRow}>
            <View style={s.iconWrap}>
              <Ionicons name="calendar-outline" size={18} color={C.oceanMid} />
            </View>
            <View style={s.fieldContent}>
              <View style={s.labelRow}>
                <Text style={s.fieldLabel}>{t('EDIT_PROFILE.DOB')}</Text>
                <Text style={s.optionalTag}>{t('EDIT_PROFILE.OPTIONAL')}</Text>
              </View>
              <View style={s.dobRow}>
                <View style={[s.dropWrap, {flex: 0.8}]}>
                  <Dropdown
                    style={s.drop}
                    placeholderStyle={s.dropPlaceholder}
                    selectedTextStyle={s.dropSelected}
                    itemTextStyle={s.dropItem}
                    data={DAYS}
                    labelField="label"
                    valueField="value"
                    placeholder="DD"
                    value={dob.day}
                    onChange={item =>
                      setDob(prev => ({...prev, day: item.value}))
                    }
                    maxHeight={200}
                  />
                </View>
                <View style={[s.dropWrap, {flex: 1}]}>
                  <Dropdown
                    style={s.drop}
                    placeholderStyle={s.dropPlaceholder}
                    selectedTextStyle={s.dropSelected}
                    itemTextStyle={s.dropItem}
                    data={MONTHS}
                    labelField="label"
                    valueField="value"
                    placeholder="MMM"
                    value={dob.month}
                    onChange={item =>
                      setDob(prev => ({...prev, month: item.value}))
                    }
                    maxHeight={200}
                  />
                </View>
                <View style={[s.dropWrap, {flex: 1.2}]}>
                  <Dropdown
                    style={s.drop}
                    placeholderStyle={s.dropPlaceholder}
                    selectedTextStyle={s.dropSelected}
                    itemTextStyle={s.dropItem}
                    data={YEARS}
                    labelField="label"
                    valueField="value"
                    placeholder="YYYY"
                    value={dob.year}
                    onChange={item =>
                      setDob(prev => ({...prev, year: item.value}))
                    }
                    maxHeight={200}
                  />
                </View>
                {dobHasValue && (
                  <TouchableOpacity
                    onPress={() =>
                      setDob({day: null, month: null, year: null})
                    }
                    style={s.clearBtn}
                    hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                    <Ionicons name="close-circle" size={18} color={C.textLight} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={s.divider} />

          {/* Gender */}
          <View style={s.fieldRow}>
            <View style={s.iconWrap}>
              <Ionicons name="people-outline" size={18} color={C.oceanMid} />
            </View>
            <View style={s.fieldContent}>
              <View style={s.labelRow}>
                <Text style={s.fieldLabel}>{t('EDIT_PROFILE.GENDER')}</Text>
                <Text style={s.optionalTag}>{t('EDIT_PROFILE.OPTIONAL')}</Text>
              </View>
              <View style={s.genderRow}>
                <View style={s.genderDropWrap}>
                  <Dropdown
                    style={s.drop}
                    placeholderStyle={s.dropPlaceholder}
                    selectedTextStyle={s.dropSelected}
                    itemTextStyle={s.dropItem}
                    data={genderOptions}
                    labelField="label"
                    valueField="value"
                    placeholder={t('EDIT_PROFILE.GENDER_PLACEHOLDER')}
                    value={gender}
                    onChange={item => setGender(item.value)}
                    maxHeight={200}
                  />
                </View>
                {!!gender && (
                  <TouchableOpacity
                    onPress={() => setGender('')}
                    style={s.clearBtn}
                    hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                    <Ionicons name="close-circle" size={18} color={C.textLight} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── Location ── */}
        <Text style={s.sectionLabel}>{t('EDIT_PROFILE.LOCATION')}</Text>
        <View style={s.card}>
          {/* Map */}
          <View style={s.mapWrap}>
            {hasLocation ? (
              <MapView
                style={StyleSheet.absoluteFillObject}
                region={{
                  latitude: locationLat,
                  longitude: locationLng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}>
                <Marker
                  coordinate={{
                    latitude: locationLat,
                    longitude: locationLng,
                  }}
                />
              </MapView>
            ) : (
              <View style={s.mapPlaceholder}>
                <Ionicons
                  name="location-outline"
                  size={28}
                  color="rgba(255,255,255,0.6)"
                />
                <Text style={s.mapPlaceholderText}>
                  {t('EDIT_PROFILE.NO_LOCATION')}
                </Text>
              </View>
            )}
          </View>

          {/* Location actions */}
          <View style={s.locationActions}>
            <TouchableOpacity
              style={s.detectBtn}
              onPress={detectLocation}
              activeOpacity={0.8}
              disabled={detectingLocation}>
              {detectingLocation ? (
                <ActivityIndicator size="small" color={C.oceanMid} />
              ) : (
                <Ionicons name="navigate-outline" size={16} color={C.oceanMid} />
              )}
              <Text style={s.detectBtnText}>
                {detectingLocation
                  ? t('EDIT_PROFILE.DETECTING')
                  : t('EDIT_PROFILE.AUTO_DETECT')}
              </Text>
            </TouchableOpacity>

            {hasLocation && (
              <Text style={s.coordText}>
                {locationLat?.toFixed(5)}, {locationLng?.toFixed(5)}
              </Text>
            )}
          </View>
        </View>

        {/* ── Offline notice ── */}
        {offline && (
          <View style={s.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#92400E" />
            <Text style={s.offlineBannerText}>
              {t('EDIT_PROFILE.OFFLINE_NOTICE')}
            </Text>
          </View>
        )}

        {/* ── Save button ── */}
        <TouchableOpacity
          style={[s.saveBtn, (!hasChanges() || isSaving) && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasChanges() || isSaving}
          activeOpacity={0.85}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[s.saveBtnText, !hasChanges() && s.saveBtnTextDisabled]}>
              {t('EDIT_PROFILE.SAVE_CHANGES')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Mode popup (offline) ── */}
      <ModePopup
        visible={modePopupVisible}
        currentMode={props.mode}
        onClose={() => setModePopupVisible(false)}
        onModeChange={handleModeChange}
      />

      {/* ── Result popup ── */}
      <Popup message={alertMessage} visible={isAlert} onPress={closePopup} />

    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},
  flex: {flex: 1},

  // Header (matches Settings / TermsScreen pattern)
  header: {
    backgroundColor: C.oceanDeep,
    paddingHorizontal: 20,
    paddingBottom: 36,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },
  headerCurve: {
    height: 36,
    backgroundColor: C.cream,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
    marginTop: -36,
    zIndex: 1,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
  },

  // Photo
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  photoWrap: {
    position: 'relative',
    marginBottom: 10,
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
    borderWidth: 3,
    borderColor: C.white,
  },
  photoPlaceholder: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    backgroundColor: '#B8E4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: {fontSize: 40},
  photoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  photoNoteText: {
    fontSize: 12,
    color: C.textLight,
  },

  // Section label (matches Settings.js)
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  // Card — no elevation
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginLeft: 44,
  },

  // Read-only row
  readRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
  },
  readContent: {flex: 1},
  readLabel: {
    fontSize: 11,
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  readValue: {
    fontSize: 15,
    fontWeight: '500',
    color: C.textDark,
  },

  // Editable field row
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  fieldContent: {flex: 1},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalTag: {
    fontSize: 10,
    color: C.sandMid,
    fontStyle: 'italic',
  },
  textInput: {
    fontSize: 15,
    color: C.textDark,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: C.cream,
  },

  // DOB pickers
  dobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropWrap: {
    flex: 1,
  },
  drop: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    backgroundColor: C.cream,
    height: 40,
  },
  dropPlaceholder: {
    fontSize: 13,
    color: C.textLight,
  },
  dropSelected: {
    fontSize: 13,
    color: C.textDark,
    fontWeight: '500',
  },
  dropItem: {
    fontSize: 13,
    color: C.textDark,
  },
  clearBtn: {
    alignSelf: 'center',
    marginLeft: 2,
  },

  // Gender
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genderDropWrap: {
    flex: 1,
  },

  // Map
  mapWrap: {
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 12,
    backgroundColor: C.oceanDeep,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B6B7B',
  },
  mapPlaceholderText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  locationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: C.oceanMid,
    backgroundColor: C.white,
  },
  detectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.oceanMid,
  },
  coordText: {
    fontSize: 11,
    color: C.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Offline banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },

  // Save button
  saveBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: C.oceanDeep,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  saveBtnTextDisabled: {
    color: C.textLight,
  },
});

// ─── Redux ─────────────────────────────────────────────────────────────────────

const mapStateToProps = state => ({
  access_token: state.commonState.access_token,
  mode: state.commonState.mode,
});

const mapDispatchToProps = dispatch => ({
  setLoader: data => dispatch(setLoader(data)),
  setMode: val => dispatch(setMode(val)),
  setProfilePicture: url => dispatch(setProfilePicture(url)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
