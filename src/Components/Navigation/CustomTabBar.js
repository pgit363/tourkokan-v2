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
import {useResponsive} from '../../Services/responsive';

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanFoam: '#B8E4EA',
  white: '#FFFFFF',
  cream: '#FAF7F0',
  textLight: '#78716C',
};

// Phone baseline sizes (scaled up on tablets via useResponsive).
const PILL_H = 64;
const FAB_SIZE = 64;
// How far FAB floats above the top of the pill
const FAB_LIFT = 8;
// Cap the pill width on large screens so the 5 tabs don't spread edge-to-edge.
const MAX_PILL_W = 560;

// Index 2 = MSRTC (center) — order: Home, Gallery, MSRTC, Categories, Map.
// Each icon receives a resolved pixel `size` so the bar scales with the device.
const TAB_META = [
  {
    icon: size => (
      <Image
        source={require('../../Assets/Icons/tab/icons8-home-page-100.png')}
        style={{width: size, height: size}}
        resizeMode="contain"
      />
    ),
    label: 'Home',
  },
  {
    icon: size => (
      <Image
        source={require('../../Assets/Icons/tab/gallery.png')}
        style={{width: size, height: size}}
        resizeMode="contain"
      />
    ),
    label: 'Gallery',
  },
  {
    isFab: true,
    icon: size => (
      <Image
        source={require('../../Assets/Images/Bus1_png_high.png')}
        style={{width: size, height: size}}
        resizeMode="contain"
      />
    ),
    label: 'MSRTC',
  },
  {
    icon: size => (
      <Image
        source={require('../../Assets/Icons/tab/catgory.png')}
        style={{width: size, height: size}}
        resizeMode="contain"
      />
    ),
    label: 'Category',
  },
  {
    icon: size => (
      <Image
        source={require('../../Assets/Icons/tab/events.png')}
        style={{width: size, height: size}}
        resizeMode="contain"
      />
    ),
    label: 'Events',
  },
];

const CustomTabBar = ({state, navigation}) => {
  const insets = useSafeAreaInsets();
  const {isTablet, ms} = useResponsive();
  const bottomPad = Math.max(insets.bottom, 10);
  const [keyboardShown, setKeyboardShown] = useState(false);

  // Responsive dimensions — phone values unchanged, scaled up on tablets.
  const pillH = isTablet ? ms(PILL_H) : PILL_H;
  const fabSize = isTablet ? ms(FAB_SIZE) : FAB_SIZE;
  const iconWrapSize = isTablet ? ms(44) : 44;
  const labelSize = isTablet ? ms(10) : 10;
  const fabImg = isTablet ? ms(42) : 42;
  const iconSize = focused =>
    isTablet ? (focused ? ms(30) : ms(26)) : focused ? 30 : 26;
  const ringSize = fabSize + 10;

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
        {paddingBottom: bottomPad, height: pillH + fabSize / 2 + FAB_LIFT + bottomPad},
      ]}
      pointerEvents="box-none">

      {/* Floating pill */}
      <View
        style={[
          tb.pill,
          {height: pillH, borderRadius: pillH / 2},
          isTablet && {maxWidth: MAX_PILL_W, alignSelf: 'center'},
        ]}>
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
              <View style={[tb.iconWrap, {width: iconWrapSize, height: iconWrapSize}]}>
                {meta?.icon(iconSize(isFocused))}
              </View>
              <Text
                style={[
                  tb.tabLabel,
                  {fontSize: labelSize},
                  isFocused && tb.tabLabelActive,
                ]}>
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
            style={[
              tb.fab,
              {width: fabSize, height: fabSize, borderRadius: fabSize / 2},
              isFocused && tb.fabActive,
              {bottom: bottomPad + FAB_LIFT},
            ]}>
            {/* Bus icon */}
            {meta.icon(fabImg)}
            {/* Active ring */}
            {isFocused && (
              <View
                style={[
                  tb.fabActiveRing,
                  {width: ringSize, height: ringSize, borderRadius: ringSize / 2},
                ]}
              />
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
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
  },
  tabLabel: {
    fontWeight: '500',
    color: C.textLight,
    marginTop: 0,
  },
  tabLabelActive: {
    color: C.oceanMid,
    fontWeight: '700',
  },

  // Floating FAB (center)
  fab: {
    position: 'absolute',
    // bottom is passed inline (bottomPad + FAB_LIFT) so it tracks safe area insets
    alignSelf: 'center',
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
    borderWidth: 1.5,
    borderColor: 'rgba(27,107,123,0.25)',
  },
});

export default CustomTabBar;
