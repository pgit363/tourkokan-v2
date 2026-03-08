/**
 * SkeletonBox — pulsing placeholder for loading states.
 * All instances share one Animated value so they pulse in perfect sync.
 */
import React, {useEffect} from 'react';
import {Animated} from 'react-native';

const pulse = new Animated.Value(0.4);
let running = false;

const startPulse = () => {
  if (running) return;
  running = true;
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulse, {toValue: 0.85, duration: 750, useNativeDriver: true}),
      Animated.timing(pulse, {toValue: 0.4, duration: 750, useNativeDriver: true}),
    ]),
  ).start();
};

const SkeletonBox = ({width, height, borderRadius = 6, style}) => {
  useEffect(() => {
    startPulse();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#C8D1D6',
          opacity: pulse,
        },
        style,
      ]}
    />
  );
};

export default SkeletonBox;
