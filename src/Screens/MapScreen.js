/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import styles from './Styles';
import {comnPost, dataSyncResult} from '../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {setLoader} from '../Reducers/CommonActions';
import Loader from '../Components/Customs/Loader';
import {checkLogin, goBackHandler} from '../Services/CommonMethods';
import NetInfo from '@react-native-community/netinfo';
import {useTranslation} from 'react-i18next';
import CheckNet from '../Components/Common/CheckNet';
import DIMENSIONS from '../Services/Constants/DIMENSIONS';
import GlobalText from '../Components/Customs/Text';
import {SafeAreaView} from 'react-native-safe-area-context';
import COLOR from '../Services/Constants/COLORS';

const MapScreen = ({navigation, ...props}) => {
  const {t} = useTranslation();
  const mapRef = useRef(null);

  const [cities, setCities] = useState([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    props.setLoader(true);
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(false);

      dataSyncResult(
        t('STORAGE.CITIES_RESPONSE'),
        () => getCities(),
        props.mode,
      ).then(result => {
        try {
          const parsed =
            typeof result.data === 'string'
              ? JSON.parse(result.data)
              : result.data;
          if (Array.isArray(parsed)) {
            setCities(parsed);
          } else if (parsed?.data?.data?.data) {
            setCities(parsed.data.data.data);
          }
        } catch {
          setOffline(true);
        }
        props.setLoader(false);
      });
    });

    return () => {
      backHandler.remove();
      unsubscribe();
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
        }, 1000);
      }
    }
  };

  useEffect(() => {
    fitMap();
  }, [cities]);

  const getCities = () => {
    if (props.mode) {
      props.setLoader(true);
      let data = {
        apitype: 'list',
        category: 'City',
      };
      comnPost('v2/sites', data, navigation)
        .then(async res => {
          if (res && res.data.data) {
            setCities(res.data.data.data);
          }
          props.setLoader(false);
        })
        .catch(error => {
          console.error('Error fetching cities:', error);
          props.setLoader(false);
        });
    }
  };

  return (
    <SafeAreaView edges={['top']} style={localStyles.safeArea}>
      <Loader />
      <CheckNet isOff={offline} />
      {offline ? (
        <View style={localStyles.offlineContainer}>
          <GlobalText
            style={localStyles.offlineText}
            text={
              offline
                ? t('NO_INTERNET_MAP')
                : !props.isLoading
                ? t('NO_DATA')
                : ''
            }
          />
        </View>
      ) : (
        cities.length > 0 && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: parseFloat(cities[0].latitude) || 16.6956,
                longitude: parseFloat(cities[0].longitude) || 73.4660,
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
                if (isNaN(lat) || isNaN(lng)) {
                  return null;
                }
                return (
                  <Marker
                    key={marker.id}
                    coordinate={{
                      latitude: lat,
                      longitude: lng,
                    }}
                    title={marker.name}
                    description={marker.name}
                  />
                );
              })}
            </MapView>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLOR.white,
  },
  offlineContainer: {
    height: DIMENSIONS.screenHeight,
    alignItems: 'center',
    padding: 50,
  },
  offlineText: {
    fontWeight: 'bold',
  },
});

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
