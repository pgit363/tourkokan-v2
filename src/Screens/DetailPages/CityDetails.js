import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Share,
  FlatList,
  Modal,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import {comnPost, getFromStorage} from '../../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {setLoader} from '../../Reducers/CommonActions';
import Loader from '../../Components/Customs/Loader';
import Header from '../../Components/Common/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isGuestUser} from '../../Components/Common/GuestGateModal';
import {
  backPage,
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import GlobalText from '../../Components/Customs/Text';
import styles from './Styles';
import Path from '../../Services/Api/BaseUrl';
import Octicons from 'react-native-vector-icons/Octicons';
import CommentsSheet from '../../Components/Common/CommentsSheet';
import BottomSheet from '../../Components/Customs/BottomSheet';
import StarRating from 'react-native-star-rating-widget'; // Changed import
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ReadMore from 'react-native-read-more-text';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import CityCardSkeleton from '../../Components/Cards/CityCardSkeleton';
import {Skeleton} from '@rneui/themed';
import MapContainer from '../../Components/Common/MapContainer';
import MapSkeleton from '../../Components/Common/MapSkeleton';
import {useTranslation} from 'react-i18next';
import GalleryView from '../../Components/Common/GalleryView';
import ComingSoon from '../../Components/Common/ComingSoon';
import Popup from '../../Components/Common/Popup';
import NetInfo from '@react-native-community/netinfo';
import {AWS_URL} from '@env';
import {useFocusEffect} from '@react-navigation/native';
import PackageCard from '../../Components/Cards/PackageCard';
import PackageCardSkeleton from '../../Components/Cards/PackageCardSkeleton';
import Banner from '../../Components/Customs/Banner';
import STRING from '../../Services/Constants/STRINGS';
import HotPlaces from '../../Components/Sections/HotPlaces';

const CityDetails = ({navigation, route, offline, ...props}) => {
  const {t} = useTranslation();
  const refRBSheet = useRef();

  const [city, setCity] = useState([]); // State to store city
  const [error, setError] = useState(null); // State to store error message
  const [cityId, setCityId] = useState(route.params.city.id);
  const [isFav, setIsFav] = useState(route.params.city.is_favorite);
  const [rating, setRating] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setLoader] = useState(true);
  const [initialRegion, setInitialRegion] = useState({});
  const [currentLatitude, setCurrentLatitude] = useState();
  const [currentLongitude, setCurrentLongitude] = useState();
  const [errorMessage, setErrorMessage] = useState('');
  const [showOnlineMode, setShowOnlineMode] = useState(false);
  const [bannerObject, setBannerObject] = useState({});

  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isGuestPopup, setIsGuestPopup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    setLoader(true);
    return () => {
      backHandler.remove();
    };
  }, [cityId]);

  useEffect(() => {
    const getBanners = async () => {
      const landingData = await getFromStorage(t('STORAGE.LANDING_RESPONSE'));
      if (landingData) {
        const parsedData = JSON.parse(landingData);
        if (parsedData?.banners) {
          setBannerObject(parsedData.banners);
        }
      }
    };
    getBanners();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setCityDetails();
      getDetails();
    }, [route?.params?.city?.id])
  );

  const setCityDetails = () => {
    setLoader(true);
    setCity(route.params.city);
    setIsFav(route.params.city.is_favorite);
    setRating(parseFloat(route.params.city.rating_avg_rate) || 0);
    setCommentCount(route.params.city.comment_count);
    setLocationMap(route.params.city.latitude, route.params.city.longitude);
    setLoader(false);
  };

  const getDetails = place => {
    setLoader(true);
    let data = {
      id: place || cityId,
    };
    comnPost(`v2/getSite`, data)
      .then(res => {
        if (res.data.success) {
          setCity(res.data.data);
          setIsFav(res.data.data.is_favorite);
          setRating(parseFloat(res.data.data.rating_avg_rate) || 0);
          setCommentCount(res.data.data.comment_count);
          setLocationMap(res.data.data.latitude, res.data.data.longitude);
          setLoader(false);
        } else {
          setError(res.data.message);
          setLoader(false);
        }
      })
      .catch(error => {
        setError(error.message); // Update error state with error message
        setLoader(false);
      });
  };

  const setInitialLocation = (lat, long) => {
    let myInitialRegion = {
      latitude: parseFloat(lat) || 47.4220936,
      longitude: parseFloat(long) || -122.083922,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    setInitialRegion(myInitialRegion);
  };

  const setLocationMap = (lat, long) => {
    setInitialLocation(lat, long);
    setCurrentLatitude(parseFloat(lat));
    setCurrentLongitude(parseFloat(long));
  };

  const onHeartClick = async () => {
    if (await isGuestUser()) {
      setIsGuestPopup(true);
      return;
    }
    const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
    // Check the internet connectivity state
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;

    // Combined condition for all three cases
    if (
      (isConnected && !mode) || // Case 1: Internet is available but mode is offline
      (!isConnected && !mode) || // Case 2: Internet is not available and mode is offline
      (!isConnected && mode) // Case 3: Internet is not available but mode is online
    ) {
      // The user should be alerted based on their mode and connectivity status
      setIsAlert(true);
      setAlertMessage(
        !isConnected && !mode
          ? t('ALERT.NETWORK') // Alert: Network is available but mode is offline
          : !isConnected && mode
          ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE') // Alert: Mode is offline, you need to set it to online
          : isConnected && !mode
          ? t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE') // Alert: No internet available but mode is online
          : '', // Default case (optional), if none of the conditions match
      );

      return;
    }

    if (props.mode) {
      props.setLoader(true);
      setIsFav(!isFav);
      route.params.city.is_favorite = !isFav;
      let placeData = {
        user_id: await AsyncStorage.getItem(t('STORAGE.USER_ID')),
        favouritable_type: t('TABLE.SITE'),
        favouritable_id: city.id,
      };
      comnPost('v2/addDeleteFavourite', placeData)
        .then(res => {
          AsyncStorage.setItem('isUpdated', 'true');
          props.setLoader(false);
          // getDetails()
        })
        .catch(err => {
          console.log(err);
        });
    } else {
      setShowOnlineMode(true);
      setErrorMessage(t('ON_LIKE'));
    }
  };

  const onStarRatingPress = async rate => {
    if (await isGuestUser()) {
      setIsGuestPopup(true);
      return;
    }
    const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
    // Check the internet connectivity state
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected;

    // Combined condition for all three cases
    if (
      (isConnected && !mode) || // Case 1: Internet is available but mode is offline
      (!isConnected && !mode) || // Case 2: Internet is not available and mode is offline
      (!isConnected && mode) // Case 3: Internet is not available but mode is online
    ) {
      // The user should be alerted based on their mode and connectivity status
      setIsAlert(true);
      setAlertMessage(
        !isConnected && !mode
          ? t('ALERT.NETWORK') // Alert: Network is available but mode is offline
          : !isConnected && mode
          ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE') // Alert: Mode is offline, you need to set it to online
          : isConnected && !mode
          ? t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE') // Alert: No internet available but mode is online
          : '', // Default case (optional), if none of the conditions match
      );

      return;
    }

    if (props.mode) {
      setRating(rate);
      props.setLoader(true);
      const placeData = {
        user_id: await AsyncStorage.getItem(t('STORAGE.USER_ID')),
        rateable_type: t('TABLE.SITE'),
        rateable_id: city.id,
        rate,
      };
      comnPost('v2/addUpdateRating', placeData)
        .then(res => {
          AsyncStorage.setItem('isUpdated', 'true');
          props.setLoader(false);
          // getDetails()
        })
        .catch(err => {});
    } else {
      setShowOnlineMode(true);
      setErrorMessage(t('ON_RATE'));
    }
  };

  const openCommentsSheet = async () => {
    if (await isGuestUser()) {
      setIsGuestPopup(true);
      return;
    }
    refRBSheet.current.open();
  };

  const closeCommentsSheet = () => {
    refRBSheet.current.close();
  };

  const onShareClick = async () => {
    try {
      const deepLink = `awesomeapp://citydetails?id=${data.id}`; // Replace with your custom scheme and path
      const shareMessage = `Explore the details of this amazing city in TourKokan! 🌍🏙️ Check out what makes it unique and discover more about its culture, attractions, and hidden gems. Open the link to dive into the City Details now! 📱👀`;
      const shareUrl = deepLink;
      const result = await Share.share({
        message: shareMessage,
        url: shareUrl,
      });

      if (result.action === Share.sharedAction) {
        console.log('Content shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing content:', error.message);
    }
  };

  const renderTruncatedFooter = handlePress => {
    return (
      <TextButton
        title={t('BUTTON.READ_MORE')}
        onPress={handlePress}
        buttonView={styles.readMoreStyle}
        titleStyle={styles.titleStyle}
        endIcon={
          <Ionicons
            name="chevron-down"
            color={COLOR.themeBlue}
            size={DIMENSIONS.iconMedium}
          />
        }
      />
    );
  };

  const renderRevealedFooter = handlePress => {
    return (
      <TextButton
        title={t('BUTTON.READ_LESS')}
        onPress={handlePress}
        buttonView={styles.readMoreStyle}
        titleStyle={styles.titleStyle}
        endIcon={
          <Ionicons
            name="chevron-up"
            color={COLOR.themeBlue}
            size={DIMENSIONS.iconMedium}
          />
        }
      />
    );
  };

  const handleTextReady = () => {
    // ...
  };

  const getCityDetails = city => {
    // navigateTo(navigation, t('SCREEN.CITY_DETAILS'), {city});
  };

  const renderItem = ({item}) => {
    return (
      // <View style={styles.placesCard}>
      //   <GlobalText text={item.name} />
      // </View>
      <PackageCard
        data={item}
        onClick={() => getCityDetails(item)}
        cardType={'long'}
      />
    );
  };

  const seeMore = () => {
    navigateTo(navigation, t('SCREEN.CITY_LIST'), {
      parent_id: city.id,
      type: t('VILLAGES'),
    });
  };

  const closePopup = () => {
    setIsAlert(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    comnPost('v2/getSite', {id: cityId})
      .then(res => {
        if (res?.data?.success) {
          setCity(res.data.data);
          setIsFav(res.data.data.is_favorite);
          setRating(parseFloat(res.data.data.rating_avg_rate) || 0);
          setCommentCount(res.data.data.comment_count);
          setLocationMap(res.data.data.latitude, res.data.data.longitude);
        }
        setRefreshing(false);
      })
      .catch(() => setRefreshing(false));
  };

  const handleGuestLogin = async () => {
    setIsGuestPopup(false);
    await AsyncStorage.clear();
    navigation.reset({index: 0, routes: [{name: STRING.SCREEN.EMAIL}]});
  };

  const goToCityImages = () => {
    navigateTo(navigation, t('SCREEN.GALLERY'), {cityName: city.name});
  };

  return (
    <>
      <Header
        name={''}
        startIcon={
          <Ionicons
            name="chevron-back-outline"
            color={COLOR.black}
            size={DIMENSIONS.userIconSize}
            onPress={() => backPage(navigation)}
            style={styles.backIcon}
          />
        }
        style={styles.cityHeader}
      />
      <ScrollView
        style={{backgroundColor: '#F8F7F4'}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1B6B7B']}
            tintColor="#1B6B7B"
          />
        }>
        <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />
        <Loader />

        {city && (
          <View>
            {/* ── Hero Image ── */}
            <View style={styles.placeImageView}>
              {isLoading ? (
                <Skeleton animation="pulse" variant="text" style={styles.placeImage} />
              ) : city?.gallery?.length > 0 ? (
                <GalleryView images={city.gallery.slice(0, 3)} />
              ) : city?.image ? (
                <ImageBackground
                  source={{uri: AWS_URL + city.image}}
                  style={styles.placeImage}
                  imageStyle={{borderBottomLeftRadius: 24, borderBottomRightRadius: 24}}
                  resizeMode="cover"
                />
              ) : (
                <ImageBackground
                  source={require('../../Assets/Images/no-image.png')}
                  style={styles.placeImage}
                  imageStyle={{borderBottomLeftRadius: 24, borderBottomRightRadius: 24}}
                  resizeMode="cover"
                />
              )}
            </View>

            <View style={cd.body}>

              {/* 1 ── Name + Heart + TagLine + Rating summary ── */}
              {isLoading ? (
                <View style={{gap: 8, marginBottom: 16}}>
                  <Skeleton animation="pulse" variant="text" style={{width: 160, height: 22}} />
                  <Skeleton animation="pulse" variant="text" style={{width: 220, height: 16}} />
                  <Skeleton animation="pulse" variant="text" style={{width: 120, height: 14}} />
                </View>
              ) : (
                <View style={cd.nameRow}>
                  <View style={{flex: 1}}>
                    <View style={cd.titleRow}>
                      <MaterialIcons name="location-pin" color={C2.ocean} size={18} />
                      <Text style={cd.cityName}>{city.name}</Text>
                    </View>
                    {!!city.tag_line && (
                      <Text style={cd.tagLine}>{city.tag_line}</Text>
                    )}
                    {/* Quick rating summary — shown once here, not repeated in Reviews */}
                    <View style={cd.ratingQuickRow}>
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={cd.ratingQuickScore}>
                        {rating > 0 ? parseFloat(rating).toFixed(1) : 'No rating'}
                      </Text>
                      {commentCount > 0 && (
                        <Text style={cd.ratingQuickCount}>· {commentCount} review{commentCount !== 1 ? 's' : ''}</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={cd.heartBtn} onPress={onHeartClick} activeOpacity={0.8}>
                    <Octicons
                      name={isFav ? 'heart-fill' : 'heart'}
                      color={isFav ? '#EF4444' : '#78716C'}
                      size={22}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* 2 ── Description ── */}
              {isLoading ? (
                <View style={{gap: 6, marginBottom: 16}}>
                  {[300, 320, 200, 280, 240].map((w, i) => (
                    <Skeleton key={i} animation="pulse" variant="text" style={{width: w}} />
                  ))}
                </View>
              ) : city.description ? (
                <View style={cd.descCard}>
                  <ReadMore
                    numberOfLines={4}
                    renderTruncatedFooter={renderTruncatedFooter}
                    renderRevealedFooter={renderRevealedFooter}
                    onReady={handleTextReady}>
                    <GlobalText text={city.description} />
                  </ReadMore>
                </View>
              ) : null}

              {/* 3+4 ── Photos & Reviews — data-driven order ── */}
              {!isLoading && (() => {
                const hasPhotos = city?.gallery?.length > 0;
                const hasReviews = commentCount > 0;
                // whichever has data comes first; if both or neither → Photos first
                const photosFirst = hasPhotos || !hasReviews;

                const PhotosSection = hasPhotos ? (
                  <View key="photos" style={cd.section}>
                    <View style={cd.sectionHeader}>
                      <View style={cd.sectionTitleRow}>
                        <Ionicons name="images-outline" size={18} color={C2.ocean} />
                        <Text style={cd.sectionTitle}>Photos</Text>
                        <View style={cd.countBadge}>
                          <Text style={cd.countBadgeText}>{city.gallery.length}</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={goToCityImages} activeOpacity={0.8}>
                        <Text style={cd.viewAllText}>View All →</Text>
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={city.gallery.slice(0, 8)}
                      keyExtractor={(item, i) => String(item.id || i)}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{gap: 8, paddingRight: 4}}
                      renderItem={({item, index}) => (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={goToCityImages}
                          style={cd.photoThumb}>
                          <ImageBackground
                            source={{uri: item.path?.startsWith('http') ? item.path : `${AWS_URL}${item.path}`}}
                            style={{width: '100%', height: '100%'}}
                            imageStyle={{borderRadius: 12}}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                ) : null;

                const ReviewsSection = (
                  <View key="reviews" style={cd.section}>
                    <View style={cd.sectionHeader}>
                      <View style={cd.sectionTitleRow}>
                        <Ionicons name="star-outline" size={18} color={C2.ocean} />
                        <Text style={cd.sectionTitle}>Reviews</Text>
                        {commentCount > 0 && (
                          <View style={cd.countBadge}>
                            <Text style={cd.countBadgeText}>{commentCount}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={cd.reviewCard}>
                      <View style={cd.rateActionRow}>
                        <Text style={cd.rateActionLabel}>Rate this place</Text>
                        <StarRating
                          rating={rating}
                          onChange={onStarRatingPress}
                          enableHalfStar={false}
                          starSize={28}
                          color="#F59E0B"
                          starStyle={{marginHorizontal: 2}}
                        />
                      </View>
                      <TouchableOpacity
                        style={cd.reviewBtn}
                        onPress={openCommentsSheet}
                        activeOpacity={0.85}>
                        <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                        <Text style={cd.reviewBtnText}>
                          {commentCount > 0 ? 'Read & Write Reviews' : 'Be the first to review'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );

                return photosFirst
                  ? <>{PhotosSection}{ReviewsSection}</>
                  : <>{ReviewsSection}{PhotosSection}</>;
              })()}

              {/* 5 ── Villages (places within this city) ── */}
              {isLoading ? (
                <View style={styles.flexAroundSkeleton}>
                  <Skeleton animation="pulse" variant="text" style={{width: 100, height: 30}} />
                  <Skeleton animation="pulse" variant="text" style={{width: 100, height: 30}} />
                </View>
              ) : city?.sites?.[0] ? (
                <View style={cd.section}>
                  <View style={cd.sectionHeader}>
                    <View style={cd.sectionTitleRow}>
                      <Ionicons name="map-outline" size={18} color={C2.ocean} />
                      <Text style={cd.sectionTitle}>{t('VILLAGES')}</Text>
                    </View>
                    <TouchableOpacity onPress={seeMore} activeOpacity={0.8}>
                      <Text style={cd.viewAllText}>{t('BUTTON.SEE_MORE')} →</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{marginLeft: -5}}>
                    {city.sites.map((item, index) => (
                      <View key={item.id || index}>
                        {renderItem({item, index})}
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* 6 ── Map (navigate after deciding to visit) ── */}
              <View style={cd.section}>
                {initialRegion?.latitude && currentLatitude ? (
                  <MapContainer
                    initialRegion={initialRegion}
                    currentLatitude={currentLatitude}
                    currentLongitude={currentLongitude}
                  />
                ) : currentLatitude ? (
                  <MapSkeleton />
                ) : null}
              </View>

              {/* 7 ── Middle Banner ── */}
              {!isLoading && bannerObject?.CITY_MIDDLE?.length > 0 && (
                <View style={{marginLeft: -16, marginBottom: 24, width: DIMENSIONS.screenWidth}}>
                  <Banner
                    bannerImages={bannerObject.CITY_MIDDLE}
                    style={{height: DIMENSIONS.windowWidth / 3, marginBottom: 0}}
                  />
                </View>
              )}

            </View>
          </View>
        )}
        {!isLoading && (
          <>
            {/* PopularSpots hidden: implementation pending */}
            <HotPlaces
              hot_sites={city?.hot_sites ?? []}
              onCardPress={item => navigateTo(navigation, t('SCREEN.SITE_DETAIL'), {city: item})}
            />
          </>
        )}
        {!isLoading &&
          bannerObject?.CITY_FOOTER &&
          bannerObject.CITY_FOOTER.length > 0 && (
            <View style={{marginTop: 24, marginBottom: 80, width: '100%', paddingHorizontal: 16}}>
              <Banner
                bannerImages={bannerObject.CITY_FOOTER}
                style={{height: DIMENSIONS.windowWidth / 3, marginBottom: 0}}
              />
            </View>
          )}
        <BottomSheet
          refRBSheet={refRBSheet}
          height={DIMENSIONS.halfHeight + 50}
          Component={
            <CommentsSheet
              key={city.comment?.length}
              commentable_type={t('TABLE.SITE')}
              commentable_id={city.id}
              navigation={navigation}
              reload={() => getDetails()}
              setLoader={v => setLoader(v)}
              openCommentsSheet={() => openCommentsSheet()}
              closeCommentsSheet={() => closeCommentsSheet()}
            />
          }
          openCommentsSheet={() => openCommentsSheet()}
          closeCommentsSheet={() => closeCommentsSheet()}
        />
        <ComingSoon
          message={errorMessage}
          visible={showOnlineMode}
          toggleOverlay={() => setShowOnlineMode(false)}
        />
      </ScrollView>

      {/* ── Guest Gate Modal ── */}
      <Modal
        visible={isGuestPopup}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsGuestPopup(false)}>
        <View style={guestStyles.backdrop}>
          <View style={guestStyles.card}>
            {/* Icon */}
            <View style={guestStyles.iconWrap}>
              <Text style={guestStyles.iconText}>🔒</Text>
            </View>

            {/* Title & message */}
            <Text style={guestStyles.title}>Members Only</Text>
            <Text style={guestStyles.message}>
              Please register or login to like, rate, and comment on places.
            </Text>

            {/* Buttons */}
            <TouchableOpacity
              style={guestStyles.loginBtn}
              onPress={handleGuestLogin}
              activeOpacity={0.85}>
              <Text style={guestStyles.loginBtnText}>Login / Register</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={guestStyles.cancelBtn}
              onPress={() => setIsGuestPopup(false)}
              activeOpacity={0.7}>
              <Text style={guestStyles.cancelBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
    mode: state.commonState.mode,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoader(data));
    },
  };
};

const C2 = {
  ocean: '#1B6B7B',
  oceanLight: '#EEF6FF',
  text: '#1C1917',
  textLight: '#78716C',
  border: '#E7E5E4',
  card: '#FFFFFF',
  amber: '#F59E0B',
};

const cd = StyleSheet.create({
  heroWrap: {
    width: '100%',
  },
  hero: {
    width: '100%',
    height: 240,
    backgroundColor: '#E5E7EB',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  cityName: {
    fontSize: 22,
    fontWeight: '700',
    color: C2.text,
    letterSpacing: 0.2,
  },
  tagLine: {
    fontSize: 13,
    color: C2.textLight,
    lineHeight: 18,
  },
  ratingQuickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingQuickScore: {
    fontSize: 13,
    fontWeight: '700',
    color: C2.text,
  },
  ratingQuickCount: {
    fontSize: 13,
    color: C2.textLight,
  },
  heartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C2.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  descCard: {
    backgroundColor: C2.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: -16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C2.text,
    letterSpacing: 0.1,
  },
  countBadge: {
    backgroundColor: C2.ocean,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 4,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: C2.ocean,
  },
  photoThumb: {
    width: 120,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  photoThumbFirst: {
    marginLeft: 0,
  },
  reviewCard: {
    backgroundColor: C2.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  rateActionRow: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  rateActionLabel: {
    fontSize: 13,
    color: C2.textLight,
    fontWeight: '500',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C2.ocean,
    borderRadius: 50,
    paddingVertical: 14,
  },
  reviewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});

const guestStyles = StyleSheet.create({
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
  iconText: {
    fontSize: 34,
  },
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

export default connect(mapStateToProps, mapDispatchToProps)(CityDetails);
