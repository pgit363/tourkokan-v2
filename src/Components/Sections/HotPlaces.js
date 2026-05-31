import React from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {TrendingCard} from './PopularSpots';

const C = {
  amberDeep: '#92400E',
  amberMid: '#D97706',
  white: '#FFFFFF',
};

/**
 * HotPlaces — reusable section component.
 *
 * Props:
 *   hot_sites   {Array}    — array of site objects
 *   onCardPress {Function} — called with the item when a card is tapped
 *   title       {string}   — optional section heading (default "Hot Places")
 */
const HotPlaces = ({hot_sites = [], onCardPress, title = 'Hot Places'}) => {
  if (!hot_sites?.length) return null;

  return (
    <View style={s.section}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.titleRow}>
          <View style={s.accentBar} />
          <Ionicons name="flame-outline" size={20} color={C.amberMid} />
          <Text style={s.sectionTitle}>{title}</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{hot_sites.length} places</Text>
        </View>
      </View>

      {/* Cards */}
      <FlatList
        horizontal
        data={hot_sites}
        keyExtractor={(item, i) => `hot_${item.id}_${i}`}
        renderItem={({item}) => (
          <TrendingCard item={item} onPress={() => onCardPress?.(item)} />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{width: 14}} />}
      />
    </View>
  );
};

const s = StyleSheet.create({
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(217,119,6,0.05)',
    paddingTop: 18,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(217,119,6,0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  accentBar: {width: 4, height: 22, borderRadius: 2, backgroundColor: C.amberMid},
  sectionTitle: {fontSize: 18, fontWeight: '800', color: C.amberDeep},
  badge: {
    backgroundColor: 'rgba(217,119,6,0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {fontSize: 11, fontWeight: '700', color: C.amberMid},
  list: {paddingHorizontal: 20, paddingBottom: 8},
});

export default HotPlaces;
