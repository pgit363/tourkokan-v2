import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {FTP_PATH} from '@env';
import CachedImage from '../Customs/CachedImage';

const {width: SW} = Dimensions.get('window');
const RADIUS = 16;

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  sandMid: '#C9A227',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  glass: 'rgba(255,255,255,0.85)',
  glassBorder: 'rgba(0,0,0,0.07)',
};

const TrendingCard = ({item, onPress}) => {
  const fallback = require('../../Assets/Images/no-image.png');
  const uri = item.image
    ? `${FTP_PATH}${item.image}`
    : item.gallery?.[0]?.path
    ? `${FTP_PATH}${item.gallery[0].path}`
    : null;

  const category = item.categories?.[0]?.name;
  const rating = Number(item.rating_avg_rate);

  return (
    <TouchableOpacity style={ts.trendCard} onPress={onPress} activeOpacity={0.85}>
      <View style={ts.trendImgWrap}>
        <CachedImage
          source={uri ? {uri} : fallback}
          style={ts.trendImg}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={ts.trendImgGradient}
        />
        {category ? (
          <View style={ts.trendCategoryBadge}>
            <Text style={ts.trendCategoryText}>{category}</Text>
          </View>
        ) : null}
        <View style={[ts.talukaHeart, item.is_favorite && ts.talukaHeartActive]}>
          <Ionicons
            name={item.is_favorite ? 'heart' : 'heart-outline'}
            size={14}
            color={item.is_favorite ? '#eb5757' : C.white}
          />
        </View>
      </View>
      <View style={ts.trendInfo}>
        <Text style={ts.trendName} numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text style={ts.trendDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={ts.trendFooter}>
          <View style={ts.talukaRating}>
            <Ionicons name="star" size={12} color={C.sandMid} />
            <Text style={ts.talukaRatingText}>
              {rating > 0 ? rating.toFixed(1) : 'New'}
            </Text>
          </View>
          <View style={ts.trendViewBtn}>
            <Text style={ts.trendViewBtnText}>View</Text>
            <Ionicons name="arrow-forward" size={10} color={C.oceanMid} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * PopularSpots — reusable section component.
 *
 * Props:
 *   trending   {Object}   — e.g. { all: [...], beaches: [...], forts: [...] }
 *   onCardPress {Function} — called with the item when a card is tapped
 *   title      {string}   — optional section heading (default "Popular Spots")
 */
const PopularSpots = ({trending = {}, onCardPress, title = 'Popular Spots'}) => {
  const validKeys = useMemo(
    () => Object.keys(trending).filter(k => trending[k]?.length > 0),
    [trending],
  );

  const [activeTab, setActiveTab] = useState(validKeys[0] ?? 'all');

  if (validKeys.length === 0) return null;

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabsRow}>
        {validKeys.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        horizontal
        data={trending[activeTab] || []}
        keyExtractor={(item, i) => `${item.id}_${i}`}
        renderItem={({item}) => (
          <TrendingCard item={item} onPress={() => onCardPress?.(item)} />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.spotsList}
        ItemSeparatorComponent={() => <View style={{width: 14}} />}
      />
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
  tabsRow: {paddingHorizontal: 20, paddingBottom: 8, gap: 8},
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tabActive: {backgroundColor: C.oceanMid, borderColor: 'transparent'},
  tabText: {fontSize: 13, fontWeight: '600', color: '#44403C'},
  tabTextActive: {color: C.white},
  spotsList: {paddingHorizontal: 20, paddingBottom: 8},
});

const ts = StyleSheet.create({
  talukaRating: {flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2},
  talukaRatingText: {fontSize: 11, color: C.textMid, fontWeight: '600'},
  talukaHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  talukaHeartActive: {backgroundColor: 'rgba(255,255,255,0.92)'},
  trendCard: {
    width: 210,
    backgroundColor: C.white,
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  trendImgWrap: {width: '100%', height: 150, backgroundColor: '#e8f5f7'},
  trendImg: {width: '100%', height: '100%'},
  trendImgGradient: {position: 'absolute', bottom: 0, left: 0, right: 0, height: 60},
  trendCategoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: C.oceanDeep,
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trendCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  trendInfo: {padding: 12},
  trendName: {fontSize: 14, fontWeight: '700', color: C.textDark, marginBottom: 4},
  trendDesc: {fontSize: 11, color: C.textLight, lineHeight: 16, marginBottom: 8},
  trendFooter: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  trendViewBtn: {flexDirection: 'row', alignItems: 'center', gap: 3},
  trendViewBtnText: {fontSize: 11, fontWeight: '600', color: C.oceanMid},
});

export default PopularSpots;
