/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { ListItem, Overlay } from '@rneui/themed';
import Header from '../../Components/Common/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import RouteLine from '../../Components/Customs/RouteLines/RouteLine';
import {
  backPage,
  checkLogin,
  goBackHandler,
  navigateTo,
} from '../../Services/CommonMethods';
import RouteLineFirst from '../../Components/Customs/RouteLines/RouteLineFirst';
import RouteLineLast from '../../Components/Customs/RouteLines/RouteLineLast';
import GlobalText from '../../Components/Customs/Text';
import RouteHeadCard from '../../Components/Cards/RouteHeadCard';
import styles from './Styles';
import { useTranslation } from 'react-i18next';
import TextButton from '../../Components/Customs/Buttons/TextButton';
import Banner from '../../Components/Customs/Banner';
import { getFromStorage } from '../../Services/Api/CommonServices';
import {SafeAreaView} from 'react-native-safe-area-context';

const RoutesList = ({ navigation, route }) => {
  const { t } = useTranslation();

  const stops = route?.params?.item?.route_stops ?? []; // Safe fallback
  const [list] = useState(stops);
  const [isShow, setIsShow] = useState(true);
  const [bannerObject, setBannerObject] = useState({});

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);

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

    return () => backHandler.remove();
  }, []);

  const closePopup = () => setIsShow(false);

  const renderItem = ({ item, index }) => {
    const isFirst = index === 0;
    const isLast = index === list.length - 1;
    const stopNameStyle = isFirst || isLast
      ? localStyles.stopNameHighlight
      : localStyles.stopName;

    return (
      <ListItem
        key={`route-stop-${item?.id || item?.site?.id || index}`}
        bottomDivider
        style={isFirst ? localStyles.listItemFirst : localStyles.listItem}>
        <View style={localStyles.row}>
          <View style={localStyles.rowStart}>
            {/* Distance */}
            <View style={localStyles.distanceWrap}>
              <GlobalText text={`${item?.distance ?? 0} Km`} />
            </View>

            {/* Route Line */}
            {isFirst ? (
              <RouteLineFirst />
            ) : isLast ? (
              <RouteLineLast />
            ) : (
              <RouteLine />
            )}
          </View>

          <ListItem.Content style={localStyles.listItemContent}>
            <View style={localStyles.stopNameWrap}>
              <GlobalText
                text={item?.site?.name ?? ''}
                style={stopNameStyle}
              />
            </View>
          </ListItem.Content>

          {/* Arrival Time */}
          <View style={localStyles.distanceWrap}>
            <GlobalText text={`${item?.arr_time ?? ''}`} />
          </View>
        </View>
      </ListItem>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={localStyles.safeArea}>
      <View
        style={
          bannerObject?.ROUTE_DETAIL_FOOTER &&
          bannerObject.ROUTE_DETAIL_FOOTER.length > 0
            ? localStyles.contentWithFooter
            : localStyles.content
        }>
      <FlatList
        contentContainerStyle={localStyles.listContent}
        data={list}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item?.id?.toString() || index.toString()
        }
        ListHeaderComponent={
          <View>
            <Header
              name={t('HEADER.ROUTE')}
              goBack={() => backPage(navigation)}
              startIcon={
                <Ionicons
                  name="chevron-back-outline"
                  color={COLOR.black}
                  size={DIMENSIONS.userIconSize}
                  onPress={() => backPage(navigation)}
                />
              }
              endIcon={
                <TouchableOpacity
                  onPress={() =>
                    navigateTo(navigation, t('SCREEN.QUERIES_LIST'), {
                      step: 1,
                      route_id: route?.params?.item?.id,
                    })
                  }
                >
                  <GlobalText text={t('BUTTON.CONTACT')} />
                </TouchableOpacity>
              }
            />

            <View style={localStyles.routeHeadWrap}>
              <RouteHeadCard
                data={route?.params?.item}
                cardClick={() => {}}
              />
            </View>
            {/* {bannerObject?.ROUTE_DETAIL_MIDDLE &&
              bannerObject.ROUTE_DETAIL_MIDDLE.length > 0 && (
                <View style={{marginTop: 10, marginBottom: 10, width: '100%'}}>
                  <Banner
                    bannerImages={bannerObject.ROUTE_DETAIL_MIDDLE}
                    style={{height: 150}}
                  />
                </View>
              )} */}
          </View>
        }
      />
      </View>
      {bannerObject?.ROUTE_DETAIL_FOOTER &&
        bannerObject.ROUTE_DETAIL_FOOTER.length > 0 && (
          <View style={localStyles.footerWrap}>
            <Banner
              bannerImages={bannerObject.ROUTE_DETAIL_FOOTER}
              style={localStyles.footerBanner}
            />
          </View>
        )}

      <Overlay style={styles.locationModal} isVisible={isShow}>
        <GlobalText
          text={t('ALERT.PLEASE_CONTACT')}
          style={styles.locationModal}
        />
        <TextButton
          title={t('BUTTON.OK')}
          buttonView={styles.logoutButtonStyle}
          titleStyle={styles.locButtonTitle}
          onPress={closePopup}
        />
      </Overlay>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLOR.white,
  },
  content: {
    flex: 1,
  },
  contentWithFooter: {
    flex: 1,
    marginBottom: DIMENSIONS.windowWidth / 3,
  },
  listContent: {
    paddingBottom: 20,
  },
  listItem: {
    paddingTop: 0,
  },
  listItemFirst: {
    paddingTop: 20,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceWrap: {
    width: 70,
    alignItems: 'flex-start',
  },
  listItemContent: {
    flex: 1,
  },
  stopNameWrap: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 25,
  },
  stopName: {
    color: COLOR.black,
    textAlign: 'left',
  },
  stopNameHighlight: {
    color: COLOR.themeBlue,
    textAlign: 'left',
  },
  routeHeadWrap: {
    marginVertical: -15,
  },
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  footerBanner: {
    height: DIMENSIONS.windowWidth / 3,
    marginBottom: 0,
  },
});

export default RoutesList;
