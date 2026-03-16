import React from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {useTranslation} from 'react-i18next';

const {width: SW} = Dimensions.get('window');

const C = {
  oceanDeep: '#0D3D4A', oceanMid: '#1B6B7B',
  cream: '#FAF7F0', white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.9)', glassBorder: 'rgba(0,0,0,0.05)',
  textDark: '#1C1917', textLight: '#78716C',
};
const RADIUS = 18;

const STATIC_NEARBY = [
  {id: 1, name: 'Tarkarli Beach', emoji: '🏖️', category: 'Beach', distance: 12},
  {id: 2, name: 'Sindhudurg Fort', emoji: '🏰', category: 'Fort', distance: 8},
  {id: 3, name: 'Kunkeshwar Temple', emoji: '⛩️', category: 'Temple', distance: 18},
  {id: 4, name: 'Amboli Waterfalls', emoji: '💧', category: 'Waterfall', distance: 35},
];

const NearbyCard = ({item}) => (
  <View style={nb.nearbyCard}>
    <Text style={nb.nearbyEmoji}>{item.emoji}</Text>
    <View style={nb.nearbyCategoryBadge}>
      <Text style={nb.nearbyCategoryText}>{item.category}</Text>
    </View>
    <Text style={nb.nearbyName} numberOfLines={2}>{item.name}</Text>
    <Text style={nb.nearbyDist}>{item.distance} km away</Text>
  </View>
);

const NearbyPlacesSection = ({nearby, hideTitle}) => {
  const {t} = useTranslation();
  const data = (nearby && nearby.length > 0) ? nearby : STATIC_NEARBY;

  return (
    <View style={nb.section}>
      {!hideTitle && <Text style={nb.sectionTitle}>{t('HOME.NEARBY')}</Text>}
      <View style={nb.nearbyGrid}>
        {data.map(item => (
          <NearbyCard key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
};

const nb = StyleSheet.create({
  section: {marginBottom: 24},
  sectionTitle: {
    fontSize: 20, fontWeight: '700', color: C.textDark,
    paddingHorizontal: 20, marginBottom: 14,
  },
  nearbyGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: 12,
  },
  nearbyCard: {
    width: (SW - 52) / 2,
    backgroundColor: C.glass,
    borderRadius: RADIUS,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: C.glassBorder,
  },
  nearbyEmoji: {fontSize: 38, lineHeight: 52, marginBottom: 8},
  nearbyCategoryBadge: {
    backgroundColor: C.oceanDeep,
    borderRadius: 50,
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 8,
  },
  nearbyCategoryText: {
    fontSize: 10, fontWeight: '700',
    color: C.white, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  nearbyName: {
    fontSize: 13, fontWeight: '600', color: C.textDark,
    textAlign: 'center', marginBottom: 4,
  },
  nearbyDist: {fontSize: 11, color: C.textLight},
});

export default NearbyPlacesSection;
