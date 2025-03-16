import {StyleSheet} from 'react-native';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import COLOR from '../../Services/Constants/COLORS';

const styles = StyleSheet.create({
  appLogo: {
    height: 70,
    marginTop: 30,
  },
  loginButton: {
    overflow: 'hidden',
    marginTop: 30,
  },
  signUpButton: {
    overflow: 'hidden',
    marginTop: 15,
    backgroundColor: COLOR.white,
  },
  choiceButtonContainer: {
    width: DIMENSIONS.screenWidth / 2,
    borderRadius: DIMENSIONS.borderRadius,
  },
  choiceButtonStyle: {
    width: DIMENSIONS.screenWidth / 2,
    borderRadius: DIMENSIONS.borderRadius,
  },
  buttonTitle: {
    color: COLOR.themeBlue,
  },
  buttonView: {
    marginTop: 15,
  },
  middleFlex: {
    justifyContent: 'center',
    flex: 5,
    alignItems: 'center',
  },
  googleView: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  googleButton: {
    width: DIMENSIONS.bannerWidth,
    marginVertical: DIMENSIONS.sectionGap,
    height: 70,
  },
  haveAcc: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  blueBold: {
    fontWeight: 'bold',
    color: COLOR.themeBlue,
  },
  containerStyle: {
    borderWidth: 1,
    padding: 10,
    borderRadius: DIMENSIONS.borderRadiusXS,
    borderColor: COLOR.themeBlue,
  },
  signUpContainerStyle: {
    borderWidth: 1,
    paddingLeft: 40,
    borderRadius: DIMENSIONS.borderRadiusXS,
    borderColor: COLOR.themeBlue,
  },
  otpContainerStyle: {
    borderWidth: 1,
    padding: 10,
    borderColor: COLOR.white,
    borderRadius: DIMENSIONS.borderRadius,
    color: COLOR.black,
  },
  eyeIcon: {
    position: 'absolute',
    left: -40,
  },
  leftIcon: {
    position: 'absolute',
    left: '50%',
    top: '70%',
    transform: [{translateY: -12}],
  },
  roleDropDown: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderColor: COLOR.black,
    borderRadius: DIMENSIONS.borderRadius,
  },
  selectedTextStyle: {
    color: COLOR.black,
  },
  itemTextStyle: {
    color: COLOR.black,
  },
  dropdownText: {
    color: COLOR.black,
    fontSize: DIMENSIONS.textSize,
    textAlign: 'center',
  },
  imageContainerStyle: {
    borderWidth: 1,
    borderColor: COLOR.grey,
    borderRadius: DIMENSIONS.borderRadius,
    width: DIMENSIONS.iconCardBig,
    height: DIMENSIONS.iconCard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  errorImageContainerStyle: {
    borderWidth: 1,
    borderColor: COLOR.red,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    width: DIMENSIONS.iconXXXL,
    height: DIMENSIONS.iconXXXL,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: COLOR.redOpacity,
  },
  imageSourceView: {
    width: DIMENSIONS.iconXXL,
    height: DIMENSIONS.iconXXL,
    borderRadius: DIMENSIONS.borderRadiusLarge,
  },
  inputContainerStyle: {
    borderColor: COLOR.transparent,
    marginBottom: 20,
  },
  loginHeader: {},
  loginImage: {
    height: DIMENSIONS.screenHeight - DIMENSIONS.headerHeight,
    width: DIMENSIONS.screenWidth,
    position: 'absolute',
  },
  loginLogoView: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginLogo: {
    height: DIMENSIONS.iconCardBig,
    width: DIMENSIONS.iconCardBig,
  },
  changeOption: {
    fontWeight: 'bold',
    fontSize: DIMENSIONS.headerTextSize,
    padding: 10,
    paddingBottom: 10,
    color: COLOR.themeBlue,
    backgroundColor: COLOR.white,
    borderRadius: DIMENSIONS.borderRadius,
    marginTop: 10,
  },
  loginText: {
    fontWeight: 'bold',
    fontSize: DIMENSIONS.largeText,
    textAlign: 'left',
    width: DIMENSIONS.bannerWidth,
    marginLeft: 10,
  },
  loginSubText: {
    fontWeight: 'bold',
    fontSize: DIMENSIONS.subtitleTextSize,
    color: COLOR.themeBlue,
    textAlign: 'left',
    width: DIMENSIONS.bannerWidth,
    marginVertical: 10,
  },
  authScreenView: {
    justifyContent: 'space-between',
    height: DIMENSIONS.screenHeight - 150,
  },
  loginAppName: {
    marginTop: DIMENSIONS.headerHeight,
  },
  loginName: {
    textAlign: 'left',
    marginLeft: 20,
    fontSize: DIMENSIONS.xxxlText,
    fontWeight: 'bold',
    color: COLOR.white,
    fontStyle: 'italic',
  },
  textLeft: {
    textAlign: 'left',
    marginLeft: 25,
    fontSize: DIMENSIONS.headerTextSize,
    fontWeight: '300',
    width: DIMENSIONS.bannerWidth,
  },
  boldKokan: {
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: DIMENSIONS.xxxlText,
    marginLeft: 25,
  },
  exploreText: {
    textAlign: 'left',
    fontSize: DIMENSIONS.xxlText,
    fontWeight: '300',
    marginLeft: 25,
  },
  appName: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.white,
    width: DIMENSIONS.appLogo + 40,
    height: DIMENSIONS.appLogo + 40,
    borderRadius: DIMENSIONS.borderRadiusXL,
    marginTop: 50,
    resizeMode: 'contain',
    shadowColor: COLOR.black,
    shadowOffset: {
      width: 10,
      height: 10,
    },
    elevation: 10,
  },
  appLogo: {
    height: DIMENSIONS.appLogo,
    width: DIMENSIONS.appLogo,
  },
  appNameText: {
    fontSize: DIMENSIONS.xlText,
    fontWeight: 'bold',
  },
  whiteText: {
    color: COLOR.white,
  },
  selectText: {
    color: COLOR.white,
    fontWeight: 'bold',
    top: 10,
  },
  choiceText: {
    marginVertical: 20,
    color: COLOR.themeBlue,
    fontWeight: '600',
  },
  sendOTPText: {
    fontWeight: '600',
  },
  addProfileView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    textAlign: 'left',
    fontWeight: '350',
    fontSize: DIMENSIONS.xxlText,
    marginLeft: 25,
    marginTop: 50,
  },
  dropdown: {
    width: DIMENSIONS.bannerWidth,
    height: 46,
    borderWidth: 1,
    borderColor: COLOR.themeBlue,
    borderRadius: DIMENSIONS.borderRadiusXS,
    marginTop: 15,
    paddingLeft: 10,
  },
  dropdownIcon: {
    width: 30,
    height: 30,
  },
  langButtonStyle: {
    width: DIMENSIONS.bannerWidth / 3,
    backgroundColor: COLOR.themeBlue,
    borderRadius: DIMENSIONS.borderRadiusXS,
    marginTop: 20,
  },
  buttonTitleStyle: {
    color: COLOR.white,
    fontWeight: 'bold',
  },
  root: {flex: 1, padding: 20},
  title: {textAlign: 'center', fontSize: 30},
  codeFieldRoot: {marginTop: 20},
  cell: {
    height: 50,
    width: 40,
    margin: 10,
    backgroundColor: COLOR.white,
    borderWidth: 1,
    borderColor: COLOR.themeBlue,
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 45,
    color: COLOR.themeBlue,
    borderRadius: DIMENSIONS.borderRadiusXS,
  },
  focusCell: {
    borderColor: COLOR.themeBlue,
  },
  middleFlexImage: {
    justifyContent: 'center',
    padding: 10,
    flex: 5,
    alignItems: 'center',
  },
  lottie: {
    width: 300,
    height: 300,
  },
});

export default styles;
