import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';

const {StyleSheet} = require('react-native');

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
  },
  placeImageTitleView: {
    height: DIMENSIONS.detailsImage,
    width: DIMENSIONS.detailsImage,
    borderRadius: DIMENSIONS.borderRadiusLarge,
  },
  cityImageView: {
    alignItems: 'center',
    justifyContent: 'center',
    height: DIMENSIONS.detailsImage,
  },
  cityHeader: {
    position: 'absolute',
    backgroundColor: COLOR.transparent,
    zIndex: 1,
  },
  placeImage: {
    height: (DIMENSIONS.screenHeight / 100) * 40,
    width: DIMENSIONS.screenWidth,
    position: 'absolute',
  },
  placeImageView: {
    height: (DIMENSIONS.screenHeight / 100) * 40,
    marginTop: -16,
  },
  cityLikeView: {
    backgroundColor: COLOR.grey,
    height: 35,
    width: 35,
    borderRadius: DIMENSIONS.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avgRating: {
    borderRadius: DIMENSIONS.borderRadiusLarge,
    marginHorizontal: 5,
    color: COLOR.greyDark,
    fontWeight: 'bold',
  },
  cityStarView: {
    backgroundColor: COLOR.white,
    borderRadius: DIMENSIONS.borderRadius,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
  },
  backIcon: {
    backgroundColor: COLOR.white,
    width: DIMENSIONS.iconLarge,
    borderRadius: DIMENSIONS.borderRadius,
  },
  detailTitle: {
    fontSize: DIMENSIONS.headerTextSize,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  detailSubTitle: {
    fontSize: DIMENSIONS.textSizeSmall,
    fontWeight: 'bold',
    textAlign: 'left',
    color: COLOR.greyDark,
  },
  sectionView: {
    marginVertical: DIMENSIONS.sectionGap,
    alignItems: 'center',
  },
  starStyle: {
    width: 10,
    color: COLOR.yellow,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  locationPinText: {
    fontWeight: 'bold',
    textAlign: 'left',
    color: COLOR.grey,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsTitleView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.sectionGap,
  },
  cityDescription: {
    marginBottom: DIMENSIONS.sectionGap,
  },
  buttonSkeleton: {
    width: DIMENSIONS.bannerWidth / 3,
    height: 40,
    borderRadius: DIMENSIONS.borderRadiusXS,
    alignSelf: 'flex-end',
    marginRight: 5,
    marginTop: 15,
  },
  buttonView: {
    width: DIMENSIONS.screenWidth / 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  readMoreStyle: {
    width: DIMENSIONS.screenWidth / 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
    backgroundColor: COLOR.white,
    alignSelf: 'flex-start',
    elevation: 0,
  },
  titleStyle: {
    color: COLOR.themeBlue,
    fontWeight: '400',
    fontSize: DIMENSIONS.textSize,
  },
  viewMapButtonStyle: {
    backgroundColor: COLOR.themeBlue,
    width: 'auto',
  },
  viewMapTitle: {
    color: COLOR.white,
    fontWeight: '200',
    fontSize: DIMENSIONS.textSize,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: DIMENSIONS.headerTextSize,
    color: COLOR.cancelButton,
    marginBottom: 20,
  },
  placesCard: {
    width: DIMENSIONS.halfWidth - 30,
    backgroundColor: COLOR.white,
    borderRadius: DIMENSIONS.borderRadiusSmall,
    height: DIMENSIONS.headerHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 5,
    alignSelf: 'stretch',
    marginHorizontal: 10,
  },
  flexAroundSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: DIMENSIONS.bannerWidth,
    marginVertical: 20,
  },
  flexAround: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: DIMENSIONS.bannerWidth,
    marginVertical: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: DIMENSIONS.headerTextSize,
    color: COLOR.black,
  },
  villagesButtonView: {
    alignItems: 'center',
    flexDirection: 'row',
    margin: 10,
    width: DIMENSIONS.bannerWidth / 2,
    backgroundColor: COLOR.transparent,
    elevation: 0,
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  villagesTitleStyle: {
    color: COLOR.themeBlue,
    textAlign: 'right',
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: DIMENSIONS.subtitleTextSize,
  },
  searchButtonStyle: {
    width: DIMENSIONS.bannerWidth / 3,
    backgroundColor: COLOR.themeBlue,
    borderRadius: DIMENSIONS.borderRadiusXS,
    alignSelf: 'flex-end',
    alignContent: 'center',
    top: -20,
    right: 10,
  },
});

export default styles;
