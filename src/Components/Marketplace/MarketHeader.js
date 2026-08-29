/**
 * MarketHeader — the app's standard gradient list header (matches EventsList /
 * RoutesList): oceanDeep→forest gradient, circular back button, title + subtitle.
 */
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {C} from './theme';
import {backPage} from '../../Services/CommonMethods';

const MarketHeader = ({navigation, title, subtitle, right, children}) => {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[C.oceanDeep, '#1A3320']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[s.header, {paddingTop: insets.top + 10}]}>
      <View style={s.row}>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => backPage(navigation)}
          activeOpacity={0.8}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={s.text}>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={s.sub} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {right || <View style={{width: 36}} />}
      </View>
      {children}
    </LinearGradient>
  );
};

const s = StyleSheet.create({
  header: {paddingHorizontal: 16, paddingBottom: 15},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10},
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {flex: 1},
  title: {fontSize: 20, fontWeight: '700', color: C.white, letterSpacing: 0.2},
  sub: {fontSize: 11.5, color: 'rgba(255,255,255,0.82)', marginTop: 2},
});

export default MarketHeader;
