/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from './Styles';
import {comnPost, dataSync, getFromStorage} from '../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {setLoader} from '../Reducers/CommonActions';
import {backPage, checkLogin, goBackHandler} from '../Services/CommonMethods';
import NetInfo from '@react-native-community/netinfo';
import {useTranslation} from 'react-i18next';
import CheckNet from '../Components/Common/CheckNet';
import GlobalText from '../Components/Customs/Text';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {createLogger} from '../Services/Logger';

const log = createLogger('MapScreen');

const MapScreen = ({navigation, ...props}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const [cities, setCities] = useState([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let unsubscribe;
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);

    const init = async () => {
      const localData = await getFromStorage(t('STORAGE.CITIES_RESPONSE'));
      if (localData) {
        setCities(JSON.parse(localData));
      }

      // Fetch only on the first connected event or a genuine offline→online
      // reconnect — NetInfo fires on every detail change.
      let wasConnected = null;
      unsubscribe = NetInfo.addEventListener(state => {
        const connected = !!state.isConnected;
        setOffline(!connected);
        const changed = wasConnected !== connected;
        wasConnected = connected;
        if (!connected || !changed) return;

        dataSync(t('STORAGE.CITIES_RESPONSE'), () => getCities(), props.mode).then(
          resp => {
            if (resp && typeof resp === 'string') {
              try {
                setCities(JSON.parse(resp));
              } catch (e) { log.warn('[caught]', e); }
            }
          },
        );
      });
    };

    init();

    return () => {
      backHandler.remove();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fitMap = () => {
    if (cities.length > 0 && mapRef.current) {
      const coordinates = cities
        .map(marker => ({
          latitude: parseFloat(marker.latitude),
          longitude: parseFloat(marker.longitude),
        }))
        .filter(coord => !isNaN(coord.latitude) && !isNaN(coord.longitude));

      if (coordinates.length > 0) {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50,
              },
              animated: true,
            });
          }
        }, 500);
      }
    }
  };

  useEffect(() => {
    fitMap();
  }, [cities]);

  const getCities = () => {
    if (props.mode) {
      let data = {
        apitype: 'list',
        category: 'City',
      };
      return comnPost('v2/sites', data, navigation)
        .then(async res => {
          if (res && res.data.data) {
            setCities(res.data.data.data);
            return res.data.data.data;
          }
        })
        .catch(error => {
          log.error('Error fetching cities:', error);
        });
    }
  };

  return (
    <View style={mapStyles.screen}>
      {/* Themed header — matches Settings / Emergency pattern */}
      <View style={[mapStyles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={mapStyles.backBtn}
          onPress={() => backPage(navigation)}
          activeOpacity={0.8}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        {/* <Text style={mapStyles.headerTitle}>{t('MAP')}</Text> */}
      </View>
      <View style={mapStyles.headerCurve} />

      <CheckNet isOff={offline} />

      {offline ? (
        <View style={styles.offlineContainer}>
          <GlobalText style={styles.offlineText} text={t('NO_INTERNET_MAP')} />
        </View>
      ) : (
        cities.length > 0 && (
          <View style={mapStyles.mapWrapper}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              initialRegion={{
                latitude: parseFloat(cities[0].latitude) || 16.6956,
                longitude: parseFloat(cities[0].longitude) || 73.466,
                latitudeDelta: 0.7,
                longitudeDelta: 0.7,
              }}
              onMapReady={fitMap}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              zoomTapEnabled={false}
              zoomControlEnabled={false}>
              {cities.map(marker => {
                const lat = parseFloat(marker.latitude);
                const lng = parseFloat(marker.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;
                return (
                  <Marker
                    key={marker.id}
                    coordinate={{latitude: lat, longitude: lng}}
                    title={marker.name}
                    description={marker.name}
                  />
                );
              })}
            </MapView>
          </View>
        )
      )}
    </View>
  );
};

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
    mode: state.commonState.mode,
    isLoading: state.commonState.isLoading,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoader(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MapScreen);

const C = {
  oceanDeep: '#0D3D4A',
  cream: '#FAF7F0',
  white: '#FFFFFF',
};

const mapStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.cream,
  },
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
  mapWrapper: {
    flex: 1,
    marginTop: -1,
  },
});
