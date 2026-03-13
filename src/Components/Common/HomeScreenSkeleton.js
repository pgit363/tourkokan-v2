import React, {useEffect, useRef} from 'react';
import {View, ScrollView, StyleSheet, Dimensions, Animated} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const {width: SW} = Dimensions.get('window');

// Exact tokens from HomeScreen
const BANNER_H = Math.round(SW / 1.35);
const RADIUS = 18;
const CREAM = '#FAF7F0';
const S1 = '#D4CFC9';             // standard grey shimmer
const S2 = '#E0DCD6';             // light grey shimmer
const S3 = 'rgba(255,255,255,0.3)'; // shimmer on dark bg (banner)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Sh = ({w, h, r = 8, color = S1, style}) => (
  <View style={[{width: w, height: h, borderRadius: r, backgroundColor: color}, style]} />
);

// ─── 1. Banner (animated shimmer wave) ───────────────────────────────────────

const BannerSkel = () => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
    ).start();
    return () => anim.stopAnimation();
  }, [anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SW * 0.8, SW * 1.2],
  });

  return (
    <View style={sk.bannerWrap}>
      {/* Grey base matching rest of skeleton */}
      <View style={[StyleSheet.absoluteFill, {backgroundColor: '#C8C3BD'}]} />

      {/* Shimmer wave sweeping across */}
      <Animated.View
        style={[StyleSheet.absoluteFill, {transform: [{translateX}]}]}
        pointerEvents="none">
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255,255,255,0.25)',
            'rgba(255,255,255,0.45)',
            'rgba(255,255,255,0.25)',
            'transparent',
          ]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{width: SW * 0.7, height: '100%'}}
        />
      </Animated.View>

      {/* Grey content placeholders at bottom */}
      <View style={sk.bannerContent}>
        <View style={sk.bannerLines}>
          <Sh w={SW * 0.55} h={18} r={9} color="rgba(0,0,0,0.1)" style={{marginBottom: 8}} />
          <Sh w={SW * 0.35} h={13} r={6} color="rgba(0,0,0,0.07)" />
        </View>
        <View style={sk.bannerDots}>
          {[1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                sk.dot,
                i === 1 && {width: 20, backgroundColor: 'rgba(0,0,0,0.25)'},
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── 2. Search box ────────────────────────────────────────────────────────────
// Matches: searchSection (pH:20, pV:16) + searchBox (br:20, pH:18, pV:14, white bg)

const SearchSkel = () => (
  <View style={sk.searchSection}>
    <View style={sk.searchBox}>
      <Sh w={22} h={22} r={11} color={S1} />
      <Sh w={SW * 0.48} h={15} r={8} color={S1} />
    </View>
  </View>
);

// ─── 3. Section title ─────────────────────────────────────────────────────────
// Matches: sectionTitle (fontSize:20, pH:20, mb:14)

const TitleSkel = () => (
  <Sh w={180} h={22} r={9} color={S1} style={{marginHorizontal: 20, marginBottom: 14}} />
);

// ─── 4. Taluka card ───────────────────────────────────────────────────────────
// Matches: talukaCard (w:180, br:18) — talukaImgWrap (h:120) — talukaInfo (p:12)
//          name (h≈15), desc (h≈11×2+gap), rating row (h≈11)

const TalukaCardSkel = () => (
  <View style={sk.talukaCard}>
    {/* image area */}
    <View style={sk.talukaImg} />
    {/* info area */}
    <View style={sk.talukaInfo}>
      <Sh w={120} h={14} r={6} color={S1} style={{marginBottom: 6}} />
      <Sh w={140} h={10} r={5} color={S2} style={{marginBottom: 4}} />
      <Sh w={100} h={10} r={5} color={S2} style={{marginBottom: 6}} />
      {/* rating row: star + number */}
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
        <Sh w={12} h={12} r={6} color={S1} />
        <Sh w={28} h={10} r={5} color={S2} />
      </View>
    </View>
  </View>
);

const TalukasSkel = () => (
  <View style={sk.section}>
    <TitleSkel />
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{paddingHorizontal: 20, gap: 12, paddingBottom: 8}}>
      {[1, 2, 3, 4].map(i => <TalukaCardSkel key={i} />)}
    </ScrollView>
  </View>
);

// ─── 5. Bus timetable card ────────────────────────────────────────────────────
// Matches: sectionPad (pH:20, mb:24) + busCard (p:20, br:18, row, gap:16)
//          busIcon (54×54) + busInfo (title h≈17, subtitle h≈12)

const BusSkel = () => (
  <View style={sk.sectionPad}>
    <View style={sk.busCard}>
      <Sh w={54} h={54} r={10} color={S3} />
      <View style={{flex: 1, gap: 8}}>
        <Sh w={SW * 0.38} h={17} r={7} color={S3} />
        <Sh w={SW * 0.28} h={12} r={5} color={S3} />
      </View>
      <Sh w={22} h={22} r={11} color={S3} />
    </View>
  </View>
);

// ─── 6. Ad banner ────────────────────────────────────────────────────────────
// Matches: adBannerWrap (br:18, dashed sandMid border, sandPale bg)

const AdSkel = ({height}) => (
  <View style={sk.sectionPad}>
    <View style={[sk.adBox, {height}]}>
      {/* "Premium Ad" label badge top-right */}
      <Sh w={80} h={22} r={11} color="#C8C3BD" style={{position: 'absolute', top: 10, right: 10}} />
      {/* center content */}
      <Sh w={34} h={34} r={17} color={S1} style={{marginBottom: 10}} />
      <Sh w={140} h={14} r={6} color={S1} style={{marginBottom: 6}} />
      <Sh w={180} h={11} r={5} color={S2} />
    </View>
  </View>
);

// ─── 7. Popular spots ────────────────────────────────────────────────────────
// Tab pills: paddingHorizontal:20, gap:8, paddingVertical:10 pills (br:50)
// SpotCard: w:240, imgWrap h:150, info p:13

const SpotCardSkel = () => (
  <View style={sk.spotCard}>
    <View style={sk.spotImg} />
    <View style={{padding: 13, gap: 6}}>
      {/* badge positioned absolute — skip in skel, just add title line */}
      <Sh w={180} h={15} r={6} color={S1} style={{marginBottom: 5}} />
      <Sh w={120} h={12} r={5} color={S2} style={{marginBottom: 7}} />
      {/* meta row: star + dot + km */}
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
        <Sh w={40} h={11} r={5} color={S2} />
        <Sh w={4} h={4} r={2} color={S2} />
        <Sh w={40} h={11} r={5} color={S2} />
      </View>
    </View>
  </View>
);

const SpotsSkel = () => (
  <View style={sk.section}>
    <TitleSkel />
    {/* Tab pills row */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{paddingHorizontal: 20, gap: 8, paddingBottom: 8}}>
      {[90, 60, 80, 70, 65].map((w, i) => (
        <Sh key={i} w={w} h={38} r={50} color={S1} />
      ))}
    </ScrollView>
    {/* Spot cards */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{paddingHorizontal: 20, gap: 14, paddingBottom: 8}}>
      {[1, 2, 3].map(i => <SpotCardSkel key={i} />)}
    </ScrollView>
  </View>
);

// ─── 8. Nearby places 2×2 grid ───────────────────────────────────────────────
// NearbyCard: w:(SW-52)/2, p:16, center-aligned
//   emoji (38px circle), category badge, name (2 lines), distance

const NearbyCardSkel = () => (
  <View style={sk.nearbyCard}>
    {/* emoji circle */}
    <Sh w={52} h={52} r={26} color={S1} style={{marginBottom: 8}} />
    {/* category badge */}
    <Sh w={60} h={22} r={11} color="#C8C3BD" style={{marginBottom: 8}} />
    {/* name */}
    <Sh w={(SW - 52) / 2 - 40} h={13} r={5} color={S1} style={{marginBottom: 4}} />
    <Sh w={(SW - 52) / 2 - 60} h={13} r={5} color={S2} style={{marginBottom: 4}} />
    {/* distance */}
    <Sh w={60} h={11} r={5} color={S2} />
  </View>
);

const NearbySkel = () => (
  <View style={sk.section}>
    {/* header row: title + taluka selector pill */}
    <View style={sk.nearbyHeader}>
      <Sh w={160} h={22} r={9} color={S1} />
      <Sh w={110} h={34} r={17} color={S1} />
    </View>
    <View style={sk.nearbyGrid}>
      {[1, 2, 3, 4].map(i => <NearbyCardSkel key={i} />)}
    </View>
  </View>
);

// ─── Full HomeScreen skeleton ─────────────────────────────────────────────────

const HomeScreenSkeleton = () => (
  <ScrollView
    style={sk.scroll}
    showsVerticalScrollIndicator={false}>
    <BannerSkel />
    <SearchSkel />
    <TalukasSkel />
    <BusSkel />
    <AdSkel height={Math.round(SW / 2.5)} />
    <SpotsSkel />
    <NearbySkel />
    <View style={[sk.sectionPad, {paddingBottom: 32}]}>
      <View style={[sk.adBox, {height: Math.round(SW / 3.5)}]}>
        <Sh w={34} h={34} r={17} color={S1} style={{marginBottom: 10}} />
        <Sh w={140} h={14} r={6} color={S1} style={{marginBottom: 6}} />
        <Sh w={160} h={11} r={5} color={S2} />
      </View>
    </View>
  </ScrollView>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const sk = StyleSheet.create({
  scroll: {flex: 1, backgroundColor: CREAM},

  // Banner — animated shimmer wrapper
  bannerWrap: {
    width: '100%',
    height: BANNER_H,
    backgroundColor: '#C8C3BD',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bannerContent: {
    padding: 20,
    gap: 12,
  },
  bannerLines: {gap: 0},
  bannerDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  // Search — matches s.searchSection + s.searchBox
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(250,247,240,0.95)',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EDEAE5',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0DCD6',
  },

  // Spacing — matches s.section + s.sectionPad
  section: {marginBottom: 24},
  sectionPad: {paddingHorizontal: 20, marginBottom: 24},

  // Taluka card — matches ts.talukaCard (w:180, br:18, overflow:hidden)
  talukaCard: {
    width: 180,
    backgroundColor: '#EDEAE5',
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0DCD6',
  },
  talukaImg: {
    width: '100%',
    height: 120,
    backgroundColor: '#C8C3BD',
  },
  talukaInfo: {
    padding: 12,           // matches ts.talukaInfo
    gap: 0,
  },

  // Bus card — matches s.busCard (p:20, br:18, row, gradient bg)
  busCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: RADIUS,
    padding: 20,
    backgroundColor: '#D4C9A8',
    borderWidth: 1,
    borderColor: '#C8BC96',
  },

  // Ad banner — matches ts.adBannerWrap (sandPale bg, dashed sandMid border, br:18)
  adBox: {
    backgroundColor: '#EDEAE5',
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: '#C8C3BD',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Spot card — matches ts.spotCard (w:240, br:18, overflow:hidden)
  spotCard: {
    width: 240,
    backgroundColor: '#EDEAE5',
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0DCD6',
  },
  spotImg: {
    width: '100%',
    height: 150,
    backgroundColor: '#C8C3BD',
  },

  // Nearby section header
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingRight: 20,
    marginBottom: 14,
  },

  // Nearby grid — matches s.nearbyGrid (flexWrap, pH:20, gap:12)
  nearbyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },

  // Nearby card — matches ts.nearbyCard (w:(SW-52)/2, p:16, center)
  nearbyCard: {
    width: (SW - 52) / 2,
    backgroundColor: '#EDEAE5',
    borderRadius: RADIUS,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0DCD6',
  },
});

export default HomeScreenSkeleton;
