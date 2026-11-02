/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
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
import {useSelector} from 'react-redux';
import {useInTrip, useTripForm, useTripCart, categoryNames} from '../Services/trip';
import {selectCartCount} from '../Reducers/tripSlice';
import {navigateTo} from '../Services/CommonMethods';
import STRING from '../Services/Constants/STRINGS';

const log = createLogger('MapScreen');

/**
 * The place the traveller tapped, with the single action the map exists for.
 *
 * Its own component because `useInTrip` is a hook keyed on a site id — calling
 * it in the parent would mean one subscription for whichever place happened to
 * be selected, and a stale `inTrip` the moment another marker is tapped.
 */
const PlaceCard = ({place, navigation, onClose}) => {
  const {t} = useTranslation();
  const {inTrip, pending, toggle} = useInTrip(place?.id);

  if (!place) {
    return null;
  }

  const cats = categoryNames(place).slice(0, 3).join(' · ');

  return (
    <View style={mapStyles.card}>
      <TouchableOpacity
        style={mapStyles.cardClose}
        onPress={onClose}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        accessibilityRole="button">
        <Ionicons name="close" size={16} color={C.textLight} />
      </TouchableOpacity>

      <GlobalText text={place.name} style={mapStyles.cardName} />
      {!!cats && <GlobalText text={cats} style={mapStyles.cardCats} />}

      {/*
        The spinner is not decoration. `toggle` ignores a tap while one is in
        flight, so without a visible pending state a slow reply reads as a
        dead button and the traveller taps again into silence.
      */}
      <TouchableOpacity
        style={[
          mapStyles.cardBtn,
          inTrip && mapStyles.cardBtnOn,
          pending && mapStyles.cardBtnWait,
        ]}
        onPress={() => toggle(navigation)}
        disabled={pending}
        activeOpacity={0.85}
        accessibilityRole="button">
        {pending ? (
          <ActivityIndicator size="small" color={inTrip ? C.oceanDeep : '#FFFFFF'} />
        ) : (
          <Ionicons
            name={inTrip ? 'checkmark' : 'add'}
            size={16}
            color={inTrip ? C.oceanDeep : '#FFFFFF'}
          />
        )}
        <GlobalText
          style={[mapStyles.cardBtnTxt, inTrip && mapStyles.cardBtnTxtOn]}
          text={inTrip ? t('TRIP.MAP_IN_TRIP') : t('TRIP.MAP_ADD_TO_TRIP')}
        />
      </TouchableOpacity>
    </View>
  );
};

const MapScreen = ({navigation, ...props}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const [cities, setCities] = useState([]);
  const [offline, setOffline] = useState(false);

  /**
   * Filters come from the planner's own interest list, not a hardcoded set.
   * If the map offered "Forts" while the planner could not plan around one,
   * the filter would be a promise the next screen breaks.
   */
  const {options, load: loadOptions} = useTripForm();
  /**
   * The cart has to be READ here, not just counted. Without this the slice's
   * count is 0 until some other screen fetches it, so the bar offered a
   * sample trip to someone who already had places picked.
   */
  const {refresh: refreshCart} = useTripCart();
  const [activeCat, setActiveCat] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [selected, setSelected] = useState(null);
  const cartCount = useSelector(selectCartCount);

  /** What is on the map: a filtered category, or the default city overview. */
  const markers = activeCat ? places : cities;

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

  useEffect(() => {
    loadOptions(navigation);
    refreshCart(undefined, navigation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Places for one category. Fetched on demand rather than all at once: the
   * district has far more places than a map can usefully show, and the
   * traveller has just told us which kind they want.
   */
  const pickCategory = async code => {
    setSelected(null);
    if (!code) {
      setActiveCat(null);
      setPlaces([]);
      return;
    }
    setActiveCat(code);
    setLoadingPlaces(true);
    const res = await comnPost(
      'v2/sites',
      {apitype: 'list', category: code},
      navigation,
    );
    const rows = res?.data?.data?.data || [];
    setPlaces(rows.filter(r => r.latitude && r.longitude));
    setLoadingPlaces(false);
  };

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

      {/* Category filters, from the planner's interests. */}
      {!offline && (options?.interests || []).length > 0 && (
        <View style={mapStyles.chipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={mapStyles.chips}>
            <TouchableOpacity
              style={[mapStyles.chip, !activeCat && mapStyles.chipOn]}
              onPress={() => pickCategory(null)}
              activeOpacity={0.85}>
              <GlobalText
                text={t('TRIP.MAP_ALL')}
                style={[mapStyles.chipTxt, !activeCat && mapStyles.chipTxtOn]}
              />
            </TouchableOpacity>
            {(options?.interests || []).map(i => (
              <TouchableOpacity
                key={i.code}
                style={[mapStyles.chip, activeCat === i.code && mapStyles.chipOn]}
                onPress={() => pickCategory(activeCat === i.code ? null : i.code)}
                activeOpacity={0.85}>
                <GlobalText
                  text={i.name}
                  style={[
                    mapStyles.chipTxt,
                    activeCat === i.code && mapStyles.chipTxtOn,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
              onPress={() => setSelected(null)}
              pitchEnabled={false}
              rotateEnabled={false}>
              {markers.map(marker => {
                const lat = parseFloat(marker.latitude);
                const lng = parseFloat(marker.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;
                return (
                  <Marker
                    key={marker.id}
                    coordinate={{latitude: lat, longitude: lng}}
                    onPress={e => {
                      // Stop the tap reaching the map, which clears selection.
                      e.stopPropagation?.();
                      setSelected(marker);
                    }}
                    pinColor={
                      selected?.id === marker.id ? C.oceanDeep : undefined
                    }
                  />
                );
              })}
            </MapView>

            {loadingPlaces && (
              <View style={mapStyles.loadingPill}>
                <GlobalText
                  text={t('TRIP.MAP_LOADING_PLACES')}
                  style={mapStyles.loadingTxt}
                />
              </View>
            )}

            {!loadingPlaces && activeCat && markers.length === 0 && (
              <View style={mapStyles.loadingPill}>
                <GlobalText
                  text={t('TRIP.MAP_NO_PLACES')}
                  style={mapStyles.loadingTxt}
                />
              </View>
            )}

            <PlaceCard
              place={selected}
              navigation={navigation}
              onClose={() => setSelected(null)}
            />

            {/* The way out of the map and into the trip. Without this the
                cart, the plan form and everything after it are only
                reachable from Home. */}
            <View style={[mapStyles.bottomBar, {paddingBottom: insets.bottom + 12}]}>
              {cartCount > 0 ? (
                <TouchableOpacity
                  style={mapStyles.cartBtn}
                  onPress={() => navigateTo(navigation, STRING.SCREEN.TRIP_CART)}
                  activeOpacity={0.9}>
                  <Ionicons name="bag-handle-outline" size={17} color="#FFFFFF" />
                  <GlobalText
                    text={t('TRIP.MAP_VIEW_CART')}
                    style={mapStyles.cartTxt}
                  />
                  <View style={mapStyles.badge}>
                    <GlobalText text={String(cartCount)} style={mapStyles.badgeTxt} />
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={mapStyles.sampleBtn}
                  onPress={() => navigateTo(navigation, STRING.SCREEN.SAMPLE_TRIP)}
                  activeOpacity={0.85}>
                  <Ionicons name="sparkles-outline" size={15} color={C.oceanDeep} />
                  <View style={{flex: 1}}>
                    <GlobalText
                      text={t('TRIP.MAP_NEW_HERE')}
                      style={mapStyles.sampleTxt}
                    />
                    <GlobalText
                      text={t('TRIP.MAP_NO_SIGNIN')}
                      style={mapStyles.sampleSub}
                    />
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={C.oceanDeep} />
                </TouchableOpacity>
              )}
            </View>
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
  oceanMid: '#1B6B7B',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
};

const mapStyles = StyleSheet.create({
  chipsWrap: {backgroundColor: C.cream, paddingBottom: 6},
  chips: {paddingHorizontal: 14, gap: 8, paddingVertical: 4},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#FFFFFF',
  },
  chipOn: {borderColor: C.oceanDeep, backgroundColor: C.oceanDeep},
  chipTxt: {fontSize: 12.5, fontWeight: '600', color: C.textMid},
  chipTxtOn: {color: '#FFFFFF'},

  loadingPill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  loadingTxt: {fontSize: 12, color: C.textMid, fontWeight: '600'},

  card: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    paddingRight: 38,
    elevation: 6,
    shadowColor: '#0D3D4A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  cardClose: {position: 'absolute', top: 10, right: 10, padding: 4},
  cardName: {fontSize: 16, fontWeight: '700', color: C.textDark},
  cardCats: {fontSize: 12.5, color: C.textLight, marginTop: 3},
  cardBtn: {
    marginTop: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.oceanMid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  cardBtnWait: {opacity: 0.7},
  cardBtnOn: {
    backgroundColor: 'rgba(27,107,123,0.12)',
    borderWidth: 1.5,
    borderColor: C.oceanMid,
  },
  cardBtnTxt: {fontSize: 14, fontWeight: '700', color: '#FFFFFF'},
  cardBtnTxtOn: {color: C.oceanDeep},

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  cartBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: C.oceanDeep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  cartTxt: {fontSize: 15, fontWeight: '700', color: '#FFFFFF'},
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTxt: {fontSize: 12.5, fontWeight: '700', color: '#FFFFFF'},
  sampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(13,61,74,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  sampleTxt: {fontSize: 13.5, fontWeight: '700', color: C.oceanDeep},
  sampleSub: {fontSize: 11.5, color: C.textLight, marginTop: 1},

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
