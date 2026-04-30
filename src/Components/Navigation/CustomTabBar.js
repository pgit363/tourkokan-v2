import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Keyboard,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanFoam: '#B8E4EA',
  white: '#FFFFFF',
  cream: '#FAF7F0',
  textLight: '#78716C',
};

const PILL_H = 64;
const FAB_SIZE = 64;
// How far FAB floats above the top of the pill
const FAB_LIFT = 8;

// Index 2 = MSRTC (center) — order: Home, Gallery, MSRTC, Categories, Map
const TAB_META = [
  {
    icon: (focused) => (
      <Image
        source={{uri: 'https://img.icons8.com/3d-fluency/375/home.png'}}
        style={{width: focused ? 30 : 26, height: focused ? 30 : 26}}
        resizeMode="contain"
      />
    ),
    label: 'Home',
  },
  {
    icon: (focused) => (
       <Image
        source={{uri: 'https://img.icons8.com/cotton/256/gallery.png'}}
        style={{width: focused ? 30 : 26, height: focused ? 30 : 26}}
        resizeMode="contain"
      />
    ),
    label: 'Gallery',
  },
  {
    isFab: true,
    icon: () => (
      <Image
        source={require('../../Assets/Images/Bus1_png_high.png')}
        style={{width: 42, height: 42}}
        resizeMode="contain"
      />
    ),
    label: 'MSRTC',
  },
  {
    icon: (focused) => (
      <Image
        source={{uri: 'https://img.icons8.com/external-anggara-outline-color-anggara-putra/375/external-menu-user-interface-anggara-outline-color-anggara-putra.png'}}
        style={{width: focused ? 30 : 26, height: focused ? 30 : 26}}
        resizeMode="contain"
      />
    ),
    label: 'Category',
  },
  {
    icon: (focused) => (
      <Image
        source={{uri: 'https://img.icons8.com/?size=100&id=52971&format=png&color=000000'}}
        style={{width: focused ? 30 : 26, height: focused ? 30 : 26}}
        resizeMode="contain"
      />
    ),
    label: 'Events',
  },
];

const CustomTabBar = ({state, navigation}) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const [keyboardShown, setKeyboardShown] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardShown(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardShown) return null;

  return (
    <View
      style={[
        tb.outerContainer,
        {paddingBottom: bottomPad, height: PILL_H + FAB_SIZE / 2 + FAB_LIFT + bottomPad},
      ]}
      pointerEvents="box-none">

      {/* Floating pill */}
      <View style={tb.pill}>
        {state.routes.map((route, index) => {
          const meta = TAB_META[index];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Center FAB slot — render invisible placeholder to keep pill layout even
          if (meta?.isFab) {
            return <View key={route.key} style={tb.fabSlot} />;
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.75}
              style={tb.tabItem}>
              <View style={tb.iconWrap}>
                {meta?.icon(isFocused)}
              </View>
              <Text style={[tb.tabLabel, isFocused && tb.tabLabelActive]}>
                {meta?.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Elevated FAB — absolutely centered, floats above pill */}
      {state.routes.map((route, index) => {
        const meta = TAB_META[index];
        if (!meta?.isFab) return null;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.85}
            style={[tb.fab, isFocused && tb.fabActive, {bottom: bottomPad + FAB_LIFT}]}>
            {/* Bus icon */}
            {meta.icon()}
            {/* Active ring */}
            {isFocused && <View style={tb.fabActiveRing} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const tb = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  // Pill
  pill: {
    width: '100%',
    height: PILL_H,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: PILL_H / 2,
    paddingHorizontal: 6,
    // Glassmorphic border
    borderWidth: 1,
    borderColor: 'rgba(27,107,123,0.12)',
    // Shadow
    shadowColor: '#0D3D4A',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 18,
  },

  // Empty center slot (keeps pill items evenly distributed)
  fabSlot: {
    flex: 1,
  },

  // Regular tab items
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: C.textLight,
    marginTop: 0,
  },
  tabLabelActive: {
    color: C.oceanMid,
    fontWeight: '700',
  },
  // Emoji icons
  emoji: {fontSize: 22, opacity: 1},
  emojiFocused: {fontSize: 24, opacity: 1},

  // Floating FAB (center)
  fab: {
    position: 'absolute',
    // bottom is passed inline (bottomPad + FAB_LIFT) so it tracks safe area insets
    alignSelf: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: C.oceanDeep,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 22,
    // Teal foam ring border
    borderWidth: 3,
    borderColor: 'rgba(27,107,123,0.25)',
  },
  fabActive: {
    borderColor: C.oceanMid,
    borderWidth: 3,
  },
  fabActiveRing: {
    position: 'absolute',
    width: FAB_SIZE + 10,
    height: FAB_SIZE + 10,
    borderRadius: (FAB_SIZE + 10) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(27,107,123,0.25)',
  },
});

export default CustomTabBar;
