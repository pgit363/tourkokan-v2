import {StyleSheet} from 'react-native';
import COLOR from '../../../Services/Constants/COLORS.js';
import DIMENSIONS from '../../../Services/Constants/DIMENSIONS.js';

const styles = StyleSheet.create({
  chipIcon: {
    height: 30,
    width: 30,
    backgroundColor: COLOR.black,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DIMENSIONS.borderRadius,
    marginHorizontal: 10,
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
  dropdownIcon: {
    width: 30,
    height: 30,
  },
  langButtonStyle: {
    width: DIMENSIONS.bannerWidth / 3,
    backgroundColor: COLOR.themeBlue,
    borderRadius: DIMENSIONS.borderRadiusXS,
    alignSelf: 'flex-end',
    marginTop: 10,
    marginRight: 20,
  },
  profileButtonStyle: {
    width: DIMENSIONS.bannerWidth / 3,
    backgroundColor: COLOR.themeBlue,
    borderRadius: DIMENSIONS.borderRadiusXS,
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  buttonTitleStyle: {
    color: COLOR.white,
    fontWeight: 'bold',
  },
  containerStyle: {
    borderWidth: 1,
    paddingLeft: 45,
    borderRadius: DIMENSIONS.borderRadiusXS,
    borderColor: COLOR.themeBlue,
  },
  profileContainerStyle: {
    borderColor: COLOR.transparent,
    marginBottom: 20,
  },
  leftIcon: {
    position: 'absolute',
    left: 5,
    top: '70%',
    transform: [{translateY: -12}],
  },
});

export default styles;
