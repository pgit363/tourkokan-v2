import {Dimensions} from 'react-native';

const sh = Dimensions.get('screen').height;
const wh = Dimensions.get('window').height;
const sw = Dimensions.get('screen').width;
const ww = Dimensions.get('window').width;

const DIMENSIONS = {
  screenHeight: sh,
  windowHeight: wh,
  screenWidth: sw,
  windowWidth: ww,

  halfWidth: sw / 2,
  halfHeight: sh / 2,

  bannerWidth: sw - 40,
  bannerHeight: (sw - 40) / 2,

  smallIcon: 15,
  iconSize: 20,
  iconMedium: 21,
  iconBig: 25,
  userIconSize: 30,
  iconLarge: 35,
  iconL: 40,
  iconX: 45,
  iconXL: 60,
  iconXXL: 70,
  iconXXXL: 90,
  iconCard: 111,
  iconCardBig: 150,
  appLogo: 70,

  borderRadiusXL: 80,
  borderRadiusLarge: 50,
  borderRadius: 30,
  borderRadiusSmall: 20,
  borderRadiusXS: 10,
  borderRadiusXXS: 5,

  headerHeight: (sh / 100) * 6,
  headerSpace: (sh / 100) * 6 * 2.5,

  xxxlText: sw / 12,
  xxlText: sw / 14,
  xlText: sw / 19,
  largeText: sw / 22,
  headerTextSize: sw / 24,
  subtitleTextSize: sw / 27,
  textSize: sw / 29,
  textSizeSmall: sw / 34,
  textSizeXS: sw / 39,
  buttonText: 17,

  sectionGap: 20,

  smallImage: 40,
  detailsImage: 150,

  mobileLength: 10,
  fieldLength: 50,
  queryLength: 500,
};

export default DIMENSIONS;
