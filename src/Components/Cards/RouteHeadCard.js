import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import styles from './Styles';
import GlobalText from '../Customs/Text';
import COLOR from '../../Services/Constants/COLORS';
import {Image} from 'react-native';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import Fontisto from 'react-native-vector-icons/Fontisto';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';

const rowContainerStyle = {flex: 1, flexDirection: 'row'};
const contentContainerStyle = {flex: 3, justifyContent: 'space-evenly'};
const statsRowStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '95%',
};
const emptyStateStyle = {flex: 1, justifyContent: 'center', alignItems: 'center'};
const whiteTextStyle = {color: COLOR.white};

const RouteHeadCard = ({data, cardClick, style, showDetails = true}) => {
  const {t} = useTranslation();
  let imagePath = '../../Assets/Images/Buses/OrdinaryExpress.png';

  return (
    <TouchableOpacity
      style={[styles.routeHeadCard, style]}
      onPress={() => showDetails && cardClick()}
      disabled={!showDetails}>
      {showDetails ? (
        <View style={rowContainerStyle}>
          <View style={styles.routeHeadCardImage}>
            {typeof imagePath === 'string' && imagePath.endsWith('.png') ? (
              <Image source={require(imagePath)} style={styles.busImage} />
            ) : (
              <Image source={{uri: imagePath}} style={styles.busImage} />
            )}
          </View>
          <View style={contentContainerStyle}>
            <GlobalText
              text={`${data.source_place?.name} ${t('TO')} ${
                data.destination_place?.name
              }`}
              style={styles.routeHeadCardTitle}
            />
            <View>
              <View style={statsRowStyle}>
                <View style={styles.flexRow}>
                  <MaterialIcons
                    name="location-pin"
                    color={COLOR.themeBlue}
                    size={DIMENSIONS.smallIcon}
                    style={styles.routeCardIcons}
                  />
                  <GlobalText text={`${data.distance?.toFixed(2)} ${t('KM')}`} />
                </View>
                <View style={[styles.flexRow]}>
                  <MaterialCommunityIcons
                    name="bus-stop"
                    color={COLOR.themeBlue}
                    size={DIMENSIONS.smallIcon}
                    style={styles.routeCardIcons}
                  />
                  <GlobalText text={`${data.route_stops.length} ${t('STOPS')}`} />
                </View>
              </View>
              <View style={statsRowStyle}>
                <View style={styles.flexRow}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    color={COLOR.themeBlue}
                    size={DIMENSIONS.smallIcon}
                    style={styles.routeCardIcons}
                  />
                  <GlobalText text={`${data.start_time}`} />
                </View>
                <View style={styles.flexRow}>
                  <Fontisto
                    name="bus-ticket"
                    color={COLOR.themeBlue}
                    size={DIMENSIONS.smallIcon}
                    style={styles.routeCardIcons}
                  />
                  <GlobalText text={`${t('UN_RESERVED')}`} />
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={emptyStateStyle}>
          <GlobalText text="No Route Available" style={styles.noRouteMessage} />
        </View>
      )}
      {showDetails && (
        <View
          style={[
            styles.routeHeadCardBottom,
            {
              backgroundColor: JSON.parse(data.bus_type.meta_data)[0].color_code,
            },
          ]}>
          <GlobalText text={data.bus_type.type} style={whiteTextStyle} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default RouteHeadCard;
