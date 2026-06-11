import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  BackHandler,
  ActivityIndicator,
  Image,
  Keyboard,
  Animated,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import {s, C} from './CityPlaceSearchStyles';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {AWS_URL} from '@env';

import {comnPost} from '../../Services/Api/CommonServices';
import {navigateTo} from '../../Services/CommonMethods';
import {useGuestGate, isGuestUser, GUEST_KEYS, incrementGuestCount} from '../../Components/Common/GuestGateModal';
import {useConnectivityGate} from '../../Components/Common/useConnectivityGate';

const RECENT_KEY = 'recentSearches_v2';
const MAX_RECENT = 8;
const {height: SCREEN_H, width: SCREEN_W} = Dimensions.get('window');
const MAP_CARD_W = SCREEN_W - 80; // side-peek effect
const MAP_CARD_GAP = 12;

// Emoji fallback for stored category codes that have no icon URL
const CAT_EMOJI = {
  beach: '🏖', fort: '🏰', temple: '🛕', waterfall: '💧',
  food: '🍛', nature: '🌿', cit: '🏙️', hotel: '🏨',
  kokan: '🌊', view: '🔭', accommodation: '🏠', wildlife: '🐾',
  heritage: '🏛', adventure: '🧗', park: '🌳', lake: '🏞',
};
const getCatEmoji = code => {
  if (!code) return '📍';
  const lc = code.toLowerCase();
  const found = Object.entries(CAT_EMOJI).find(([k]) => lc.includes(k));
  return found ? found[1] : '📍';
};

// ─────────────────────────────────────────────────────────────────────────────

const CityPlaceSearch = ({navigation, route}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const cardsListRef = useRef(null);
  const currentSearch = useRef({search: '', categoryKey: null});
  const isLoadingMoreRef = useRef(false);
  const guestPromptedRef = useRef(false); // show the guest gate once per search session
  const viewabilityConfig = useRef({itemVisiblePercentThreshold: 60});

  const {show: showGuestPopup, modal: guestModal} = useGuestGate(navigation);
  const {modal: connectivityModal, ensureOnline} = useConnectivityGate();

  const [query, setQuery] = useState('');
  const [offline, setOffline] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showDropdown, setShowDropdown] = useState(true);
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null); // tapped map marker
  const [totalCount, setTotalCount] = useState(0); // API total records
  const [pageItems, setPageItems] = useState([]); // current page items only (not accumulated)
  const [storedCats, setStoredCats] = useState([]); // flattened categories from AsyncStorage
  const [activeFilter, setActiveFilter] = useState(null); // {name, code} or null

  // Track pagination state in refs to avoid stale closures
  const pageStateRef = useRef({currentPage: 1, hasMore: false, isSearching: false});

  // header height → dropdown top anchor
  const HEADER_H = insets.top + 130;
  const DROPDOWN_MAX_H = Math.min(420, SCREEN_H - HEADER_H - 80);

  // ── Back handler ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => handler.remove();
  }, [navigation]);

  // pageStateRef is updated directly at each state-setting site (not via useEffect)
  // to avoid the race where onEndReached fires between render and useEffect execution.

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = NetInfo.addEventListener(s =>
      setOffline(!s.isConnected),
    );
    loadRecentSearches();
    loadInitialResults(route.params?.initialParentId || null, route.params?.initialCityName || null, route.params?.initialCategoryKey || null);
    loadStoredCategories();
    return () => {
      unsub();
    };
  }, []);

  // ── Flatten parent + sub_categories from AsyncStorage into dropdown list ───
  const loadStoredCategories = async () => {
    try {
      const raw = await AsyncStorage.getItem(t('STORAGE.CATEGORIES_RESPONSE'));
      if (!raw) return;
      const stored = JSON.parse(raw);
      const parents = Array.isArray(stored) ? stored : stored?.data ?? [];
      const flat = [];
      parents.forEach(parent => {
        flat.push({id: parent.id, name: parent.name, code: parent.code});
        (parent.sub_categories || []).forEach(sub => {
          flat.push({id: sub.id, name: sub.name, code: sub.code, parentName: parent.name});
        });
      });
      setStoredCats(flat);
    } catch (e) { console.warn("[caught]", e); }
  };

  // ── Auto-search after 3 chars (300 ms debounce) + auto-hide suggestions ───
  useEffect(() => {
    if (query.length < 3) return;
    // Fire search 300 ms after user stops typing — silent keeps dropdown open
    const searchTimer = setTimeout(
      () => performSearch(query, currentSearch.current.categoryKey, true),
      300,
    );
    // Auto-dismiss suggestions 3.5 s after last keystroke — results already
    // rendering in background by then
    const hideTimer = setTimeout(() => {
      setShowDropdown(false);
      setIsFocused(false);
      Keyboard.dismiss();
    }, 3500);
    return () => {
      clearTimeout(searchTimer);
      clearTimeout(hideTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ── Fit map when results / view changes ───────────────────────────────────
  useEffect(() => {
    if (activeView === 'map' && results.length > 0) fitMap(results);
  }, [results, activeView]);

  const fitMap = useCallback(data => {
    if (!mapRef.current || !data?.length) return;
    const coords = data
      .map(item => ({
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
      }))
      .filter(c => !isNaN(c.latitude) && !isNaN(c.longitude));
    if (!coords.length) return;
    setTimeout(
      () =>
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: {top: 60, right: 40, bottom: 220, left: 40},
          animated: true,
        }),
      400,
    );
  }, []);

  // ── Map card list ↔ marker sync ───────────────────────────────────────────
  // When a card scrolls into center, focus the corresponding map marker
  const onCardViewableItemsChanged = useCallback(({viewableItems}) => {
    if (!viewableItems.length) return;
    const focused = viewableItems[Math.floor(viewableItems.length / 2)]?.item
      ?? viewableItems[0].item;
    setSelectedPlace(focused);
    const lat = parseFloat(focused.latitude);
    const lng = parseFloat(focused.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current?.animateToRegion(
        {latitude: lat, longitude: lng, latitudeDelta: 0.015, longitudeDelta: 0.015},
        350,
      );
    }
  }, []);

  // ── API helpers ───────────────────────────────────────────────────────────
  const parsePage = res => {
    const p = res?.data?.data;
    return {data: p?.data || [], cp: p?.current_page || 1, lp: p?.last_page || 1, total: p?.total || 0};
  };

  // Offline mode → prompt to go online instead of searching.
  const loadInitialResults = (parentId = null, cityName = null, categoryKey = null) =>
    ensureOnline(async () => {
      setIsSearching(true);
      guestPromptedRef.current = false;
      pageStateRef.current = {...pageStateRef.current, isSearching: true, hasMore: false};
      setHasSearched(true);
      setActiveFilter(cityName ? {name: cityName, code: categoryKey || '__parent__'} : null);
      currentSearch.current = {search: '', categoryKey: categoryKey || null, parentId: parentId || null};
      try {
        const payload = {search: '', apitype: 'list', global: 1, page: 1};
        if (currentSearch.current.parentId) payload.parent_id = currentSearch.current.parentId;
        if (currentSearch.current.categoryKey) payload.category = currentSearch.current.categoryKey;
        const res = await comnPost('v2/sites', payload);
        const {data, cp, lp, total} = parsePage(res);
        setResults(data);
        setPageItems(data);
        setTotalCount(total);
        pageStateRef.current = {currentPage: cp, hasMore: cp < lp, isSearching: false};
      } catch {
        setResults([]);
        setPageItems([]);
        setTotalCount(0);
        pageStateRef.current = {currentPage: 1, hasMore: false, isSearching: false};
      } finally {
        setIsSearching(false);
      }
    });

  const loadRecentSearches = async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch (e) { console.warn("[caught]", e); }
  };

  const saveRecentSearch = async term => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      let recent = raw ? JSON.parse(raw) : [];
      recent = [term, ...recent.filter(r => r !== term)].slice(0, MAX_RECENT);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(recent));
      setRecentSearches(recent);
    } catch (e) { console.warn("[caught]", e); }
  };

  const clearRecentSearches = async () => {
    await AsyncStorage.removeItem(RECENT_KEY);
    setRecentSearches([]);
  };

  // ── Input — update query; reload initial list when cleared ───────────────
  const handleInput = val => {
    setQuery(val);
    if (val === '') loadInitialResults();
  };

  // ── Full search ───────────────────────────────────────────────────────────
  // silent=true → auto-triggered (keep keyboard + dropdown open)
  const performSearch = useCallback(
    async (val, categoryKey, silent = false, filterLabel = null) => {
      const term = val !== undefined ? val : query;
      if (!silent && categoryKey) {
        const count = await incrementGuestCount(GUEST_KEYS.FILTER_COUNT);
        if (count > 2 && (await isGuestUser())) {
          showGuestPopup('Login to use more filters.');
          return;
        }
      }
      if (!silent) {
        Keyboard.dismiss();
        setIsFocused(false);
        if (term) saveRecentSearch(term);
      }
      currentSearch.current = {search: term || '', categoryKey: categoryKey ?? null};
      if (!silent) {
        setActiveFilter(categoryKey ? {name: filterLabel || categoryKey, code: categoryKey} : null);
      }
      // Offline mode → prompt to go online instead of hitting the search API.
      ensureOnline(async () => {
        setIsSearching(true);
        guestPromptedRef.current = false;
        pageStateRef.current = {currentPage: 1, hasMore: false, isSearching: true};
        setHasSearched(true);
        setResults([]);
        setSelectedPlace(null);
        try {
          const payload = {search: term || '', apitype: 'list', global: 1, page: 1};
          if (categoryKey) payload.category = categoryKey;

          const res = await comnPost('v2/sites', payload);
          const {data, cp, lp, total} = parsePage(res);
          setResults(data);
          setPageItems(data);
          setTotalCount(total);
          pageStateRef.current = {currentPage: cp, hasMore: cp < lp, isSearching: false};
        } catch {
          setResults([]);
          setPageItems([]);
          setTotalCount(0);
          pageStateRef.current = {currentPage: 1, hasMore: false, isSearching: false};
        } finally {
          setIsSearching(false);
        }
      });
    },
    [query, ensureOnline],
  );

  // ── Pagination ────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    const {currentPage: cp, hasMore: hm, isSearching: is} = pageStateRef.current;

    if (isLoadingMoreRef.current || !hm || is) {
      return;
    }

    // Set the guard before any await — the onScroll fallback can fire several
    // times per scroll and would otherwise start duplicate page requests.
    isLoadingMoreRef.current = true;
    try {
      if (cp >= 2 && (await isGuestUser())) {
        // Prompt once per search session — the scroll fallback would otherwise
        // re-open the popup on every scroll event near the end.
        if (!guestPromptedRef.current) {
          guestPromptedRef.current = true;
          showGuestPopup('Login to explore more places beyond page 2.');
        }
        return;
      }

      await ensureOnline(async () => {
        setIsLoadingMore(true);
        const nextPage = cp + 1;
        const {search, categoryKey, parentId} = currentSearch.current;
        const payload = {search, apitype: 'list', global: 1, page: nextPage};
        if (categoryKey) payload.category = categoryKey;
        if (parentId) payload.parent_id = parentId;

        const res = await comnPost('v2/sites', payload);
        // comnPost resolves with {success:false} on failure — leave paging
        // untouched so the next end-reach retries instead of going dead.
        if (res?.data?.success === false || !Array.isArray(res?.data?.data?.data)) {
          return;
        }
        const {data, cp: newCp, lp} = parsePage(res);

        // Safety net: never append a record that's already in the list.
        setResults(prev => {
          const seen = new Set(prev.map(r => r.id));
          const fresh = data.filter(d => !seen.has(d.id));
          return fresh.length ? [...prev, ...fresh] : prev;
        });
        pageStateRef.current = {currentPage: newCp, hasMore: newCp < lp, isSearching: false};
      });
    } catch (_) {
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [ensureOnline, showGuestPopup]); // pageStateRef provides current values

  const clearSearch = () => {
    setQuery('');
    setSelectedPlace(null);
    inputRef.current?.focus();
    loadInitialResults();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const openPlace = item =>
    navigateTo(navigation, t('SCREEN.SITE_DETAIL'), {city: item});

  const getImageUri = item => {
    if (item?.image) return `${AWS_URL}${item.image}`;
    if (item?.gallery?.[0]?.path) return `${AWS_URL}${item.gallery[0].path}`;
    return null;
  };

  const getCityName = item => item?.site?.name || '';
  const getCategoryName = item => item?.categories?.[0]?.name || 'Place';


  // Open Google Maps Street View at the place (50 m search radius hint via cbp)
  const openStreetView = item => {
    const lat = parseFloat(item.latitude);
    const lng = parseFloat(item.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    // Deep-link to Google Maps Street View; falls back to web URL
    const deepLink =
      Platform.OS === 'ios'
        ? `comgooglemaps://?center=${lat},${lng}&views=streetview`
        : `google.streetview:cbll=${lat},${lng}&cbp=11,0,0,0,0`;
    const webUrl = `https://maps.google.com/?q=&layer=c&cbll=${lat},${lng}`;

    Linking.canOpenURL(deepLink)
      .then(ok => Linking.openURL(ok ? deepLink : webUrl))
      .catch(() => Linking.openURL(webUrl));
  };

  // ── Dropdown — category suggestions only, scrollable with keyboard ────────
  const renderDropdown = () => {
    if (!isFocused || !showDropdown) return null;
    return (
      <>
        {/* backdrop dismiss */}
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, {top: HEADER_H}]}
          onPress={() => { Keyboard.dismiss(); setIsFocused(false); }}
          activeOpacity={0}
        />
        <ScrollView
          style={[s.dropdown, {top: HEADER_H, maxHeight: DROPDOWN_MAX_H}]}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {storedCats.map(item => {
            const label =
              query.length > 0
                ? t('SEARCH_SCREEN.SEARCH_QUERY_IN_CAT', {query, cat: item.name})
                : t('SEARCH_SCREEN.SEARCH_IN_CAT', {cat: item.name});
            return (
              <TouchableOpacity
                key={String(item.id)}
                style={s.suggestionRow}
                onPress={() => performSearch(query.length > 0 ? query : '', item.code, false, item.name)}
                activeOpacity={0.75}>
                <Text style={s.suggestionRowIcon}>{getCatEmoji(item.code)}</Text>
                <View style={{flex: 1}}>
                  <Text style={s.suggestionRowText} numberOfLines={1}>{label}</Text>
                  {item.parentName ? (
                    <Text style={s.suggestionRowSub} numberOfLines={1}>{item.parentName}</Text>
                  ) : null}
                </View>
                <Ionicons name="search" size={14} color={C.textLight} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </>
    );
  };

  // ── Grid card ─────────────────────────────────────────────────────────────
  const renderResultGrid = ({item}) => {
    const uri = getImageUri(item);
    return (
      <TouchableOpacity
        style={s.resultCard}
        onPress={() => openPlace(item)}
        activeOpacity={0.85}>
        <View style={s.resultImageWrap}>
          {uri ? (
            <Image source={{uri}} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Text style={{fontSize: 52}}>📍</Text>
          )}
          <View style={s.resultBadge}>
            <Text style={s.resultBadgeText}>{getCategoryName(item)}</Text>
          </View>
        </View>
        <View style={s.resultInfo}>
          <Text style={s.resultName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.resultLocation} numberOfLines={1}>📍 {getCityName(item)}</Text>
          <View style={s.resultMeta}>
            <Text style={s.resultMetaText}>
              ⭐ {item.rating_avg_rate ? Number(item.rating_avg_rate).toFixed(1) : '—'}
            </Text>
            {item.distance ? (
              <>
                <Text style={s.resultMetaDot}>•</Text>
                <Text style={s.resultMetaText}>{item.distance} km</Text>
              </>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── List compact row ──────────────────────────────────────────────────────
  const renderResultList = ({item}) => {
    const uri = getImageUri(item);
    return (
      <TouchableOpacity
        style={s.resultCompact}
        onPress={() => openPlace(item)}
        activeOpacity={0.85}>
        <View style={s.resultThumb}>
          {uri ? (
            <Image source={{uri}} style={s.resultThumbImg} resizeMode="cover" />
          ) : (
            <Text style={{fontSize: 28}}>📍</Text>
          )}
        </View>
        <View style={s.resultContent}>
          <Text style={s.resultCompactName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.resultCompactMeta} numberOfLines={1}>
            📍 {getCityName(item)}{'  '}⭐{' '}
            {item.rating_avg_rate ? Number(item.rating_avg_rate).toFixed(1) : '—'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={C.textLight} />
      </TouchableOpacity>
    );
  };

  // ── Map view — satellite hybrid + horizontal scrollable card list ───────────
  const renderMapView = () => {
    const hasCoords = item =>
      item.latitude && item.longitude &&
      !isNaN(parseFloat(item.latitude)) &&
      !isNaN(parseFloat(item.longitude));
    const markers = results.filter(hasCoords);
    // Horizontal card list shows only current page items (not accumulated pages)
    const pageMarkers = pageItems.filter(hasCoords);

    return (
      <View style={s.mapContainer}>
        {/* Satellite map */}
        <MapView
          ref={mapRef}
          style={s.map}
          provider={PROVIDER_GOOGLE}
          mapType="hybrid"
          onMapReady={() => fitMap(markers)}
          initialRegion={{
            latitude: markers[0] ? parseFloat(markers[0].latitude) : 15.2993,
            longitude: markers[0] ? parseFloat(markers[0].longitude) : 74.124,
            latitudeDelta: 2.5,
            longitudeDelta: 2.5,
          }}>
          {markers.map(item => (
            <Marker
              key={String(item.id)}
              coordinate={{
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude),
              }}
              title={item.name}
              pinColor={selectedPlace?.id === item.id ? '#F4A62A' : C.oceanMid}
              onPress={e => {
                e.stopPropagation?.();
                setSelectedPlace(item);
                mapRef.current?.animateToRegion(
                  {
                    latitude: parseFloat(item.latitude),
                    longitude: parseFloat(item.longitude),
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.015,
                  },
                  350,
                );
                const idx = pageMarkers.findIndex(m => m.id === item.id);
                if (idx >= 0) {
                  cardsListRef.current?.scrollToIndex({index: idx, animated: true});
                }
              }}
            />
          ))}
        </MapView>

        {/* No markers fallback */}
        {markers.length === 0 && (
          <View style={s.mapNoData}>
            <Text style={s.mapNoDataIcon}>🗺️</Text>
            <Text style={s.mapNoDataText}>{t('SEARCH_SCREEN.MAP_NO_DATA')}</Text>
          </View>
        )}

        {/* Horizontal scrollable place cards — current page only */}
        {pageMarkers.length > 0 && (
          <FlatList
            ref={cardsListRef}
            data={pageMarkers}
            horizontal
            keyExtractor={item => String(item.id)}
            style={s.mapCardList}
            contentContainerStyle={{
              paddingHorizontal: (SCREEN_W - MAP_CARD_W) / 2,
            }}
            snapToInterval={MAP_CARD_W + MAP_CARD_GAP}
            snapToAlignment="center"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{width: MAP_CARD_GAP}} />}
            onViewableItemsChanged={onCardViewableItemsChanged}
            viewabilityConfig={viewabilityConfig.current}
            onScrollToIndexFailed={() => {}}
            renderItem={({item}) => {
              const uri = getImageUri(item);
              const isActive = selectedPlace?.id === item.id;
              return (
                <TouchableOpacity
                  style={[s.mapHCard, {width: MAP_CARD_W}, isActive && s.mapHCardActive]}
                  onPress={() => openPlace(item)}
                  activeOpacity={0.9}>
                  <View style={s.mapHCardThumb}>
                    {uri ? (
                      <Image
                        source={{uri}}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{fontSize: 26}}>📍</Text>
                    )}
                  </View>
                  <View style={s.mapHCardInfo}>
                    <Text style={s.mapHCardName} numberOfLines={1}>{item.name}</Text>
                    <Text style={s.mapHCardMeta} numberOfLines={1}>
                      📍 {getCityName(item)}
                    </Text>
                    <Text style={s.mapHCardCat}>
                      {getCategoryName(item)}{'  '}⭐{' '}
                      {item.rating_avg_rate ? Number(item.rating_avg_rate).toFixed(1) : '—'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.mapHCardStreetBtn}
                    onPress={() => openStreetView(item)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <Ionicons name="eye-outline" size={18} color={C.oceanMid} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  };

  // ── Stable FlatList header — useCallback keeps same function ref when deps unchanged ──
  // This prevents FlatList from seeing a new component *type* each render (which would
  // cause unmount + remount on every state change).
  // Recents always show below the sticky bar (scrollable with list) when available
  const ListHeaderComp = useCallback(() => {
    if (recentSearches.length === 0) return null;
    return (
      <View style={s.recentSection}>
        <View style={s.recentHeader}>
          <Text style={s.sectionTitle}>{t('SEARCH_SCREEN.RECENT')}</Text>
          <TouchableOpacity
            onPress={clearRecentSearches}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={s.clearAll}>{t('SEARCH_SCREEN.CLEAR_ALL')}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.recentScroll}
          keyboardShouldPersistTaps="handled">
          {recentSearches.map((r, i) => (
            <TouchableOpacity
              key={i}
              style={s.recentChip}
              onPress={() => performSearch(r)}
              activeOpacity={0.8}>
              <Ionicons name="time-outline" size={13} color={C.textLight} />
              <Text style={s.recentText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentSearches]);

  // ── Stable FlatList empty — same reasoning as above ───────────────────────
  const ListEmptyComp = useCallback(() => {
    if (!hasSearched) return null;
    if (isSearching) {
      return activeView === 'list' ? <SkeletonListCards /> : <SkeletonCards />;
    }
    return (
      <View>
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>🔍</Text>
          <Text style={s.emptyTitle}>{t('SEARCH_SCREEN.NO_RESULTS')}</Text>
          <Text style={s.emptySub}>{t('SEARCH_SCREEN.TRY_DIFFERENT')}</Text>
        </View>
        <TouchableOpacity style={s.addPlaceCard} activeOpacity={0.85}>
          <View style={s.addPlaceIcon}>
            <Text style={{fontSize: 20}}>📍</Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={s.addPlaceTitle}>{t('SEARCH_SCREEN.ADD_MISSING')}</Text>
            <Text style={s.addPlaceSub}>{t('SEARCH_SCREEN.ADD_MISSING_SUB')}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={C.oceanMid} />
        </TouchableOpacity>
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSearched, isSearching, activeView]);

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['rgba(13,61,74,0.97)', 'rgba(26,51,32,0.97)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={C.white} />
        </TouchableOpacity>

        <View style={[s.searchBar, isFocused && s.searchBarFocused]}>
          <Ionicons name="search" size={20} color={C.oceanMid} />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder={t('SEARCH_SCREEN.PLACEHOLDER')}
            placeholderTextColor={C.textLight}
            value={query}
            onChangeText={handleInput}
            onFocus={() => { setIsFocused(true); setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query, null)}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="close" size={18} color={C.textLight} />
            </TouchableOpacity>
          )}
          {isSearching && (
            <ActivityIndicator size="small" color={C.oceanMid} style={{marginLeft: 4}} />
          )}
          {isFocused && (
            <TouchableOpacity
              onPress={() => setShowDropdown(v => !v)}
              hitSlop={{top: 8, bottom: 8, left: 6, right: 6}}>
              <Ionicons
                name={showDropdown ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={C.oceanMid}
              />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Floating dropdown */}
      {renderDropdown()}

      {/* Offline banner */}
      {offline && (
        <View style={s.offlineBanner}>
          <Ionicons name="wifi-outline" size={13} color={C.white} />
          <Text style={s.offlineBannerText}>{t('SEARCH_SCREEN.OFFLINE')}</Text>
        </View>
      )}

      {/* Sticky results bar — fixed, inlined to avoid per-render remount */}
      {hasSearched && (
        <>
          <View style={s.stickyResultsBar}>
            <Text style={s.resultsCount}>
              {results.length}{totalCount > 0 ? ` / ${totalCount}` : ''} {t('SEARCH_SCREEN.RESULTS')}
            </Text>
            <View style={s.viewToggle}>
              {[
                {id: 'list', icon: 'list-outline'},
                {id: 'grid', icon: 'grid-outline'},
                {id: 'map',  icon: 'map-outline'},
              ].map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[s.toggleBtn, activeView === tab.id && s.toggleBtnActive]}
                  onPress={() => setActiveView(tab.id)}
                  activeOpacity={0.8}>
                  <Ionicons
                    name={tab.icon}
                    size={18}
                    color={activeView === tab.id ? C.white : C.textMid}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {activeFilter && (
            <View style={s.filterChipsBar}>
              <TouchableOpacity
                style={s.filterChip}
                onPress={() => {
                  if (activeFilter.code === '__parent__') {
                    loadInitialResults(null, null);
                  } else {
                    performSearch(query, null);
                  }
                }}
                activeOpacity={0.75}>
                <Text style={s.filterChipText}>{activeFilter.name}</Text>
                <Ionicons name="close" size={13} color={C.oceanMid} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Content */}
      {activeView === 'map' && hasSearched ? (
        <View style={s.mapWrapper}>
          {isSearching ? <SkeletonMapView /> : renderMapView()}
        </View>
      ) : (
        <FlatList
          // Remount when results transition empty ↔ loaded: VirtualizedList
          // otherwise keeps the render window from the initial empty mount,
          // which blocks onEndReached from ever firing (same issue as
          // Emergency.js — see its FlatList key comment).
          key={`results-${hasSearched && results.length > 0 ? 'loaded' : 'empty'}`}
          data={hasSearched ? results : []}
          renderItem={activeView === 'grid' ? renderResultGrid : renderResultList}
          keyExtractor={item => String(item.id)}
          extraData={`${activeView}_${isLoadingMore}_${isSearching}`}
          style={s.list}
          contentContainerStyle={s.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeaderComp}
          ListEmptyComponent={ListEmptyComp}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onScroll={e => {
            const {contentOffset, contentSize, layoutMeasurement} = e.nativeEvent;
            const distanceFromEnd = contentSize.height - layoutMeasurement.height - contentOffset.y;
            // Manual end-reach fallback: VirtualizedList skips onEndReached
            // when its internal render window is stale, so drive the same
            // guarded loadMore from the raw scroll metrics instead.
            if (distanceFromEnd <= layoutMeasurement.height * 0.5) {
              loadMore();
            }
          }}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={s.loadMoreSpinner}>
                <ActivityIndicator size="small" color={C.oceanMid} />
              </View>
            ) : null
          }
        />
      )}
      {guestModal}
      {connectivityModal}
    </View>
  );
};

// ─── Shared shimmer hook ────────────────────────────────────────────────────────

const useShimmer = () => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {toValue: 1, duration: 800, useNativeDriver: true}),
        Animated.timing(anim, {toValue: 0, duration: 800, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return anim.interpolate({inputRange: [0, 1], outputRange: [0.3, 0.75]});
};

// ── Grid skeleton ──────────────────────────────────────────────────────────────

const SkeletonGridItem = ({opacity}) => (
  <Animated.View style={[s.skeletonCard, {opacity}]}>
    <View style={s.skeletonImage} />
    <View style={s.skeletonInfo}>
      <View style={s.skeletonTitleLine} />
      <View style={s.skeletonMetaLine} />
      <View style={s.skeletonMetaShort} />
    </View>
  </Animated.View>
);

const SkeletonCards = () => {
  const opacity = useShimmer();
  return (
    <View style={{paddingHorizontal: 16, paddingTop: 12}}>
      {[0, 1, 2, 3, 4, 5].map(i => <SkeletonGridItem key={i} opacity={opacity} />)}
    </View>
  );
};

// ── List skeleton ──────────────────────────────────────────────────────────────

const SkeletonListItem = ({opacity}) => (
  <Animated.View style={[s.skeletonListRow, {opacity}]}>
    <View style={s.skeletonThumb} />
    <View style={s.skeletonListContent}>
      <View style={s.skeletonListTitle} />
      <View style={s.skeletonListMeta} />
    </View>
    <View style={{width: 16, height: 16, borderRadius: 8, backgroundColor: '#E4F2F4'}} />
  </Animated.View>
);

const SkeletonListCards = () => {
  const opacity = useShimmer();
  return (
    <View style={{paddingHorizontal: 16, paddingTop: 12}}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <SkeletonListItem key={i} opacity={opacity} />)}
    </View>
  );
};

// ── Map skeleton ───────────────────────────────────────────────────────────────

const SkeletonMapView = () => {
  const {t: tSkel} = useTranslation();
  const opacity = useShimmer();
  return (
    <Animated.View style={[s.skeletonMapBg, {opacity}]}>
      <Text style={s.skeletonMapIcon}>🛰️</Text>
      <ActivityIndicator size="large" color={C.oceanMid} />
      <Text style={s.skeletonMapText}>{tSkel('SEARCH_SCREEN.MAP_LOADING')}</Text>
    </Animated.View>
  );
};

// ─── Redux ─────────────────────────────────────────────────────────────────────

const mapStateToProps = () => ({});
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(CityPlaceSearch);
