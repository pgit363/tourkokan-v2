import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';

const OFFSETS = [
  {x: -2, y: -2}, {x: 2, y: -2}, {x: -2, y: 2}, {x: 2, y: 2},
  {x: 0, y: -2}, {x: 0, y: 2}, {x: -2, y: 0}, {x: 2, y: 0},
];

const AnimatedTagline = ({text, style}) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shimmer, {toValue: 1, duration: 2000, useNativeDriver: false}),
          Animated.timing(shimmer, {toValue: 0, duration: 2000, useNativeDriver: false}),
        ]),
        Animated.sequence([
          Animated.timing(glow, {toValue: 1, duration: 2000, useNativeDriver: false}),
          Animated.timing(glow, {toValue: 0, duration: 2000, useNativeDriver: false}),
        ]),
      ]),
    ).start();
  }, []);

  const textColor = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#ff7e5f', '#feb47b', '#ff7e5f'],
  });

  const shadowRadius = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 14],
  });

  const shadowColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,126,95,0.5)', 'rgba(254,180,123,0.9)'],
  });

  return (
    <View style={s.container}>
      {/* White outline layers — rendered behind the colored text */}
      {OFFSETS.map((offset, i) => (
        <Animated.Text
          key={i}
          style={[s.tagline, style, s.outline, {
            left: offset.x,
            top: offset.y,
          }]}>
          {text}
        </Animated.Text>
      ))}
      {/* Colored animated text on top */}
      <Animated.Text
        style={[s.tagline, style, {
          color: textColor,
          textShadowRadius: shadowRadius,
          textShadowColor: shadowColor,
          textShadowOffset: {width: 0, height: 0},
        }]}>
        {text}
      </Animated.Text>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontFamily: 'Pacifico-Regular',
    fontSize: 28,
    textAlign: 'center',
  },
  outline: {
    position: 'absolute',
    color: '#FFFFFF',
  },
});

export default AnimatedTagline;
