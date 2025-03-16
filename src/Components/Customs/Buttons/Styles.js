import {StyleSheet} from 'react-native';
import COLOR from '../../../Services/Constants/COLORS';
import DIMENSIONS from '../../../Services/Constants/DIMENSIONS';

const styles = StyleSheet.create({
  buttonView: {
    overflow: 'hidden',
    borderRadius: DIMENSIONS.borderRadiusXS,
    backgroundColor: COLOR.themeBlue,
    paddingVertical: 10,
    width: DIMENSIONS.bannerWidth,
    alignSelf: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  containerStyle: {
    width: DIMENSIONS.bannerWidth,
    borderRadius: DIMENSIONS.borderRadiusXS,
    overflow: 'hidden',
  },
  buttonStyle: {
    width: DIMENSIONS.bannerWidth,
    backgroundColor: COLOR.themeBlue,
  },
  titleStyle: {
    color: COLOR.white,
    fontWeight: 'bold',
    fontSize: DIMENSIONS.buttonText,
  },
  imageButtonSkeleton: {
    height: DIMENSIONS.iconXXL,
    width: DIMENSIONS.iconXXL,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    margin: DIMENSIONS.sectionGap / 2,
  },
  imageButtonContainer: {
    width: 'auto',
    margin: DIMENSIONS.sectionGap / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonCircle: {
    height: DIMENSIONS.iconXXL,
    width: DIMENSIONS.iconXXL,
    borderWidth: 4,
    borderColor: COLOR.grey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    borderColor: COLOR.themeBlue,
    shadowColor: COLOR.themeBlue,
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 10,
  },
  selectedText: {
    fontWeight: 'bold',
  },
  catCardIcon: {
    height: DIMENSIONS.iconXXL - 4,
    width: DIMENSIONS.iconXXL - 4,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    resizeMode: 'cover',
  },
});

export default styles;
