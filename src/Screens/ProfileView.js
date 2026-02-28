/* eslint-disable react-hooks/exhaustive-deps */
import {
  View,
  ScrollView,
  BackHandler,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import Header from '../Components/Common/Header';
import COLOR from '../Services/Constants/COLORS';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  comnPost,
  dataSyncResult,
  saveToStorage,
  getFromStorage,
} from '../Services/Api/CommonServices';
import {connect} from 'react-redux';
import Loader from '../Components/Customs/Loader';
import {setLoader} from '../Reducers/CommonActions';
import {Image} from '@rneui/themed';
import styles from './Styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {checkLogin, navigateTo} from '../Services/CommonMethods';
import GlobalText from '../Components/Customs/Text';
import TextButton from '../Components/Customs/Buttons/TextButton';
import Geolocation from '@react-native-community/geolocation';
import {Overlay} from '@rneui/themed';
import NetInfo from '@react-native-community/netinfo';
import CheckNet from '../Components/Common/CheckNet';
import {useTranslation} from 'react-i18next';
import ProfileChip from '../Components/Common/ProfileChip';
import ChipOptions from '../Components/Common/ProfileViews/ChipOptions';
import ChangeLang from '../Components/Common/ProfileViews/ChangeLang';
import UpdateProfile from '../Components/Common/ProfileViews/UpdateProfile';
import ProfileChipSkeleton from '../Components/Common/ProfileChipSkeleton';
import MapContainer from '../Components/Common/MapContainer';
import MapSkeleton from '../Components/Common/MapSkeleton';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import DIMENSIONS from '../Services/Constants/DIMENSIONS';
import ComingSoon from '../Components/Common/ComingSoon';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {FTP_PATH} from '@env';
import {SafeAreaView} from 'react-native-safe-area-context';

const ProfileView = ({navigation, route, ...props}) => {
  const {t} = useTranslation();

  const [currentLatitude, setCurrentLatitude] = useState();
  const [currentLongitude, setCurrentLongitude] = useState();
  const [, setLocationStatus] = useState('');
  const [watchID, setWatchID] = useState('');
  const [showLocModal, setShowLocModal] = useState(false);
  const [initialRegion, setInitialRegion] = useState({});
  const [profile, setProfile] = useState([]);
  const [, setError] = useState(null);
  const [offline, setOffline] = useState(false);
  const [option, setOption] = useState(0);
  const [uploadImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAlert, setIsAlert] = useState(false);
  const [showOnlineMode, setShowOnlineMode] = useState(false);
  const safeAreaStyle = {flex: 1, backgroundColor: COLOR.white};
  const noLocationViewStyle = {
    height: 150,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.lightGrey,
    borderRadius: 10,
    marginVertical: 10,
  };
  const noLocationTextStyle = {color: COLOR.grey};

  useEffect(() => {
    props.setLoader(true);
    const backHandler = BackHandler.addEventListener(
      t('EVENT.HARDWARE_BACK_PRESS'),
      () => backPress(),
    );
    // requestLocationPermission();
    checkLogin(navigation);
    // getUserProfile();
    const unsubscribeFocus = navigation.addListener(t('EVENT.FOCUS'), () => {
      if (props.mode) {
        getUserProfile();
      }
    });

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(false);
      dataSyncResult(
        t('STORAGE.PROFILE_RESPONSE'),
        () => getUserProfile(),
        props.mode,
      ).then(result => {
        if (result.source === 'network') {
          props.setLoader(false);
          return;
        }

        const resp = result.data;
        if (resp) {
          const res = typeof resp === 'string' ? JSON.parse(resp) : resp;
          setProfile(res);
          setOption(0);
          if (res?.addresses && res.addresses.length > 0) {
            const latitude = res.addresses[0]?.latitude ?? null;
            const longitude = res.addresses[0]?.longitude ?? null;
            setLocationMap(latitude, longitude);
          }
          props.setLoader(false);
          setRefreshing(false);
        } else if (result.offline) {
          setOffline(true);
        }
        props.setLoader(false);
      });
      // removeFromStorage(t("STORAGE.LANDING_RESPONSE"))
    });
    return () => {
      Geolocation.clearWatch(watchID);
      backHandler.remove();
      unsubscribeFocus();
      unsubscribe();
    };
  }, [route]);

  const onRefresh = () => {
    setRefreshing(true);
    if (props.mode) {
      getUserProfile();
    } else {
      setShowOnlineMode(true);
      setRefreshing(false);
    }
  };

  const backPress = async () => {
    if (option === 0) {
      const accessToken = await AsyncStorage.getItem(t('STORAGE.ACCESS_TOKEN'));
      if (
        accessToken === null ||
        accessToken === ''
      ) {
        navigateTo(navigation, t('SCREEN.EMAIL'));
      } else {
        navigateTo(navigation, t('SCREEN.HOME'));
      }
    } else {
      setOption(0);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      getOneTimeLocation();
      subscribeLocation();
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('LOCATION_ACCESS_REQUIRED'),
            message: t('NEEDS_TO_ACCESS'),
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          //To Check, If Permission is granted
          getOneTimeLocation();
          subscribeLocation();
        } else {
          setLocationStatus(t('PERMISSION_DENIED'));
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const getOneTimeLocation = () => {
    setLocationStatus(t('GETTING_LOCATION'));
    Geolocation.getCurrentPosition(
      //Will give you the current location
      position => {
        setLocationStatus(t('YOU_ARE_HERE'));
        setInitialLocation(position.coords.longitude, position.coords.latitude);
        const coordsLongitude = position.coords.longitude;
        //getting the Longitude from the location json
        const coordsLatitude = position.coords.latitude;
        //getting the Latitude from the location json
        setCurrentLongitude(coordsLongitude);
        //Setting state Longitude to re re-render the Longitude Text
        setCurrentLatitude(coordsLatitude);
        //Setting state Latitude to re re-render the Longitude Text
      },
      geoError => {
        setLocationStatus(geoError.message);
      },
      {enableHighAccuracy: false, timeout: 30000, maximumAge: 1000},
    );
  };

  const subscribeLocation = () => {
    let WatchID = Geolocation.watchPosition(
      position => {
        setLocationStatus(t('YOU_ARE_HERE'));
        //Will give you the location on location change
        const coordsLongitude = position.coords.longitude;
        //getting the Longitude from the location json
        const coordsLatitude = position.coords.latitude;
        //getting the Latitude from the location json
        setCurrentLongitude(coordsLongitude);
        //Setting state Longitude to re re-render the Longitude Text
        setCurrentLatitude(coordsLatitude);
        //Setting state Latitude to re re-render the Longitude Text
      },
      geoError => {
        setLocationStatus(geoError.message);
      },
      {enableHighAccuracy: false, maximumAge: 1000},
    );
    setWatchID(WatchID);
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
    if (lat && long) {
      setInitialLocation(lat, long);
      setCurrentLatitude(parseFloat(lat));
      setCurrentLongitude(parseFloat(long));
    }
  };

  const getUserProfile = () => {
    if (props.mode) {
      console.log('Fetching user profile...');
      console.log('Access Token:', props.access_token);

      return comnPost('v2/user-profile', props.access_token, navigation)
        .then(res => {
          console.log('API Response:', res);

          if (res && res.data.data) {
            saveToStorage(
              t('STORAGE.PROFILE_RESPONSE'),
              JSON.stringify(res.data.data),
            );
            setProfile(res.data.data); // Update places state with response data
            setOption(0);
            if (res.data.data.addresses && res.data.data.addresses.length > 0) {
              setLocationMap(
                res.data.data.addresses[0].latitude,
                res.data.data.addresses[0].longitude,
              );
            }
          } else {
            console.warn('No profile data found in response.');
          }

          props.setLoader(false);
          setRefreshing(false);
          return res?.data?.data ?? null;
        })
        .catch(profileError => {
          console.error('Error fetching user profile:', profileError.message); // Log any errors
          setError(profileError.message); // Update error state with error message
          props.setLoader(false);
          setRefreshing(false);
          return null;
        });
    } else {
      console.warn('App is in offline mode. Cannot fetch user profile.');
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      const state = await NetInfo.fetch();
      const isConnected = state.isConnected;

      // Retrieve the app's mode
      const mode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));

      // Combined condition for all three cases
      if (
        (isConnected && !mode) || // Case 1: Internet is available but mode is offline
        (!isConnected && !mode) || // Case 2: Internet is not available and mode is offline
        (!isConnected && mode) // Case 3: Internet is not available but mode is online
      ) {
        // Determine the alert message based on the condition
        const alertMessage =
          !isConnected && !mode
            ? t('ALERT.NETWORK') // Alert: No internet and mode is offline
            : !isConnected && mode
            ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE') // Alert: No internet but mode is online
            : isConnected && !mode
            ? t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE') // Alert: Internet is available but mode is offline
            : ''; // Default case (optional)

        // Display the alert with the dynamic message
        Alert.alert(
          t('ALERT.TITLE'), // You can set your alert title, e.g., "Connectivity Issue"
          alertMessage,
          [{text: 'OK'}],
          {cancelable: false},
        );

        return;
      }

      props.setLoader(true);

      const res = await comnPost('v2/logout');

      if (res.data.success) {
        await GoogleSignin.signOut();
        // await clearStorageExcept(['IS_FIRST_TIME', 'MODE']);
        await AsyncStorage.clear();

        setIsAlert(false);
        // loggedOut(t('SCREEN.LANG_SELECTION'));
        // Show a thank you message
        Alert.alert(
          t('ALERT.THANK_YOU'),
          t('ALERT.VISIT_AGAIN'),
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{name: t('SCREEN.EMAIL')}],
                });
              },
            },
          ],
          {cancelable: false},
        );
      } else {
        console.error('Logout failed:', res.data.message); // Log API response message
      }
    } catch (logoutError) {
      console.error('Logout error:', logoutError); // Log any errors
    } finally {
      props.setLoader(false); // Ensure loader is stopped regardless of success or failure
    }
  };

  const referralClick = async () => {
    try {
      const deepLink = `awesomeapp://SignUp?code=${profile.uid}`;
      const shareMessage = t('REFER_EARN') + `\nReferral code: ${profile.uid}`;
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
    } catch (shareError) {
      console.error('Error sharing content:', shareError.message);
    }
  };

  const setHomeLocation = () => {
    // Update Location
    requestLocationPermission();
    setShowLocModal(false);
  };

  const setCurrLocation = () => {
    requestLocationPermission();
    setShowLocModal(false);
  };

  return (
    <SafeAreaView edges={['top']} style={safeAreaStyle}>
    <ScrollView
      style={styles.container}
      key={option}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <CheckNet isOff={offline} />
      <Header
        // style={{ backgroundColor: "transparent", zIndex: 10 }}
        name={''}
        startIcon={
          <Ionicons
            name="chevron-back-outline"
            size={24}
            onPress={() => backPress()}
            color={COLOR.black}
          />
        }
      />
      <Loader />

      <View style={styles.profileContainer}>
        <View style={styles.coinsView}>
          <FontAwesome5
            name="coins"
            color={COLOR.yellow}
            size={DIMENSIONS.iconSize}
          />
          <GlobalText text={profile.wallets_sum_amount} />
        </View>
        <Image
          style={styles.profilePhoto}
          source={{
            uri: `${
              profile.profile_picture
                ? FTP_PATH + profile.profile_picture
                : 'https://api-private.atlassian.com/users/2143ab39b9c73bcab4fe6562fff8d23d/avatar'
            }`,
          }}
        />
        {/* the profile photo update commented for we are using gmail sign in it provides profile deatils */}
        {/* {option == 3 && (
          <Octicons
            name="pencil"
            size={17}
            onPress={() => handleImageUpload()}
            color={COLOR.black}
            style={styles.profileEdit}
          />
        )} */}
        <GlobalText text={profile.email} style={styles.pricingOptionTitle} />
      </View>

      <View style={styles.headerContainer}>
        <GlobalText text={t('ADDRESS')} />
        {profile && profile.id ? (
          initialRegion && initialRegion.latitude && currentLatitude ? (
            <MapContainer
              initialRegion={initialRegion}
              currentLatitude={currentLatitude}
              currentLongitude={currentLongitude}
            />
          ) : (
              <View style={noLocationViewStyle}>
                <Ionicons name="location-outline" size={40} color={COLOR.grey} />
                <GlobalText text={t('NO_LOCATION_SET') || 'No Location Set'} style={noLocationTextStyle} />
              </View>
          )
        ) : (
          <MapSkeleton />
        )}
      </View>

      <View style={styles.chipContainer}>
        {profile && profile.id ? (
            option === 0 ? (
            <ChipOptions
              languageClick={() => setOption(1)}
              locationClick={() => setShowLocModal(true)}
              profileClick={() => setOption(3)}
              logoutClick={() => setIsAlert(true)}
              referralClick={() => referralClick()}
              uid={profile.uid}
            />
            ) : option === 1 ? (
            <ChangeLang
              refreshOption={() => getUserProfile()}
              setLoader={v => props.setLoader(v)}
            />
            ) : option === 3 ? (
            <UpdateProfile
              user={profile.email}
              phone={profile.mobile}
              uploadImage={uploadImage}
              refreshOption={() => getUserProfile()}
              isConnected={offline}
              setLoader={v => props.setLoader(v)}
            />
          ) : (
            <ProfileChip />
          )
        ) : (
          <View>
            <ProfileChipSkeleton />
            <ProfileChipSkeleton />
            <ProfileChipSkeleton />
            <ProfileChipSkeleton />
            <ProfileChipSkeleton />
          </View>
        )}
      </View>

      <Overlay
        style={styles.locationModal}
        isVisible={showLocModal}
        onBackdropPress={() => setShowLocModal(false)}>
        <GlobalText text={t('SET_LOCATION')} style={styles.locationModal} />
        <View>
          <TextButton
            title={t('BUTTON.HOME_LOCATION')}
            buttonView={styles.locBtnStyle}
            titleStyle={styles.locButtonTitle}
            raised={false}
            onPress={setHomeLocation}
            startIcon={
              <Ionicons name="home" size={24} color={COLOR.themeBlue} />
            }
          />
          <TextButton
            title={t('BUTTON.CURRENT_LOCATION')}
            buttonView={styles.locBtnStyle}
            titleStyle={styles.locButtonTitle}
            raised={false}
            onPress={setCurrLocation}
            startIcon={
              <Ionicons name="location" size={24} color={COLOR.themeBlue} />
            }
          />
        </View>
      </Overlay>

      <Overlay
        style={styles.locationModal}
        isVisible={isAlert}
        onBackdropPress={() => setIsAlert(false)}>
        <GlobalText
          text={t('ALERT.LOGOUT_ALERT')}
          style={styles.locationModal}
        />
        <View style={styles.flexRow}>
          <TextButton
            title={t('BUTTON.NO')}
            buttonView={styles.logoutButtonStyle}
            titleStyle={styles.locButtonTitle}
            raised={false}
            onPress={() => setIsAlert(false)}
          />
          <TextButton
            title={t('BUTTON.YES')}
            buttonView={styles.logoutButtonStyle}
            titleStyle={styles.locButtonTitle}
            raised={false}
            onPress={handleLogout}
          />
        </View>
      </Overlay>
      <ComingSoon
        message={t('ONLINE_MODE')}
        visible={showOnlineMode}
        toggleOverlay={() => setShowOnlineMode(false)}
      />
    </ScrollView>
    </SafeAreaView>
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

export default connect(mapStateToProps, mapDispatchToProps)(ProfileView);
