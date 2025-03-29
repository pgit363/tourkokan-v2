import React, { useEffect, useState } from 'react';
import {
  FlatList,
  View,
  SafeAreaView,
  ScrollView,
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

const RoutesList = ({ navigation, route }) => {
  const { t } = useTranslation();

  const [list, setList] = useState(route.params.item.route_stops);
  const [isShow, setIsShow] = useState(true);

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    return () => {
      backHandler.remove();
    };
  }, []);

  const closePopup = () => {
    setIsShow(false);
  };

  const renderItem = ({ item, index }) => {
    let isFirst = index === 0;
    let isLast = index === list.length - 1;

    return (
      <ListItem bottomDivider style={{ paddingTop: isFirst ? 20 : 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Distance Block with Fixed Width */}
          <View style={{ width: 70, alignItems: 'flex-start' }}>
            <GlobalText text={`${item.distance ? item.distance : 0} Km`} />
          </View>

          {/* Line Component */}
          {isFirst ? (
            <RouteLineFirst />
          ) : isLast ? (
            <RouteLineLast />
          ) : (
            <RouteLine />
          )}
        </View>

        <ListItem.Content>
          <ListItem.Title>
            <View
              style={isFirst || isLast ? styles.listItem : styles.listItemMid}>
              <View>
                <GlobalText
                  text={item.site.name}
                  style={{
                    color: isFirst || isLast ? COLOR.themeBlue : COLOR.black,
                  }}
                />
              </View>
            </View>
          </ListItem.Title>
        </ListItem.Content>
      </ListItem>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        data={list}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
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
                  onPress={() => {
                    navigateTo(navigation, t('SCREEN.QUERIES_LIST'), {
                      step: 1,
                      route_id: route.params?.item?.id,
                    });
                  }}>
                  <GlobalText text={t('BUTTON.CONTACT')} />
                </TouchableOpacity>
              }
            />
            <View style={{ marginVertical: -15 }}>
              <RouteHeadCard
                data={route.params.item}
                cardClick={() => console.log('')}
              />
            </View>
          </>
        }
        contentContainerStyle={styles.flatListContainer}
      />

      <Overlay style={styles.locationModal} isVisible={isShow}>
        <GlobalText
          text={t('ALERT.PLEASE_CONTACT')}
          style={styles.locationModal}
        />
        <TextButton
          title={t('BUTTON.OK')}
          buttonView={styles.logoutButtonStyle}
          titleStyle={styles.locButtonTitle}
          raised={false}
          onPress={() => closePopup()}
        />
      </Overlay>
    </SafeAreaView>
  );
};

export default RoutesList;
