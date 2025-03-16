import React, {useState, useRef} from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  View,
  Platform,
  TouchableOpacity,
  PermissionsAndroid,
} from 'react-native';
import GlobalText from '../Customs/Text';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import Search from '../Customs/Search';
import {comnPost} from '../../Services/Api/CommonServices';
import {ListItem} from '@rneui/themed';
import styles from './Styles';
import DialogBox from 'react-native-dialogbox';
import Geolocation from '@react-native-community/geolocation';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GOOGLE_API, GOOGLE_API_KEY} from '@env';

const LocationSheet = ({
  openLocationSheet,
  closeLocationSheet,
  setCurrentCity,
}) => {
  const refDialogBox = useRef();
  const {t} = useTranslation();

  const [searchValue, setSearchValue] = useState('');
  const [placesList, setPlacesList] = useState([]);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [currentLatitude, setCurrentLatitude] = useState(null);
  const [currentLongitude, setCurrentLongitude] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [watchID, setWatchID] = useState('');

  const searchPlace = (val, table) => {
    setSearchValue(val);
    let data = {
      apitype: 'list',
      search: val,
      category: 'city',
    };
    if (val.length >= 1) {
      comnPost('v2/sites', data)
        .then(res => {
          if (res && res.data.data) setPlacesList(res.data.data.data);
          props.setLoader(false);
        })
        .catch(error => {
          props.setLoader(false);
        });
    } else {
      setPlacesList([]);
    }
  };

  const renderItem = ({item}) => {
    return (
      <ListItem bottomDivider onPress={() => onListItemClick(item.name)}>
        <ListItem.Content>
          <ListItem.Title>{item.name}</ListItem.Title>
        </ListItem.Content>
      </ListItem>
    );
  };

  const onListItemClick = name => {
    setCurrentCity(name);
    closeLocationSheet();
  };

  const myLocationPress = async () => {
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
      position => {
        setLocationStatus(t('YOU_ARE_HERE'));
        const currentLongitude = position.coords.longitude;
        const currentLatitude = position.coords.latitude;
        setCurrentLongitude(currentLongitude);
        setCurrentLatitude(currentLatitude);
      },
      error => {
        setLocationStatus(error.message);
      },
      {enableHighAccuracy: false, timeout: 30000, maximumAge: 1000},
    );
  };

  const subscribeLocation = () => {
    let WatchID = Geolocation.watchPosition(
      position => {
        setLocationStatus(t('YOU_ARE_HERE'));
        const currentLongitude = position.coords.longitude;
        const currentLatitude = position.coords.latitude;
        setCurrentLongitude(currentLongitude);
        setCurrentLatitude(currentLatitude);
      },
      error => {
        setLocationStatus(error.message);
      },
      {enableHighAccuracy: false, maximumAge: 1000},
    );
    setWatchID(WatchID);
  };

  const getCurrentLoc = () => {
    if (Platform.OS === 'ios') {
      try {
        navigator.geolocation
          .getCurrentPosition(
            position => {
              setLatitude(position.coords.latitude);
              setLongitude(position.coords.longitude);
            },
            error => {
              closeLocationSheet();
              setAddress();
              return true;
            },
            {enableHighAccuracy: false, timeout: 15000},
          )
          .catch(e => {});
      } catch (e) {}
    } else {
      try {
        RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
          interval: 10000,
          fastInterval: 5000,
        })
          .then(data => {
            setPermissions();
          })
          .catch(err => {
            closeLocationSheet();
          });
        return true;
      } catch (e) {}
    }
  };

  const setAddress = async () => {
    if (props.currAddr !== undefined && props.currAddr !== null) {
      await AsyncStorage.setItem(
        t('STORAGE.ADDRESS'),
        JSON.stringify(props.currAddr),
      );
    }
  };

  setPermissions = async () => {
    if (Platform.OS === 'ios') {
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted === t('GRANTED')) {
        navigator.geolocation
          .getCurrentPosition(
            position => {
              setLatitude(position.coords.latitude);
              setLongitude(position.coords.longitude);
              getAddress(position);
            },
            error => {
              closeLocationSheet();
              setAddress();
              return true;
            },
            {enableHighAccuracy: false, timeout: 15000},
          )
          .catch(e => {});
      } else {
        closeLocationSheet();
        return true;
      }
    }
  };

  const getAddress = position => {
    closeLocationSheet();
    fetch(
      GOOGLE_API +
        position.coords.latitude +
        ',' +
        position.coords.longitude +
        '&key=' +
        t(GOOGLE_API_KEY),
    )
      .then(response => response.json())
      .then(json => {
        let currentcity = '';
        let zip = '',
          state = 'Maharashtra';
        let locality = '';
        let locality1 = '';
        let locality2 = '';
        for (let i = 0; i < json.results[0].address_components.length; i++) {
          for (
            let j = 0;
            j < json.results[0].address_components[i].types.length;
            j++
          ) {
            if (json.results[0].address_components[i].types[j] === 'locality') {
              currentcity = json.results[0].address_components[i].long_name;
            }
            if (
              json.results[0].address_components[i].types[j] === 'postal_code'
            ) {
              zip = json.results[0].address_components[i].long_name;
            }
            if (
              json.results[0].address_components[i].types[j] ===
              'administrative_area_level_1'
            ) {
              state = json.results[0].address_components[i].long_name;
            }
            if (
              json.results[0].address_components[i].types[j] ===
                'sublocality_level_2' ||
              json.results[0].address_components[i].types[j] === 'route'
            ) {
              locality1 = json.results[0].address_components[i].long_name;
            }
            if (
              json.results[0].address_components[i].types[j] ===
              'sublocality_level_1'
            ) {
              locality2 = json.results[0].address_components[i].long_name;
            }
          }
        }

        if (locality1 !== '') {
          locality = locality1 + ', ' + locality2 + ', ' + currentcity;
        } else {
          locality = json.results[0].formatted_address;
        }

        var addr = {
          addr: json.results[0].formatted_address,
          city: currentcity,
          zip: zip,
          lat: json.results[0].geometry.location.lat,
          lng: json.results[0].geometry.location.lng,
          locality: locality,
          loacaity1: locality1,
          locality2: locality2,
          state: state,
          country: 'INDIA',
        };
        var rgData = {
          addr: json.results[0].formatted_address,
          city: currentcity,
          zip: zip,
          lat: json.results[0].geometry.location.lat,
          lng: json.results[0].geometry.location.lng,
          loacaity1: locality1,
          locality2: locality2,
          state: state,
          country: 'INDIA',
        };
        setCurrAddr(addr);
      })
      .catch(error => {});
  };

  return (
    <View>
      <View style={{position: 'relative'}}>
        <Search
          placeholder={t('SEARCH_FOR_AREA')}
          value={searchValue}
          onChangeText={text => searchPlace(text, 'places')}
        />
      </View>
      {placesList[0] && (
        <SafeAreaView style={styles.listView}>
          <ScrollView>
            <FlatList
              keyExtractor={item => item.id}
              data={placesList}
              renderItem={renderItem}
            />
          </ScrollView>
        </SafeAreaView>
      )}
      <TouchableOpacity
        style={styles.currLocView}
        onPress={() => myLocationPress()}>
        <MaterialIcons
          name="my-location"
          color={COLOR.black}
          size={DIMENSIONS.userIconSize}
          style={{marginRight: 20}}
        />
        <GlobalText text={t('USE_CURRENT_LOCATION')} style={styles.fontBold} />
      </TouchableOpacity>

      <View style={styles.recentsView}>
        <GlobalText text={t('RECENT_LOCATION')} style={styles.fontBold} />
        <TouchableOpacity
          style={styles.recentsListView}
          onPress={() => closeLocationSheet()}>
          <MaterialIcons
            name="location-pin"
            color={COLOR.themeLightBlue}
            size={DIMENSIONS.userIconSize}
            style={{marginRight: 20}}
          />
          <View>
            <GlobalText text={t('CITY.KANKAVLI')} />
            <GlobalText text={t('CITY.MAHARASHTRA')} />
          </View>
        </TouchableOpacity>
      </View>

      <DialogBox
        ref={refDialogBox}
        onDismiss={() => refDialogBox.current.close()}
      />
    </View>
  );
};

export default LocationSheet;
