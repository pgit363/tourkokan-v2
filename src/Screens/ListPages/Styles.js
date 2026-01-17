import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';

const {StyleSheet} = require('react-native');

const styles = StyleSheet.create({
  cardsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopsCard: {},
  clickChip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: DIMENSIONS.borderRadiusSmall,
  },
  chipEnabled: {
    backgroundColor: COLOR.blueL,
  },
  chipDisabled: {
    backgroundColor: COLOR.grey,
  },
  chipTitle: {
    color: COLOR.white,
  },
  flexRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  container: {
    flex: 1,
  },
  flatListContainer: {
    margin: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
  },
  item: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: DIMENSIONS.bannerWidth - 100,
  },
  listItemMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: DIMENSIONS.bannerWidth - 85,
  },
  horizontalCityScroll: {
    minHeight: DIMENSIONS.iconXXL,
    marginTop: -10,
    marginBottom: 10,
  },
  citiesButtonScroll: {
    flexDirection: 'row',
  },
  citiesCircleButton: {
    borderRadius: DIMENSIONS.borderRadiusLarge,
  },
  cityButtonText: {
    fontSize: DIMENSIONS.textSizeSmall,
  },
  toggleView: {
    height: DIMENSIONS.bannerHeight - 50,
    marginBottom: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLOR.black,
  },
  exploreHeaderImage: {
    flex: 1,
    opacity: 0.7,
  },
  details: {
    height: DIMENSIONS.bannerHeight - 50,
    width: DIMENSIONS.bannerWidth,
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  lineVert: {
    borderWidth: 1,
    borderColor: COLOR.white,
    marginHorizontal: 20,
  },
  whiteText: {
    color: COLOR.white,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: DIMENSIONS.headerTextSize,
  },
  buttonSkeleton: {
    width: DIMENSIONS.bannerWidth / 2,
    height: 50,
    marginVertical: 10,
    borderRadius: DIMENSIONS.borderRadiusXS,
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  buttonView: {
    alignItems: 'center',
    flexDirection: 'row',
    margin: 10,
    width: DIMENSIONS.bannerWidth / 2,
    backgroundColor: COLOR.transparent,
    elevation: 0,
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  titleStyle: {
    color: COLOR.themeBlue,
    textAlign: 'right',
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 16,
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
  cityListView: {
    borderTopColor: COLOR.grey,
    borderTopWidth: 1,
    width: DIMENSIONS.screenWidth,
    padding: 20,
  },
  SmallChipCard: {
    width: DIMENSIONS.halfWidth - 20,
    height: DIMENSIONS.headerHeight,
    backgroundColor: COLOR.white,
    elevation: 10,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  cityListName: {
    fontWeight: 'bold',
  },
  imageGridBoxContainer: {
    flex: 1,
    margin: 1,
  },
  imageGridBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  imageGridBox: {
    width: '100%',
    height: 135,
    borderRadius: 5,
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '35%',
    backgroundColor: COLOR.white,
    borderRadius: 10,
    padding: 10,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageGridBoxSkeleton: {
    width: DIMENSIONS.screenWidth / 3 - 6,
    height: DIMENSIONS.screenWidth / 3 - 6,
    borderRadius: 5,
    margin: 1,
  },
  locationModal: {
    padding: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: DIMENSIONS.headerTextSize,
  },
  logoutButtonStyle: {
    width: DIMENSIONS.bannerWidth / 2 - 30,
    borderRadius: DIMENSIONS.borderRadiusXS,
    alignSelf: 'center',
    elevation: 10,
    marginLeft: 10,
  },
  imageTitle: {
    backgroundColor: 'red',
    position: 'fixed',
    zIndex: 1000,
    height: 100,
    width: DIMENSIONS.screenWidth,
    marginTop: -500,
    left: 0,
  },
});

export default styles;
