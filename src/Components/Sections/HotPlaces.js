import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {FTP_PATH} from '@env';
import CachedImage from '../Customs/CachedImage';

const {width: SW} = Dimensions.get('window');
const RADIUS = 16;

const C = {
  white: '#FFFFFF',
  textDark: '#1C1917',
  textLight: '#78716C',
  glassBorder: 'rgba(0,0,0,0.07)',
};

const NearbyCard = ({item, onPress}) => {
  const fallback = require('../../Assets/Images/no-image.png');
  const uri = item.image
    ? `${FTP_PATH}${item.image}`
    : item.gallery?.[0]?.path
    ? `${FTP_PATH}${item.gallery[0].path}`
    : null;
  const category = item.categories?.[0]?.name || item.category;
  const sub = item.tag_line || null;

  return (
    <TouchableOpacity style={ts.nearbyCard} onPress={onPress} activeOpacity={0.85}>
      <View style={ts.nearbyImgWrap}>
        <CachedImage
          source={uri ? {uri} : fallback}
          style={ts.nearbyImg}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={ts.nearbyImgGradient}
        />
        <View style={ts.nearbyHotBadge}>
          <Text style={ts.nearbyHotBadgeText}>🔥</Text>
        </View>
      </View>
      {category ? (
        <View style={ts.nearbyCategoryBadge}>
          <Text style={ts.nearbyCategoryText}>{category.toUpperCase()}</Text>
        </View>
      ) : null}
      <Text style={ts.nearbyName} numberOfLines={1}>{item.name}</Text>
      {sub ? (
        <Text style={ts.nearbySub} numberOfLines={2}>{sub}</Text>
      ) : null}
    </TouchableOpacity>
  );
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
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.nearbyGrid}>
        {hot_sites.map(item => (
          <NearbyCard
            key={item.id}
            item={item}
            onPress={() => onCardPress?.(item)}
          />
        ))}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  section: {marginBottom: 24},
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1917',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  nearbyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
});

const ts = StyleSheet.create({
  nearbyCard: {
    width: (SW - 52) / 2,
    backgroundColor: C.white,
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  nearbyImgWrap: {width: '100%', height: 110, backgroundColor: '#e8f5f7'},
  nearbyImg: {width: '100%', height: '100%'},
  nearbyImgGradient: {position: 'absolute', bottom: 0, left: 0, right: 0, height: 50},
  nearbyHotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 50,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyHotBadgeText: {fontSize: 13},
  nearbyCategoryBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: 10,
    marginTop: 8,
    backgroundColor: 'rgba(27,107,123,0.1)',
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nearbyCategoryText: {fontSize: 9, fontWeight: '700', color: '#1B6B7B', letterSpacing: 0.5},
  nearbyName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textDark,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  nearbySub: {
    fontSize: 11,
    color: C.textLight,
    paddingHorizontal: 10,
    paddingBottom: 10,
    lineHeight: 16,
  },
});

export default HotPlaces;
