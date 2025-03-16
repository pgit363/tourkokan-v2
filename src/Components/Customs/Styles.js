import {StyleSheet} from 'react-native';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textField: {
    width: DIMENSIONS.bannerWidth,
    paddingLeft: 20,
    textAlignVertical: 'top',
    color: COLOR.black,
  },
  textFieldContainer: {
    borderWidth: 0,
    padding: 10,
    borderColor: COLOR.themeBlue,
    marginBottom: -50,
    alignItems: 'center',
  },
  inputContainer: {
    width: DIMENSIONS.bannerWidth,
  },
  leftIconContainerStyle: {
    top: -10,
    left: 10,
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    width: DIMENSIONS.screenWidth,
  },
  searchInputContainer: {
    backgroundColor: COLOR.white,
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLOR.black,
    shadowOffset: {
      width: 10,
      height: 10,
    },
    elevation: 10,
  },
  smallCard: {
    width: DIMENSIONS.screenWidth / 2 - 30,
    height: DIMENSIONS.headerHeight,
    backgroundColor: COLOR.white,
    elevation: 10,
    margin: 10,
    borderRadius: DIMENSIONS.borderRadiusXXS,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallCardIcon: {
    marginHorizontal: 10,
  },
  banner: {
    width: DIMENSIONS.screenWidth,
    height: DIMENSIONS.halfWidth - 30,
    // elevation: 10,
    animation: 'fadeinout 4s infinite',
    marginBottom: -25,
  },
  bannerImage: {
    width: DIMENSIONS.screenWidth,
    height: DIMENSIONS.halfWidth - 30,
    animation: 'fadeinout 4s infinite',
    opacity: 1,
    resizeMode: 'center',
  },
  alertContainerStyle: {
    width: DIMENSIONS.bannerWidth - 40,
  },
  alertButtonStyle: {
    width: DIMENSIONS.bannerWidth - 40,
  },
  spinnerTextStyle: {
    color: '#FFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  alertBackdrop: {
    height: DIMENSIONS.screenHeight,
    width: DIMENSIONS.screenWidth,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    backgroundColor: COLOR.blackOpacity,
  },
  alertContainer: {
    zIndex: 100,
    backgroundColor: COLOR.white,
    height: DIMENSIONS.bannerHeight,
    width: DIMENSIONS.bannerWidth,
  },
  alertMsgView: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonView: {
    flex: 1,
  },
  buttonStyle: {
    backgroundColor: COLOR.themeBlue,
  },
  dropdown: {
    width: DIMENSIONS.bannerWidth,
    marginBottom: 10,
    padding: 7,
    borderWidth: 1,
    borderColor: COLOR.grey,
    color: COLOR.white,
  },
  placeholderStyle: {
    color: COLOR.greyDark,
  },
  itemTextStyle: {
    color: COLOR.black,
  },
  text: {
    color: COLOR.black,
    fontSize: DIMENSIONS.textSize,
    textAlign: 'center',
  },
  lottie: {
    width: 200,
    height: 200,
  },
  loaderText: {
    fontWeight: 'bold',
    color: COLOR.busYellow,
    fontSize: DIMENSIONS.xlText,
  },
  masonryContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  gridText: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: COLOR.blackOpacity,
    color: 'white',
  },
  flatListContainer: {
    justifyContent: 'space-between',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.blackOpacity,
  },
  modalImage: {
    height: DIMENSIONS.bannerHeight,
    width: DIMENSIONS.bannerWidth - 40,
    resizeMode: 'cover',
  },
  masonryTextContainer: {
    backgroundColor: COLOR.white,
    width: DIMENSIONS.bannerWidth - 40,
    borderBottomEndRadius: DIMENSIONS.borderRadius,
    borderBottomStartRadius: DIMENSIONS.borderRadius,
    paddingVertical: 10,
  },
  modalText: {
    color: COLOR.black,
  },
  fieldsViewSkeleton: {
    height: DIMENSIONS.bannerHeight,
    width: DIMENSIONS.bannerWidth,
    borderRadius: DIMENSIONS.borderRadius,
    marginTop: 10,
  },
  accordHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: COLOR.white,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginBottom: 5,
  },
  accordHeaderText: {
    fontSize: DIMENSIONS.headerTextSize,
  },
  accordContent: {
    paddingVertical: 50,
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'left',
    width: DIMENSIONS.screenWidth,
    marginLeft: -5,
  },
  columnWrapper: {},
  catCardIcon: {
    height: DIMENSIONS.iconX,
    width: DIMENSIONS.iconX,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    resizeMode: 'cover',
    borderColor: COLOR.grey,
    borderWidth: 0.5,
  },
  titleStyle: {
    textAlign: 'center', // Center the text
    fontSize: 16,
    color: 'black', // Default color
  },
});

export default styles;
