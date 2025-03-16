import React, {useEffect, useState} from 'react';
import {Animated} from 'react-native';
import AnimatedLoader from 'react-native-animated-loader';
import styles from './Styles';
import COLOR from '../../Services/Constants/COLORS';
import GlobalText from './Text';
import {useTranslation} from 'react-i18next';

const MyAnimatedLoader = ({isVisible}) => {
  const {t} = useTranslation();

  const [fadeAnim, setFadeAnim] = useState(new Animated.Value(1));
  const [isAnimated, setIsAnimated] = useState(isVisible);

  useEffect(() => {
    if (isAnimated) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimated(false);
      });
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  return (
    <Animated.View style={{opacity: fadeAnim}}>
      <AnimatedLoader
        visible={isVisible}
        overlayColor={COLOR.themeComicBlueLight}
        source={require('./Animations/bus.json')}
        animationStyle={styles.lottie}
        speed={2}>
        <GlobalText text={t('LOADER_TEXT')} style={styles.loaderText} />
      </AnimatedLoader>
    </Animated.View>
  );
};

export default MyAnimatedLoader;
