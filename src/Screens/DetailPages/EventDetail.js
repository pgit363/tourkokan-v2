import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Share,
  Platform,
  Dimensions,
  Linking,
  BackHandler,
} from 'react-native';
import {useAppDialog} from '../../Components/Common/AppDialog';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary} from 'react-native-image-picker';
import {AWS_URL} from '@env';
import {backPage} from '../../Services/CommonMethods';
import {comnPost, comnPostForm} from '../../Services/Api/CommonServices';
import {isGuestUser} from '../../Components/Common/GuestGateModal';
import GuestGateModal from '../../Components/Common/GuestGateModal';
import ImagePlaceholder from '../../Components/Common/ImagePlaceholder';
import STRING from '../../Services/Constants/STRINGS';
import {createLogger} from '../../Services/Logger';
import {scaleFontSizes, useResponsive} from '../../Services/responsive';

const log = createLogger('EventDetail');

const {width: SW} = Dimensions.get('window');
const GALLERY_SIZE = (SW - 48) / 3;

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  forestDeep: '#1A3320',
  oceanFoam: '#B8E4EA',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
};

const resolveImg = (url, path) => {
  const uri = url || (path ? `${AWS_URL}${path}` : null);
  log.debug('[EventDetail img]', uri);
  return uri;
};

const isYouTube = url => /youtube\.com|youtu\.be/.test(url ?? '');
const getYouTubeId = url => {
  const m = (url ?? '').match(/(?:v=|youtu\.be\/)([^&\s?]+)/);
  return m ? m[1] : null;
};

const RESPONSE_COUNT_KEY = {
  like: 'like_count',
  going: 'going_count',
  interested: 'interested_count',
};
const EVENT_COUNT_KEY = {
  like: 'like_count',
  going: 'going_count',
  interested: 'interested_count',
};
const ENDPOINT = {
  like: 'likeEvent',
  going: 'goingEvent',
  interested: 'interestedEvent',
};

const EventDetail = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {isTablet} = useResponsive();
  const {show: showDialog, dialog} = useAppDialog();
  const [event, setEvent] = useState(route?.params?.event ?? {});
  const [guestVisible, setGuestVisible] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  // Gallery state — initialised from event.gallery (array of paths)
  const [gallery, setGallery] = useState(() =>
    (event.gallery || []).map((path, i) => ({
      id: `legacy_${i}`,
      image_url: resolveImg(null, path),
      deletable: false,
    })),
  );
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const ui = event.user_interaction ?? {};
  const [toggled, setToggled] = useState({
    like: ui.has_liked ?? false,
    going: ui.is_going ?? false,
    interested: ui.is_interested ?? false,
  });

  // Back handler
  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.goBack();
        return true;
      });
      return () => handler.remove();
    }, [navigation]),
  );

  // Detect ownership
  useEffect(() => {
    if (event.is_owner) { setIsOwner(true); return; }
    AsyncStorage.getItem(STRING.STORAGE.USER_ID).then(uid => {
      if (uid && event.user_id && String(uid) === String(event.user_id)) {
        setIsOwner(true);
      }
    });
  }, [event.is_owner, event.user_id]);

  const formatDate = iso => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  // ── Interactions ──────────────────────────────────────────────────────────

  const interact = async type => {
    const guest = await isGuestUser();
    if (guest) { setGuestVisible(true); return; }
    setLoadingType(type);
    const res = await comnPost(`v2/${ENDPOINT[type]}`, {id: event.id}).catch(() => null);
    setLoadingType(null);
    if (res?.data?.success) {
      const newCount = res.data.data?.[RESPONSE_COUNT_KEY[type]];
      setEvent(prev => ({...prev, [EVENT_COUNT_KEY[type]]: newCount ?? prev[EVENT_COUNT_KEY[type]]}));
      setToggled(prev => ({...prev, [type]: !prev[type]}));
    } else {
      const msg = res?.data?.message ?? res?.response?.data?.message;
      const displayMsg = typeof msg === 'string'
        ? msg
        : typeof msg === 'object' && msg !== null
          ? Object.values(msg).flat().join('\n')
          : 'Something went wrong.';
      showDialog({type: 'error', title: 'Error', message: displayMsg});
    }
  };

  const handleShare = async () => {
    if (await isGuestUser()) { setGuestVisible(true); return; }
    try {
      const result = await Share.share({
        title: event.title,
        message: `${event.title}\n${event.address ? event.address + '\n' : ''}${event.start_date ? 'Date: ' + formatDate(event.start_date) : ''}`,
      });
      if (result.action === Share.sharedAction) {
        comnPost('v2/shareEvent', {id: event.id, device_type: Platform.OS})
          .then(res => {
            if (res?.data?.data?.share_count !== undefined) {
              setEvent(prev => ({...prev, share_count: res.data.data.share_count}));
            }
          }).catch(() => {});
      }
    } catch (e) { log.warn("[caught]", e); }
  };

  // ── Gallery management (owner + completed) ────────────────────────────────

  const pickAndUpload = () => {
    launchImageLibrary({mediaType: 'photo', selectionLimit: 5, quality: 0.85}, async response => {
      if (response.didCancel || !response.assets?.length) return;
      setUploadingGallery(true);
      const fd = new FormData();
      fd.append('event_id', event.id);
      response.assets.forEach((asset, i) => {
        fd.append(`images[${i}]`, {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `photo_${i}.jpg`,
        });
      });
      const res = await comnPostForm('v2/uploadEventGallery', fd).catch(() => null);
      setUploadingGallery(false);
      if (res?.data?.success) {
        const newItems = (res.data.data || []).map(g => ({
          id: g.id,
          image_url: g.image_url,
          deletable: true,
        }));
        setGallery(prev => [...prev, ...newItems]);
      } else {
        showDialog({type: 'error', title: 'Upload Failed', message: 'Could not upload photos. Please try again.'});
      }
    });
  };

  const confirmDelete = id => {
    showDialog({
      type: 'delete',
      title: 'Delete Photo',
      message: 'This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setDeletingId(id);
        const res = await comnPost('v2/deleteEventGallery', {id}).catch(() => null);
        setDeletingId(null);
        if (res?.data?.success) {
          setGallery(prev => prev.filter(g => g.id !== id));
        } else {
          showDialog({type: 'error', title: 'Error', message: 'Could not delete photo.'});
        }
      },
    });
  };

  const handleGuestLogin = async () => {
    setGuestVisible(false);
    await AsyncStorage.clear();
    await AsyncStorage.setItem('IS_FIRST_TIME', 'false');
    navigation.reset({index: 0, routes: [{name: STRING.SCREEN.EMAIL}]});
  };

  // ── Sub-components ────────────────────────────────────────────────────────

  const InteractButton = ({type, icon, label}) => {
    const isActive = toggled[type];
    const count = event[EVENT_COUNT_KEY[type]] ?? 0;
    return (
      <TouchableOpacity
        style={[s.interactBtn, isActive && s.interactBtnActive]}
        onPress={() => interact(type)}
        disabled={loadingType === type}
        activeOpacity={0.85}>
        {loadingType === type ? (
          <ActivityIndicator size="small" color={isActive ? C.white : C.oceanMid} />
        ) : (
          <Ionicons
            name={isActive ? icon.replace('-outline', '') : icon}
            size={22}
            color={isActive ? C.white : C.oceanMid}
          />
        )}
        <Text style={[s.interactCount, isActive && s.interactCountActive]}>{count}</Text>
        <Text style={[s.interactLabel, isActive && s.interactLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const heroUri = resolveImg(event.banner_image_url, event.banner_image);
  const isCompleted = event.status === 'completed';
  const canEditEvent = isOwner && event.status !== 'completed' && event.status !== 'cancelled';
  const showGalleryManager = isOwner && isCompleted;

  const ytId = isYouTube(event.video_url) ? getYouTubeId(event.video_url) : null;

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => backPage(navigation)}
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>Event</Text>
          {canEditEvent && (
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => navigation.navigate(STRING.SCREEN.UPDATE_EVENT, {event})}
              activeOpacity={0.8}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="create-outline" size={20} color={C.white} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.iconBtn}
            onPress={handleShare}
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="share-social-outline" size={20} color={C.white} />
          </TouchableOpacity>
        </View>
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: insets.bottom + 24}}>

        {/* Hero banner */}
        {heroUri ? (
          <Image source={{uri: heroUri}} style={[s.heroImage, isTablet && {height: 340}]} />
        ) : (
          <ImagePlaceholder
            style={[s.heroImage, isTablet && {height: 340}]}
            icon="calendar-outline"
            iconSize={isTablet ? 72 : 56}
            showLabel
          />
        )}

        <View style={s.body}>
          <Text style={s.title}>{event.title}</Text>

          {/* Date */}
          <View style={s.metaRow}>
            <View style={s.metaIconWrap}>
              <Ionicons name="calendar-outline" size={16} color={C.oceanMid} />
            </View>
            <Text style={s.metaText}>
              {formatDate(event.start_date)}
              {event.end_date && event.end_date !== event.start_date
                ? ` – ${formatDate(event.end_date)}` : ''}
            </Text>
          </View>

          {/* Venue / address */}
          {(event.venue_name || event.address) ? (
            <View style={s.metaRow}>
              <View style={s.metaIconWrap}>
                <Ionicons name="location-outline" size={16} color={C.oceanMid} />
              </View>
              <Text style={s.metaText} numberOfLines={2}>
                {event.venue_name ? `${event.venue_name}, ` : ''}{event.address}
              </Text>
            </View>
          ) : null}

          {/* Taluka */}
          {event.taluka ? (
            <View style={s.metaRow}>
              <View style={s.metaIconWrap}>
                <Ionicons name="map-outline" size={16} color={C.oceanMid} />
              </View>
              <Text style={s.metaText}>{event.taluka}</Text>
            </View>
          ) : null}

          {/* Entry fee */}
          {event.is_free === false && event.entry_fee ? (
            <View style={s.metaRow}>
              <View style={s.metaIconWrap}>
                <Ionicons name="ticket-outline" size={16} color={C.oceanMid} />
              </View>
              <Text style={s.metaText}>₹{event.entry_fee} entry fee</Text>
            </View>
          ) : event.is_free !== false ? (
            <View style={s.metaRow}>
              <View style={s.metaIconWrap}>
                <Ionicons name="ticket-outline" size={16} color={C.oceanMid} />
              </View>
              <Text style={s.metaText}>Free entry</Text>
            </View>
          ) : null}

          {/* Description */}
          {event.description ? (
            <View style={s.descCard}>
              <Text style={s.descTitle}>ABOUT THIS EVENT</Text>
              <Text style={s.descText}>{event.description}</Text>
            </View>
          ) : null}

          {/* ── Video URL ── */}
          {event.video_url ? (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <View style={s.sectionDot} />
                <Text style={s.sectionTitleText}>Video</Text>
              </View>
              <TouchableOpacity
                style={s.videoCard}
                onPress={() => Linking.openURL(event.video_url).catch(() => showDialog({type: 'error', title: 'Error', message: 'Cannot open video link.'}))}
                activeOpacity={0.88}>
                {ytId ? (
                  <View style={s.ytThumbWrap}>
                    <Image
                      source={{uri: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}}
                      style={s.ytThumb}
                    />
                    <View style={s.ytPlayOverlay}>
                      <Ionicons name="logo-youtube" size={44} color="#FF0000" />
                    </View>
                  </View>
                ) : (
                  <View style={s.videoGeneric}>
                    <Ionicons name="videocam-outline" size={28} color={C.oceanMid} />
                    <Text style={s.videoGenericText}>Watch Video</Text>
                    <Ionicons name="open-outline" size={16} color={C.textLight} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ── Gallery grid ── */}
          {(gallery.length > 0 || showGalleryManager) ? (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <View style={s.sectionDot} />
                <Text style={s.sectionTitleText}>Gallery</Text>
                {showGalleryManager && (
                  <TouchableOpacity
                    style={s.addPhotoBtn}
                    onPress={pickAndUpload}
                    disabled={uploadingGallery}
                    activeOpacity={0.8}>
                    {uploadingGallery ? (
                      <ActivityIndicator size="small" color={C.white} />
                    ) : (
                      <>
                        <Ionicons name="add" size={14} color={C.white} />
                        <Text style={s.addPhotoBtnText}>Add Photos</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {gallery.length === 0 && showGalleryManager ? (
                <TouchableOpacity style={s.galleryEmpty} onPress={pickAndUpload} activeOpacity={0.8}>
                  <Ionicons name="images-outline" size={32} color={C.textLight} />
                  <Text style={s.galleryEmptyText}>Tap to add photos from this event</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.galleryGrid}>
                  {gallery.map(g => (
                    <View key={g.id} style={s.galleryItem}>
                      <Image source={{uri: g.image_url}} style={s.galleryThumb} />
                      {showGalleryManager && g.deletable && (
                        <TouchableOpacity
                          style={s.galleryDeleteBtn}
                          onPress={() => confirmDelete(g.id)}
                          disabled={deletingId === g.id}
                          hitSlop={{top: 4, bottom: 4, left: 4, right: 4}}>
                          {deletingId === g.id ? (
                            <ActivityIndicator size="small" color={C.white} />
                          ) : (
                            <Ionicons name="close" size={12} color={C.white} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {/* ── Interact ── */}
          <View style={s.sectionHeader}>
            <View style={s.sectionDot} />
            <Text style={s.sectionTitleText}>Join this event</Text>
          </View>
          <View style={s.interactRow}>
            <InteractButton type="like" icon="heart-outline" label="Like" />
            <InteractButton type="going" icon="checkmark-circle-outline" label="Going" />
            <InteractButton type="interested" icon="star-outline" label="Interested" />
            <TouchableOpacity style={s.interactBtn} onPress={handleShare} activeOpacity={0.85}>
              <Ionicons name="share-social-outline" size={22} color={C.oceanMid} />
              <Text style={s.interactCount}>{event.share_count ?? 0}</Text>
              <Text style={s.interactLabel}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <GuestGateModal
        visible={guestVisible}
        message="Please login to interact with this event."
        onClose={() => setGuestVisible(false)}
        onLogin={handleGuestLogin}
      />
      {dialog}
    </View>
  );
};

const s = StyleSheet.create(scaleFontSizes({
  root: {flex: 1, backgroundColor: C.cream},
  header: {paddingHorizontal: 20, paddingBottom: 48, position: 'relative', overflow: 'hidden'},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {flex: 1, fontSize: 20, fontWeight: '700', color: C.white, letterSpacing: 0.2},
  headerCurve: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
    backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  heroImage: {width: '100%', height: 220, resizeMode: 'cover'},
  body: {padding: 20, gap: 10},
  title: {fontSize: 22, fontWeight: '700', color: C.textDark, lineHeight: 30},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  metaIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(27,107,123,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  metaText: {fontSize: 14, color: C.oceanMid, fontWeight: '500', flex: 1},
  descCard: {
    backgroundColor: C.white, borderRadius: 16, padding: 16, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', gap: 8,
  },
  descTitle: {fontSize: 11, fontWeight: '700', color: C.textLight, letterSpacing: 1},
  descText: {fontSize: 14, color: C.textMid, lineHeight: 22},

  // Section
  section: {gap: 10, marginTop: 8},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2},
  sectionDot: {width: 4, height: 18, borderRadius: 2, backgroundColor: C.oceanMid},
  sectionTitleText: {fontSize: 15, fontWeight: '700', color: C.textDark, flex: 1},

  // Video
  videoCard: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
  },
  ytThumbWrap: {width: '100%', height: 200, position: 'relative'},
  ytThumb: {width: '100%', height: '100%', resizeMode: 'cover'},
  ytPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  videoGeneric: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.white, padding: 16,
  },
  videoGenericText: {flex: 1, fontSize: 14, color: C.oceanMid, fontWeight: '600'},

  // Gallery
  addPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.oceanMid, borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  addPhotoBtnText: {fontSize: 12, fontWeight: '600', color: C.white},
  galleryEmpty: {
    height: 120, borderRadius: 16, borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  galleryEmptyText: {fontSize: 13, color: C.textLight, textAlign: 'center'},
  galleryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 4},
  galleryItem: {
    width: GALLERY_SIZE, height: GALLERY_SIZE,
    borderRadius: 10, overflow: 'hidden', position: 'relative',
  },
  galleryThumb: {width: '100%', height: '100%', resizeMode: 'cover'},
  galleryDeleteBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Interact
  interactRow: {flexDirection: 'row', gap: 8, marginTop: 4},
  interactBtn: {
    flex: 1, alignItems: 'center', gap: 5, backgroundColor: C.white,
    borderRadius: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: 'rgba(27,107,123,0.15)',
  },
  interactBtnActive: {backgroundColor: C.oceanMid, borderColor: C.oceanMid},
  interactCount: {fontSize: 15, fontWeight: '700', color: C.textDark},
  interactCountActive: {color: C.white},
  interactLabel: {fontSize: 10, color: C.textLight},
  interactLabelActive: {color: 'rgba(255,255,255,0.8)'},
}));

export default EventDetail;
