import React from 'react';
import {View, StyleSheet} from 'react-native';

// Matches the new TopComponent design:
// [circle] [wide pill]   flex:1   [circle] [circle]
const TopComponentSkeleton = () => (
  <View style={s.row}>
    {/* Menu button */}
    <View style={s.circle} />
    {/* Location pill */}
    <View style={s.locationPill} />
    <View style={{flex: 1}} />
    {/* Bell button */}
    <View style={s.circle} />
    {/* Profile button */}
    <View style={s.circle} />
  </View>
);

const SHIMMER = 'rgba(255,255,255,0.14)';
const SHIMMER_BRIGHT = 'rgba(255,255,255,0.2)';
const BTN = 44;

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  circle: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: SHIMMER_BRIGHT,
  },
  locationPill: {
    width: 140,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: SHIMMER,
  },
});

export default TopComponentSkeleton;
