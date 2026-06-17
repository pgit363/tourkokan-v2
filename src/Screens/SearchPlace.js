import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {comnPost} from '../Services/Api/CommonServices';
import {setDestination, setSource} from '../Reducers/CommonActions';
import {checkLogin, goBackHandler} from '../Services/CommonMethods';
import STRING from '../Services/Constants/STRINGS';
import {useGuestGate, isGuestUser} from '../Components/Common/GuestGateModal';
import {scaleFontSizes} from '../Services/responsive';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanFoam: '#B8E4EA',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  divider: 'rgba(0,0,0,0.07)',
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────

const useShimmer = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {toValue: 1, duration: 700, useNativeDriver: true}),
        Animated.timing(anim, {toValue: 0, duration: 700, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim.interpolate({inputRange: [0, 1], outputRange: [0.4, 0.85]});
};

const SkeletonRow = ({opacity}) => (
  <Animated.View style={[sk.row, {opacity}]}>
    <View style={sk.icon} />
    <View style={sk.lines}>
      <View style={sk.lineTitle} />
      <View style={sk.lineSub} />
    </View>
  </Animated.View>
);

const SkeletonList = () => {
  const opacity = useShimmer();
  return (
    <>
      {Array.from({length: 10}).map((_, i) => (
        <SkeletonRow key={i} opacity={opacity} />
      ))}
    </>
  );
};

const sk = StyleSheet.create(scaleFontSizes({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  icon: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB'},
  lines: {flex: 1, gap: 6},
  lineTitle: {height: 14, width: '55%', backgroundColor: '#E5E7EB', borderRadius: 7},
  lineSub: {height: 11, width: '35%', backgroundColor: '#F3F4F6', borderRadius: 6},
}));

// ─── Main Component ────────────────────────────────────────────────────────────

const SearchPlace = ({navigation, route, ...props}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const fieldType = route.params?.type || '';
  const isSource = fieldType === STRING.LABEL.SOURCE;

  const {show: showGuestPopup, modal: guestModal} = useGuestGate(navigation);

  const [searchValue, setSearchValue] = useState('');
  const [placesList, setPlacesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const backHandler = goBackHandler(navigation);
    checkLogin(navigation);
    fetchPlaces('', 1, false);
    // Auto-focus search input
    setTimeout(() => inputRef.current?.focus(), 300);
    return () => backHandler.remove();
  }, []);

  const fetchPlaces = (query, page, append) => {
    if (page === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    comnPost(`v2/sites?page=${page}`, {
      search: query,
      apitype: 'dropdown',
      type: 'bus',
    })
      .then(res => {
        if (res?.data?.success) {
          const data = res.data.data.data || [];
          const nextUrl = res.data.data.next_page_url;
          setPlacesList(prev => (append ? [...prev, ...data] : data));
          setHasMore(!!nextUrl);
          setCurrentPage(page);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
      });
  };

  const onSearchChange = text => {
    setSearchValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPlaces(text, 1, false);
    }, 350);
  };

  const onEndReached = async () => {
    if (!isLoadingMore && hasMore) {
      if (currentPage >= 2 && (await isGuestUser())) {
        showGuestPopup('Login to see more bus stops.');
        return;
      }
      fetchPlaces(searchValue, currentPage + 1, true);
    }
  };

  const onSelectPlace = place => {
    if (isSource) {
      props.setSource(place);
    } else {
      props.setDestination(place);
    }
    navigation.goBack();
  };

  const renderItem = ({item, index}) => (
    <TouchableOpacity
      style={[s.item, index === 0 && s.itemFirst]}
      onPress={() => onSelectPlace(item)}
      activeOpacity={0.65}>
      <View style={s.itemIconWrap}>
        <Ionicons
          name={isSource ? 'location' : 'navigate'}
          size={18}
          color={C.oceanMid}
        />
      </View>
      <View style={s.itemText}>
        <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
        {item.city_name || item.taluka ? (
          <Text style={s.itemSub} numberOfLines={1}>
            {[item.taluka, item.city_name].filter(Boolean).join(', ')}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={14} color="rgba(0,0,0,0.2)" />
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={s.footerLoader}>
        <ActivityIndicator size="small" color={C.oceanMid} />
        <Text style={s.footerLoaderText}>Loading more…</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={s.emptyWrap}>
        <Text style={s.emptyIcon}>🚌</Text>
        <Text style={s.emptyTitle}>No stops found</Text>
        <Text style={s.emptySub}>Try a different search term</Text>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={s.headerSafe}>
        <View style={s.header}>
          {/* Back */}
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={22} color={C.white} />
          </TouchableOpacity>

          {/* Search input */}
          <View style={s.searchInputWrap}>
            <Ionicons
              name={isSource ? 'location-outline' : 'navigate-outline'}
              size={16}
              color={C.oceanMid}
              style={s.searchIcon}
            />
            <TextInput
              ref={inputRef}
              style={s.searchInput}
              placeholder={`Search ${fieldType} stop…`}
              placeholderTextColor={C.textLight}
              value={searchValue}
              onChangeText={onSearchChange}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="words"
            />
            {searchValue.length > 0 && (
              <TouchableOpacity
                onPress={() => onSearchChange('')}
                hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                <Ionicons name="close-circle" size={18} color={C.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Field type badge */}
        <View style={s.badgeRow}>
          <View style={[s.badge, isSource ? s.badgeSource : s.badgeDest]}>
            <Ionicons
              name={isSource ? 'location' : 'navigate'}
              size={11}
              color={C.white}
            />
            <Text style={s.badgeText}>
              {isSource ? 'Selecting FROM' : 'Selecting TO'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Results ── */}
      {isLoading ? (
        <View style={s.listContainer}>
          <SkeletonList />
        </View>
      ) : (
        <FlatList
          style={s.listContainer}
          data={placesList}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={placesList.length === 0 && s.emptyContainer}
        />
      )}
      {guestModal}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create(scaleFontSizes({
  root: {flex: 1, backgroundColor: C.white},

  // Header
  headerSafe: {backgroundColor: C.oceanDeep},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {opacity: 0.7},
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.textDark,
    padding: 0,
    fontWeight: '400',
  },
  badgeRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeSource: {backgroundColor: 'rgba(196,151,42,0.85)'},
  badgeDest: {backgroundColor: 'rgba(27,107,123,0.85)'},
  badgeText: {fontSize: 11, fontWeight: '600', color: C.white, letterSpacing: 0.3},

  // List
  listContainer: {flex: 1, backgroundColor: C.white},

  // Stop item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  itemFirst: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(27,107,123,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {flex: 1},
  itemName: {fontSize: 15, fontWeight: '600', color: C.textDark, marginBottom: 2},
  itemSub: {fontSize: 12, color: C.textLight},

  // Footer loader
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  footerLoaderText: {fontSize: 13, color: C.textLight},

  // Empty state
  emptyContainer: {flex: 1},
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {fontSize: 48, marginBottom: 16},
  emptyTitle: {fontSize: 17, fontWeight: '700', color: C.textDark, marginBottom: 6},
  emptySub: {fontSize: 14, color: C.textLight},
}));

// ─── Redux ─────────────────────────────────────────────────────────────────────

const mapStateToProps = state => ({
  source: state.commonState.source,
  destination: state.commonState.destination,
});

const mapDispatchToProps = dispatch => ({
  setSource: data => dispatch(setSource(data)),
  setDestination: data => dispatch(setDestination(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchPlace);
