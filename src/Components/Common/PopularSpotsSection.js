import React, {useState, useMemo} from 'react';
import {
  View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import PackageCard from '../Cards/PackageCard';

const {width: SW} = Dimensions.get('window');

const C = {
  oceanMid: '#1B6B7B', oceanDeep: '#0D3D4A', oceanFoam: '#B8E4EA',
  cream: '#FAF7F0', white: '#FFFFFF', textDark: '#1C1917',
  textMid: '#44403C', textLight: '#78716C',
};
const RADIUS = 18;

const STATIC_SPOTS = [
  {id: 1, name: 'Tarkarli Beach', location: 'Malvan', rating: 4.8, type: 'beaches', km: 12, emoji: '🏖️'},
  {id: 4, name: 'Devbagh Beach', location: 'Malvan', rating: 4.6, type: 'beaches', km: 15, emoji: '🏖️'},
  {id: 7, name: 'Nivati Beach', location: 'Devgad', rating: 4.5, type: 'beaches', km: 30, emoji: '🏖️'},
  {id: 2, name: 'Sindhudurg Fort', location: 'Malvan', rating: 4.9, type: 'forts', km: 8, emoji: '🏰'},
  {id: 5, name: 'Vijaydurg Fort', location: 'Devgad', rating: 4.5, type: 'forts', km: 22, emoji: '🏰'},
  {id: 8, name: 'Padmadurg Fort', location: 'Malvan', rating: 4.3, type: 'forts', km: 20, emoji: '🏰'},
  {id: 3, name: 'Amboli Ghat', location: 'Sawantwadi', rating: 4.7, type: 'waterfalls', km: 35, emoji: '💧'},
  {id: 6, name: 'Kunkeshwar Temple', location: 'Devgad', rating: 4.4, type: 'temples', km: 18, emoji: '⛩️'},
  {id: 11, name: 'Kokan Cuisine Hub', location: 'Kankavli', rating: 4.5, type: 'food', km: 5, emoji: '🍛'},
  {id: 12, name: 'Malvan Fish Market', location: 'Malvan', rating: 4.7, type: 'food', km: 9, emoji: '🐟'},
];

const SpotCard = ({item}) => (
  <View style={sp.spotCard}>
    <View style={sp.spotImgWrap}>
      <Text style={sp.spotEmoji}>{item.emoji || '🏔️'}</Text>
      <View style={sp.spotBadge}>
        <Text style={sp.spotBadgeText}>⭐ {item.rating}</Text>
      </View>
    </View>
    <View style={sp.spotInfo}>
      <Text style={sp.spotName} numberOfLines={1}>{item.name}</Text>
      <Text style={sp.spotLocation}>📍 {item.location}</Text>
      <View style={sp.spotMeta}>
        <Text style={sp.spotMetaText}>⭐ {item.rating}</Text>
        <Text style={sp.spotMetaDot}>•</Text>
        <Text style={sp.spotMetaText}>{item.km} km</Text>
      </View>
    </View>
  </View>
);

const PopularSpotsSection = ({navigation, trending, offline, hideTitle}) => {
  const {t} = useTranslation();
  const [activeSpotTab, setActiveSpotTab] = useState('all');

  const validTrendingKeys = useMemo(
    () => (trending ? Object.keys(trending).filter(k => trending[k]?.length > 0) : []),
    [trending],
  );

  const SPOT_TABS = useMemo(() => {
    if (validTrendingKeys.length > 0) return validTrendingKeys;
    return ['all', 'beaches', 'forts', 'waterfalls', 'temples', 'food'];
  }, [validTrendingKeys]);

  const filteredSpots = useMemo(() => {
    if (activeSpotTab === 'all') return STATIC_SPOTS;
    return STATIC_SPOTS.filter(s => s.type === activeSpotTab);
  }, [activeSpotTab]);

  return (
    <View style={sp.section}>
      {!hideTitle && <Text style={sp.sectionTitle}>{t('HOME.POPULAR_SPOTS')}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sp.tabsRow}>
        {SPOT_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[sp.tab, activeSpotTab === tab && sp.tabActive]}
            onPress={() => setActiveSpotTab(tab)}
            activeOpacity={0.8}>
            <Text style={[sp.tabText, activeSpotTab === tab && sp.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {validTrendingKeys.includes(activeSpotTab) && trending[activeSpotTab]?.length > 0 ? (
        <FlatList
          horizontal
          data={trending[activeSpotTab]}
          keyExtractor={(item, i) => `${item.id}_${i}`}
          renderItem={({item}) => (
            <PackageCard
              data={item}
              navigation={navigation}
              isConnected={offline}
              cardType="small"
              onClick={() => {}}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={sp.spotsList}
          ItemSeparatorComponent={() => <View style={{width: 14}} />}
        />
      ) : (
        <FlatList
          horizontal
          data={filteredSpots}
          keyExtractor={item => String(item.id)}
          renderItem={({item}) => <SpotCard item={item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={sp.spotsList}
          ItemSeparatorComponent={() => <View style={{width: 14}} />}
        />
      )}
    </View>
  );
};

const sp = StyleSheet.create({
  section: {marginBottom: 24},
  sectionTitle: {
    fontSize: 20, fontWeight: '700', color: C.textDark,
    paddingHorizontal: 20, marginBottom: 14,
  },
  tabsRow: {paddingHorizontal: 20, paddingBottom: 12, gap: 8},
  tab: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.05)',
  },
  tabActive: {backgroundColor: C.oceanMid, borderColor: 'transparent'},
  tabText: {fontSize: 13, fontWeight: '600', color: C.textMid},
  tabTextActive: {color: C.white},
  spotsList: {paddingHorizontal: 20, paddingBottom: 8},
  spotCard: {
    width: 220, backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: RADIUS, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  spotImgWrap: {
    width: '100%', height: 150, backgroundColor: '#e0f3f5',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  spotEmoji: {fontSize: 52, lineHeight: 70},
  spotBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 50, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  spotBadgeText: {fontSize: 11, fontWeight: '700', color: C.oceanMid},
  spotInfo: {padding: 13},
  spotName: {fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 5},
  spotLocation: {fontSize: 12, color: C.textLight, marginBottom: 7},
  spotMeta: {flexDirection: 'row', alignItems: 'center', gap: 6},
  spotMetaText: {fontSize: 11, color: C.textMid},
  spotMetaDot: {fontSize: 11, color: C.textLight},
});

export default PopularSpotsSection;
