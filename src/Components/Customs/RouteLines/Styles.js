import COLOR from '../../../Services/Constants/COLORS';
import DIMENSIONS from '../../../Services/Constants/DIMENSIONS';

const {StyleSheet} = require('react-native');

const styles = StyleSheet.create({
  routeLineVert: {
    borderColor: COLOR.black,
    borderWidth: 1,
    position: 'absolute',
    height: 80,
    top: -28,
    left: 5,
  },
  routeLineFirst: {
    borderColor: COLOR.black,
    borderWidth: 1,
    position: 'absolute',
    height: 30,
    top: 24,
    left: 5,
  },
  routeLineLast: {
    borderColor: COLOR.black,
    borderWidth: 1,
    position: 'absolute',
    height: 24,
    top: -22,
    left: 5,
  },
  routeDot: {
    borderColor: COLOR.black,
    borderWidth: 6,
    borderRadius: DIMENSIONS.borderRadius,
  },
  icon: {
    left: -6,
  },
});

export default styles;
