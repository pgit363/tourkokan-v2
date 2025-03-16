import React, {useEffect, useRef, useState} from 'react';
import {ScrollView, View, RefreshControl} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import styles from './Styles';
import {comnPost, dataSync} from '../Services/Api/CommonServices';
import {connect} from 'react-redux';
import {setLoader} from '../Reducers/CommonActions';
import Loader from '../Components/Customs/Loader';
import {checkLogin, goBackHandler} from '../Services/CommonMethods';
import NetInfo from '@react-native-community/netinfo';
import {useTranslation} from 'react-i18next';
import CheckNet from '../Components/Common/CheckNet';
import DIMENSIONS from '../Services/Constants/DIMENSIONS';
import GlobalText from '../Components/Customs/Text';

const MapScreen = ({navigation, ...props}) => {
  const {t} = useTranslation();
  const mapRef = useRef(null);

  const [cities, setCities] = useState([]);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    props.setLoader(true);
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);

    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(false);

      dataSync(t('STORAGE.CITIES_RESPONSE'), getCities(), props.mode).then(
        resp => {
          if (resp) {
            let res = JSON.parse(resp);
            setCities(res);
            if (mapRef.current) {
              const coordinates = res.map(marker => {
                return {
                  latitude: parseFloat(marker.latitude),
                  longitude: parseFloat(marker.longitude),
                };
              });
              mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: {
                  top: 40,
                  right: 40,
                  bottom: 40,
                  left: 40,
                },
                animated: true,
              });
            }
          } else if (resp) {
            setOffline(true);
          }
          props.setLoader(false);
        },
      );
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, []);

  const getCities = () => {
    if (props.mode) {
      props.setLoader(true);
      let data = {
        apitype: 'list',
        category: 'City',
      };
      comnPost(`v2/sites`, data, navigation)
        .then(async res => {
          if (res && res.data.data) setCities(res.data.data.data);
          props.setLoader(false);
          setRefreshing(false);
          if (mapRef.current) {
            const coordinates = res.data.data.data.map(marker => {
              return {
                latitude: parseFloat(marker.latitude),
                longitude: parseFloat(marker.longitude),
              };
            });
            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: {
                top: 40,
                right: 40,
                bottom: 40,
                left: 40,
              },
              animated: true,
            });
          }
        })
        .catch(error => {
          props.setLoader(false);
          setRefreshing(false);
        });
    }
  };

  return (
    <>
      <Loader />
      <CheckNet isOff={offline} />
      {offline ? (
        <View
          style={{
            height: DIMENSIONS.screenHeight,
            alignItems: 'center',
            padding: 50,
          }}>
          <GlobalText
            style={{fontWeight: 'bold'}}
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
        cities[0] && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: parseFloat(cities[3].latitude),
                longitude: parseFloat(cities[3].longitude),
                latitudeDelta: 0.7,
                longitudeDelta: 0.7,
              }}
              scrollEnabled={false}
              zoomEnabled={false}>
              {cities.map(marker => (
                <Marker
                  key={marker.id}
                  coordinate={{
                    latitude: parseFloat(marker.latitude),
                    longitude: parseFloat(marker.longitude),
                  }}
                  title={marker.name}
                  description={marker.name}
                />
              ))}
            </MapView>
          </View>
        )
      )}
    </>
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
