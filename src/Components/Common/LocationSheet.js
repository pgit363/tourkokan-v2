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

const LocationSheet = ({
  closeLocationSheet,
  setCurrentCity,
}) => {
  const refDialogBox = useRef();
  const {t} = useTranslation();

  const [searchValue, setSearchValue] = useState('');
  const [placesList, setPlacesList] = useState([]);
  const [, setCurrentLatitude] = useState(null);
  const [, setCurrentLongitude] = useState(null);
  const [, setLocationStatus] = useState('');
  const [, setWatchID] = useState('');
  const searchWrapStyle = {position: 'relative'};
  const locationIconStyle = {marginRight: 20};

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
          if (res && res.data.data) {
            setPlacesList(res.data.data.data);
          }
        })
        .catch(() => {});
    } else {
      setPlacesList([]);
    }
  };

  const renderItem = ({item}) => {
    return (
      <ListItem
        key={item.id || item.name}
        bottomDivider
        onPress={() => onListItemClick(item.name)}>
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
        const coordsLongitude = position.coords.longitude;
        const coordsLatitude = position.coords.latitude;
        setCurrentLongitude(coordsLongitude);
        setCurrentLatitude(coordsLatitude);
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
        const coordsLongitude = position.coords.longitude;
        const coordsLatitude = position.coords.latitude;
        setCurrentLongitude(coordsLongitude);
        setCurrentLatitude(coordsLatitude);
      },
      error => {
        setLocationStatus(error.message);
      },
      {enableHighAccuracy: false, maximumAge: 1000},
    );
    setWatchID(WatchID);
  };

  return (
    <View>
      <View style={searchWrapStyle}>
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
          style={locationIconStyle}
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
            style={locationIconStyle}
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
