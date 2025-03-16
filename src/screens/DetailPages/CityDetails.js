import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Share,
  FlatList,
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
import {FTP_PATH} from '@env';
import {useFocusEffect} from '@react-navigation/native';
import PackageCard from '../../Components/Cards/PackageCard';
import PackageCardSkeleton from '../../Components/Cards/PackageCardSkeleton';

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

  const [isAlert, setIsAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    setLoader(true);
    return () => {
      backHandler.remove();
    };
  }, [cityId]);

  useFocusEffect(
    React.useCallback(async () => {
      setCityDetails();
    }, [route.params.city.id]),
  );

  const setCityDetails = () => {
    setLoader(true);
    setCity(route.params.city);
    setIsFav(route.params.city.is_favorite);
    setRating(route.params.city.rating_avg_rate || 0);
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
          setRating(res.data.data.rating_avg_rate || 0);
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

  const openCommentsSheet = () => {
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
      <ScrollView style={{backgroundColor: '#fff'}}>
        <Popup message={alertMessage} onPress={closePopup} visible={isAlert} />

        <Loader />

        {city && (
          <View>
            <View style={styles.placeImageView}>
              {isLoading ? (
                <Skeleton
                  animation="pulse"
                  variant="text"
                  style={styles.placeImage}
                />
              ) : city?.gallery && city?.gallery[0] ? (
                <GalleryView images={city.gallery.slice(0, 3)} />
              ) : city?.image ? (
                <ImageBackground
                  source={{uri: FTP_PATH + city.image}}
                  style={styles.placeImage}
                  imageStyle={styles.cityImageStyle}
                  resizeMode="cover"
                />
              ) : (
                // <ImageBackground
                //     source={{ uri: FTP_PATH + city.image }}
                //     style={styles.placeImage}
                // />
                <ImageBackground
                  source={require('../../Assets/Images/no-image.png')}
                  style={styles.placeImage}
                  imageStyle={styles.cityImageStyle}
                  resizeMode="cover"
                />
              )}
              {city?.gallery && city?.gallery[0] && (
                <TextButton
                  title={t('BUTTON.SEE_MORE')}
                  buttonView={styles.searchButtonStyle}
                  titleStyle={styles.buttonTitleStyle}
                  raised={false}
                  onPress={goToCityImages}
                />
              )}
            </View>
            <View style={{padding: 10}}>
              {isLoading ? (
                <>
                  <Skeleton
                    animation="pulse"
                    variant="text"
                    style={{width: 130, height: 20}}
                  />
                  <Skeleton
                    animation="pulse"
                    variant="text"
                    style={{marginTop: 5, width: 190}}
                  />
                </>
              ) : (
                <View>
                  <View style={styles.flexBetween}>
                    <View style={styles.flexRow}>
                      <MaterialIcons
                        name="location-pin"
                        color={COLOR.themeBlue}
                        size={DIMENSIONS.iconSize}
                      />
                      <GlobalText text={city.name} style={styles.detailTitle} />
                    </View>
                    <TouchableOpacity
                      style={styles.cityLikeView}
                      onPress={() => onHeartClick()}>
                      <Octicons
                        name={isFav ? 'heart-fill' : 'heart'}
                        color={isFav ? COLOR.red : COLOR.black}
                        size={DIMENSIONS.iconSize}
                      />
                    </TouchableOpacity>
                  </View>
                  <GlobalText
                    text={city.tag_line}
                    style={styles.detailSubTitle}
                  />
                </View>
              )}

              <View style={styles.detailsTitleView}>
                <View>
                  {isLoading ? (
                    <>
                      <Skeleton
                        animation="pulse"
                        variant="text"
                        style={{
                          marginTop: 12,
                          width: 100,
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <View style={styles.cityStarView}>
                        <StarRating
                          rating={rating}
                          onChange={onStarRatingPress} // Modified function name
                          enableHalfStar={false}
                          starSize={DIMENSIONS.iconMedium}
                          color={COLOR.yellow}
                          starStyle={styles.starStyle}
                        />
                        {rating > 0 && (
                          <GlobalText text={rating} style={styles.avgRating} />
                        )}
                        <GlobalText text={`   ( ${commentCount} Reviews )`} />
                      </View>
                    </>
                  )}
                </View>
              </View>

              {isLoading ? (
                <>
                  <Skeleton
                    animation="pulse"
                    variant="text"
                    style={{width: 300}}
                  />
                  <Skeleton
                    animation="pulse"
                    variant="text"
                    style={{marginTop: 5, width: 320}}
                  />
                  <Skeleton
                    animation="pulse"
                    variant="text"
                    style={{marginTop: 5, width: 200}}
                  />
                  <Skeleton
                    animation="pulse"
                    variant="text"
                    style={{marginTop: 5, width: 300}}
                  />
                  <Skeleton
                    animation="pulse"
                    variant="text"
                    style={{marginTop: 5, width: 250}}
                  />
                </>
              ) : (
                <ReadMore
                  numberOfLines={5}
                  renderTruncatedFooter={renderTruncatedFooter}
                  renderRevealedFooter={renderRevealedFooter}
                  onReady={handleTextReady}>
                  <GlobalText text={city.description} />
                </ReadMore>
              )}

              <View style={styles.sectionView}>
                {initialRegion && initialRegion.latitude && currentLatitude ? (
                  <MapContainer
                    initialRegion={initialRegion}
                    currentLatitude={currentLatitude}
                    currentLongitude={currentLongitude}
                  />
                ) : currentLatitude ? (
                  <MapSkeleton />
                ) : null}
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}>
                {isLoading ? (
                  <View style={styles.flexAroundSkeleton}>
                    <Skeleton
                      animation="pulse"
                      variant="text"
                      style={{width: 100, height: 30}}
                    />
                    <Skeleton
                      animation="pulse"
                      variant="text"
                      style={{width: 100, height: 30}}
                    />
                  </View>
                ) : city.sites[0] ? (
                  <View style={styles.flexAround}>
                    <GlobalText
                      text={t('VILLAGES')}
                      style={styles.sectionTitle}
                    />
                    <TextButton
                      title={t('BUTTON.SEE_MORE')}
                      buttonView={styles.villagesButtonView}
                      titleStyle={styles.villagesTitleStyle}
                      raised={false}
                      onPress={() => seeMore()}
                    />
                  </View>
                ) : null}
              </View>
              <View style={{marginLeft: -5}}>
                {isLoading ? (
                  <View>
                    <FlatList
                      keyExtractor={item => item.id}
                      data={city.sites}
                      renderItem={() => (
                        <PackageCardSkeleton cardType={'long'} />
                      )}
                    />
                  </View>
                ) : city.sites[0] ? (
                  <FlatList
                    keyExtractor={item => item.id}
                    data={city.sites}
                    renderItem={renderItem}
                  />
                ) : (
                  <View style={{marginTop: 20}}>
                    <GlobalText text={t('ADDED')} style={styles.boldText} />
                  </View>
                )}
              </View>
            </View>
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

export default connect(mapStateToProps, mapDispatchToProps)(CityDetails);
