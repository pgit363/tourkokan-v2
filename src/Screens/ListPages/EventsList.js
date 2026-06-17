import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Animated,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NetInfo from '@react-native-community/netinfo';
import {AWS_URL} from '@env';
import CachedImage from '../../Components/Customs/CachedImage';
import {useTranslation} from 'react-i18next';
import {backPage} from '../../Services/CommonMethods';
import {comnPost} from '../../Services/Api/CommonServices';
import {useConnectivityGate} from '../../Components/Common/useConnectivityGate';
import ImagePlaceholder from '../../Components/Common/ImagePlaceholder';
import STRING from '../../Services/Constants/STRINGS';
import {createLogger} from '../../Services/Logger';
import {useResponsive} from '../../Services/responsive';

const log = createLogger('EventsList');

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  forestDeep: '#1A3320',
  oceanFoam: '#B8E4EA',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
};

const TALUKAS = ['Devgad','Kudal','Malvan','Sawantwadi','Vengurla','Dodamarg','Kankavli','Vaibhavvadi'];

const EMPTY_FILTERS = {
  taluka: null,
  is_free: false,
  is_featured: false,
  upcoming: false,
  start_date: null,
  end_date: null,
};

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEK_DAYS    = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Date helpers ─────────────────────────────────────────────────────────────

const todayObj   = () => { const n = new Date(); return {year: n.getFullYear(), month: n.getMonth(), day: n.getDate()}; };
const daysInMon  = (y, m) => new Date(y, m + 1, 0).getDate();
const firstDay   = (y, m) => new Date(y, m, 1).getDay();
const objToStr   = d => d ? `${d.year}-${String(d.month + 1).padStart(2,'0')}-${String(d.day).padStart(2,'0')}` : null;
const strToObj   = s => { if (!s) return null; const [y,m,d] = s.split('-').map(Number); return {year: y, month: m - 1, day: d}; };
const strToDisp  = s => { if (!s) return null; const [y,m,d] = s.split('-'); return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m)-1]} ${y}`; };

// ─── Shimmer ──────────────────────────────────────────────────────────────────

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
  return anim.interpolate({inputRange: [0, 1], outputRange: [0.35, 0.82]});
};

const SkeletonCard = ({opacity}) => (
  <Animated.View style={[sk.card, {opacity}]}>
    <View style={sk.img} />
    <View style={sk.body}>
      <View style={sk.line} />
      <View style={sk.lineSm} />
      <View style={sk.statsRow}>
        <View style={sk.stat} /><View style={sk.stat} /><View style={sk.stat} />
      </View>
    </View>
  </Animated.View>
);
const SkeletonList = () => {
  const opacity = useShimmer();
  return <>{Array.from({length: 4}).map((_, i) => <SkeletonCard key={i} opacity={opacity} />)}</>;
};
const sk = StyleSheet.create({
  card: {backgroundColor: C.white, borderRadius: 18, marginHorizontal: 16, marginBottom: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)'},
  img: {width: '100%', height: 140, backgroundColor: '#E5E7EB'},
  body: {padding: 14, gap: 8},
  line: {height: 16, width: '75%', backgroundColor: '#E5E7EB', borderRadius: 7},
  lineSm: {height: 12, width: '50%', backgroundColor: '#F3F4F6', borderRadius: 6},
  statsRow: {flexDirection: 'row', gap: 8, marginTop: 4},
  stat: {flex: 1, height: 12, backgroundColor: '#F3F4F6', borderRadius: 6},
});

// ─── Inline Calendar picker (for filter sheet) ────────────────────────────────

const CalendarView = ({value, minValue, onConfirm, onCancel, cancelLabel, doneLabel}) => {
  const init = value ?? todayObj();
  const [year,  setYear]  = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [day,   setDay]   = useState(init.day);
  const total = daysInMon(year, month);
  const fDay  = firstDay(year, month);
  const isDisabled = d => {
    if (!minValue) return false;
    if (year !== minValue.year) return year < minValue.year;
    if (month !== minValue.month) return month < minValue.month;
    return d < minValue.day;
  };
  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); setDay(1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); setDay(1); };
  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < fDay; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [fDay, total]);
  const CELL = 40;
  return (
    <View>
      <View style={cal.nav}>
        <TouchableOpacity style={cal.navBtn} onPress={prev}><Ionicons name="chevron-back" size={20} color={C.oceanMid} /></TouchableOpacity>
        <Text style={cal.navLabel}>{MONTHS_FULL[month]} {year}</Text>
        <TouchableOpacity style={cal.navBtn} onPress={next}><Ionicons name="chevron-forward" size={20} color={C.oceanMid} /></TouchableOpacity>
      </View>
      <View style={cal.weekRow}>{WEEK_DAYS.map(d => <Text key={d} style={[cal.weekDay, {width: CELL}]}>{d}</Text>)}</View>
      <View style={cal.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`e-${i}`} style={{width: CELL, height: CELL}} />;
          const disabled = isDisabled(d);
          const selected = d === day;
          return (
            <TouchableOpacity key={d}
              style={[{width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center', borderRadius: CELL/2},
                selected && {backgroundColor: C.oceanMid}, disabled && {opacity: 0.3}]}
              onPress={() => !disabled && setDay(d)} activeOpacity={disabled ? 1 : 0.7}>
              <Text style={{fontSize: 14, color: selected ? C.white : C.textDark, fontWeight: selected ? '700' : '500'}}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={cal.footer}>
        <TouchableOpacity style={cal.cancelBtn} onPress={onCancel}><Text style={cal.cancelText}>{cancelLabel}</Text></TouchableOpacity>
        <TouchableOpacity style={cal.confirmBtn} onPress={() => onConfirm({year, month, day: Math.min(day, total)})}>
          <Text style={cal.confirmText}>{doneLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const cal = StyleSheet.create({
  nav: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12},
  navBtn: {width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(27,107,123,0.1)', alignItems: 'center', justifyContent: 'center'},
  navLabel: {fontSize: 15, fontWeight: '700', color: C.textDark},
  weekRow: {flexDirection: 'row', paddingHorizontal: 8, marginBottom: 2},
  weekDay: {textAlign: 'center', fontSize: 11, fontWeight: '600', color: C.textLight},
  grid: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8},
  footer: {flexDirection: 'row', gap: 10, padding: 16},
  cancelBtn: {flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center'},
  confirmBtn: {flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: C.oceanMid, alignItems: 'center'},
  cancelText: {fontSize: 14, fontWeight: '600', color: C.textMid},
  confirmText: {fontSize: 14, fontWeight: '700', color: C.white},
});

// ─── Event Card ───────────────────────────────────────────────────────────────

const EventCard = ({item, onPress}) => {
  // Tablet: moderate bump for the card's fixed-px text.
  const {isTablet, ms} = useResponsive();
  const {t} = useTranslation();
  const formatDate = iso => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
  };
  const imgUri = item.banner_image_url
    || (item.banner_image ? `${AWS_URL}${item.banner_image}` : null)
    || (item.image ? `${AWS_URL}${item.image}` : null);
  log.debug('[EventsList img]', item.name, imgUri);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      {imgUri ? (
        <CachedImage
          source={{uri: imgUri}}
          style={[s.cardImage, isTablet && {height: 280}]}
          resizeMode="cover"
        />
      ) : (
        <ImagePlaceholder
          style={[s.cardImage, isTablet && {height: 280}]}
          icon="calendar-outline"
          iconSize={isTablet ? 52 : 40}
        />
      )}
      {item.is_featured && (
        <View style={s.featuredPill}>
          <Ionicons name="star" size={10} color="#92400E" />
          <Text style={s.featuredText}>{t('EVENTS_LIST.FEATURED')}</Text>
        </View>
      )}
      <View style={s.datePill}>
        <Ionicons name="calendar-outline" size={11} color={C.oceanMid} />
        <Text style={s.datePillText}>
          {formatDate(item.start_date)}
          {item.end_date && item.end_date !== item.start_date ? ` – ${formatDate(item.end_date)}` : ''}
        </Text>
      </View>
      <View style={s.cardBody}>
        <Text style={[s.cardTitle, isTablet && {fontSize: ms(15), lineHeight: ms(21)}]} numberOfLines={2}>{item.title}</Text>
        {item.taluka ? (
          <View style={s.locationRow}>
            <Ionicons name="location-outline" size={13} color={C.textLight} />
            <Text style={[s.locationText, isTablet && {fontSize: ms(12)}]} numberOfLines={1}>{item.taluka}</Text>
          </View>
        ) : null}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Ionicons name="heart-outline" size={13} color={C.oceanMid} />
            <Text style={[s.statText, isTablet && {fontSize: ms(11)}]}>{item.like_count ?? 0}</Text>
          </View>
          <View style={s.stat}>
            <Ionicons name="checkmark-circle-outline" size={13} color={C.oceanMid} />
            <Text style={[s.statText, isTablet && {fontSize: ms(11)}]}>{item.going_count ?? 0} {t('EVENTS_LIST.GOING')}</Text>
          </View>
          <View style={s.stat}>
            <Ionicons name="star-outline" size={13} color={C.oceanMid} />
            <Text style={[s.statText, isTablet && {fontSize: ms(11)}]}>{item.interested_count ?? 0} {t('EVENTS_LIST.INTERESTED')}</Text>
          </View>
          {item.is_free && (
            <View style={s.freePill}>
              <Text style={s.freePillText}>{t('EVENTS_LIST.FREE')}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── EventsList ───────────────────────────────────────────────────────────────

const EventsList = ({navigation, route}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {isTablet} = useResponsive();
  const siteId   = route?.params?.site_id ?? null;
  const isTab    = !siteId;

  const [events,      setEvents]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offline,     setOffline]     = useState(false);
  const {modal: connectivityModal, ensureOnline} = useConnectivityGate();

  // ── Search + filter state ──
  const [search,         setSearch]         = useState('');
  const [filters,        setFilters]        = useState(EMPTY_FILTERS);
  const [filterVisible,  setFilterVisible]  = useState(false);
  // pending = what's shown inside the sheet before Apply
  const [pending,        setPending]        = useState(EMPTY_FILTERS);
  // 'filters' | 'start_picker' | 'end_picker'
  const [sheetMode,      setSheetMode]      = useState('filters');

  const pageRef         = useRef(1);
  const lastPageRef     = useRef(null);
  const loadingMoreRef  = useRef(false);
  const initialFetch    = useRef(false);
  const searchTimer     = useRef(null);
  const fetchIdRef      = useRef(0);

  // ── Back handler ──
  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (isTab) {
          // On the events tab — go home instead of exiting
          navigation.navigate('HomeTab');
          return true;
        }
        navigation.goBack();
        return true;
      });
      return () => handler.remove();
    }, [isTab, navigation]),
  );

  // ── Connectivity ──
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => setOffline(!state.isConnected));
    return () => unsub();
  }, []);

  // ── Fetch ──
  const fetchEvents = useCallback((p = 1, q = search, f = filters, isRefresh = false) => {
    if (offline) return;
    if (p === 1) {
      isRefresh ? setRefreshing(true) : setLoading(true);
      pageRef.current = 1;
      lastPageRef.current = null;
      loadingMoreRef.current = false;
    } else {
      if (loadingMoreRef.current) return;
      if (lastPageRef.current !== null && pageRef.current >= lastPageRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    }

    const payload = {per_page: 15, page: p};
    if (siteId)       payload.site_id    = siteId;
    if (q.trim())     payload.search     = q.trim();
    if (f.taluka)     payload.taluka     = f.taluka;
    if (f.is_free)     payload.is_free     = true;
    if (f.is_featured) payload.is_featured = true;
    if (f.upcoming)    payload.upcoming    = true;
    if (f.start_date) payload.start_date = f.start_date;
    if (f.end_date)   payload.end_date   = f.end_date;

    const myId = ++fetchIdRef.current;
    log.debug('[EventsList] POST v2/listEvents', payload);
    comnPost('v2/listEvents', payload)
      .then(res => {
        if (fetchIdRef.current !== myId) return;
        const data  = res?.data?.data;
        const items = data?.data ?? [];
        const cur   = data?.current_page ?? p;
        const last  = data?.last_page ?? p;
        setEvents(prev => p === 1 ? items : [...prev, ...items]);
        pageRef.current  = cur;
        lastPageRef.current = last;
        setLoading(false);
        setRefreshing(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
      })
      .catch(() => {
        if (fetchIdRef.current !== myId) return;
        setLoading(false);
        setRefreshing(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, offline]);

  useFocusEffect(
    useCallback(() => {
      if (isTab || !initialFetch.current) {
        initialFetch.current = true;
        // Offline mode (with internet available) → prompt to go online.
        ensureOnline(() => fetchEvents(1, search, filters));
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchEvents, ensureOnline, isTab]),
  );

  // ── Search debounce ──
  const handleSearchChange = text => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setEvents([]);
      fetchEvents(1, text, filters);
    }, 500);
  };

  const clearSearch = () => {
    setSearch('');
    setEvents([]);
    fetchEvents(1, '', filters);
  };

  // ── Filter actions ──
  const openFilter = () => { setPending(filters); setSheetMode('filters'); setFilterVisible(true); };
  const closeFilter = () => setFilterVisible(false);

  const applyFilters = () => {
    setFilters(pending);
    setFilterVisible(false);
    setEvents([]);
    fetchEvents(1, search, pending);
  };

  const clearFilters = () => {
    setPending(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setFilterVisible(false);
    setEvents([]);
    fetchEvents(1, search, EMPTY_FILTERS);
  };

  const removeChip = key => {
    const boolKeys = ['is_free', 'is_featured', 'upcoming'];
    const next = {...filters, [key]: boolKeys.includes(key) ? false : null};
    setFilters(next);
    setEvents([]);
    fetchEvents(1, search, next);
  };

  const onRefresh = () => ensureOnline(() => fetchEvents(1, search, filters, true));
  const onEndReached = () => {
    if (!loadingMoreRef.current && lastPageRef.current && pageRef.current < lastPageRef.current) {
      ensureOnline(() => fetchEvents(pageRef.current + 1, search, filters));
    }
  };

  // ── Derived ──
  const filterCount = [
    filters.taluka, filters.is_free, filters.is_featured, filters.upcoming,
    filters.start_date, filters.end_date,
  ].filter(Boolean).length;

  const activeChips = [
    filters.taluka      && {key: 'taluka',      label: filters.taluka},
    filters.is_free     && {key: 'is_free',     label: t('EVENTS_LIST.FREE_ONLY')},
    filters.is_featured && {key: 'is_featured', label: t('EVENTS_LIST.FEATURED')},
    filters.upcoming    && {key: 'upcoming',    label: t('EVENTS_LIST.UPCOMING')},
    filters.start_date  && {key: 'start_date',  label: `${t('EVENTS_LIST.FROM')} ${strToDisp(filters.start_date)}`},
    filters.end_date    && {key: 'end_date',     label: `${t('EVENTS_LIST.TO')} ${strToDisp(filters.end_date)}`},
  ].filter(Boolean);

  // ─── Render ───────────────────────────────────────────────────────────────

  const renderItem = ({item}) => (
    <EventCard
      item={item}
      onPress={() => navigation.navigate(STRING.SCREEN.EVENT_DETAIL, {event: item})}
    />
  );

  const renderEmpty = () => (
    <View style={s.emptyWrap}>
      <Text style={s.emptyIcon}>🎉</Text>
      <Text style={s.emptyTitle}>{t('EVENTS_LIST.EMPTY_TITLE')}</Text>
      <Text style={s.emptyText}>
        {filterCount > 0 || search ? t('EVENTS_LIST.EMPTY_FILTER') : t('EVENTS_LIST.EMPTY_DEFAULT')}
      </Text>
      {(filterCount > 0 || search) && (
        <TouchableOpacity style={s.clearFiltersBtn} onPress={() => { setSearch(''); clearFilters(); }} activeOpacity={0.8}>
          <Text style={s.clearFiltersBtnText}>{t('EVENTS_LIST.CLEAR_FILTERS')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.iconBtn} onPress={() => backPage(navigation)} activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={s.headerTitle}>{t('EVENTS_LIST.TITLE')}</Text>
            {!loading && events.length > 0 && (
              <Text style={s.headerSub}>{events.length} {t('EVENTS_LIST.UPCOMING')}</Text>
            )}
          </View>
          {isTab && (
            <TouchableOpacity style={[s.filterBtn, filterCount > 0 && s.filterBtnActive]} onPress={openFilter} activeOpacity={0.85}>
              <Ionicons name="options-outline" size={18} color={filterCount > 0 ? C.oceanDeep : C.white} />
              {filterCount > 0 && (
                <View style={s.filterBadge}>
                  <Text style={s.filterBadgeText}>{filterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar — tab only */}
        {isTab && (
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={16} color={C.textLight} style={{marginLeft: 12}} />
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={handleSearchChange}
              placeholder={t('EVENTS_LIST.SEARCH_PLACEHOLDER')}
              placeholderTextColor={C.textLight}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}} style={{marginRight: 10}}>
                <Ionicons name="close-circle" size={16} color={C.textLight} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {/* Active filter chips */}
      {isTab && activeChips.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.chipsScroll} contentContainerStyle={s.chipsContent}>
          {activeChips.map(chip => (
            <TouchableOpacity key={chip.key} style={s.chip} onPress={() => removeChip(chip.key)} activeOpacity={0.8}>
              <Text style={s.chipText}>{chip.label}</Text>
              <Ionicons name="close" size={12} color={C.oceanMid} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Offline banner */}
      {offline && (
        <View style={s.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={C.white} />
          <Text style={s.offlineText}>{t('EVENTS_LIST.OFFLINE')}</Text>
        </View>
      )}

      {/* List */}
      {loading ? (
        <FlatList style={s.list} contentContainerStyle={s.listContent}
          data={[]} renderItem={null}
          ListHeaderComponent={<SkeletonList />}
          showsVerticalScrollIndicator={false} />
      ) : (
        <FlatList
          style={s.list}
          contentContainerStyle={[s.listContent, events.length === 0 && s.emptyContainer]}
          data={events}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.oceanMid]} tintColor={C.oceanMid} />}
          ListFooterComponent={
            <>
              {loadingMore && (
                <ActivityIndicator color={C.oceanMid} style={{marginVertical: 16}} />
              )}
              <View style={{height: insets.bottom + (isTablet ? 150 : 100)}} />
            </>
          }
        />
      )}

      {/* ── Filter bottom sheet ── */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={closeFilter}>
        <TouchableOpacity style={fs.backdrop} activeOpacity={1} onPress={() => {
          if (sheetMode !== 'filters') { setSheetMode('filters'); }
          else { closeFilter(); }
        }} />
        <View style={fs.sheet}>

          {sheetMode === 'filters' && (
            <>
              {/* Sheet header */}
              <View style={fs.header}>
                <Text style={fs.title}>{t('EVENTS_LIST.FILTERS')}</Text>
                <TouchableOpacity onPress={closeFilter} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Ionicons name="close" size={22} color={C.textMid} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 16}}>

                {/* Taluka */}
                <Text style={fs.sectionLabel}>{t('EVENTS_LIST.TALUKA')}</Text>
                <View style={fs.talukaGrid}>
                  {[t('EVENTS_LIST.ANY'), ...TALUKAS].map(tl => {
                    const val = tl === t('EVENTS_LIST.ANY') ? null : tl;
                    const active = pending.taluka === val;
                    return (
                      <TouchableOpacity
                        key={tl}
                        style={[fs.talukaChip, active && fs.talukaChipActive]}
                        onPress={() => setPending(p => ({...p, taluka: val}))}
                        activeOpacity={0.8}>
                        <Text style={[fs.talukaText, active && fs.talukaTextActive]}>{tl}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Free only */}
                <View style={fs.toggleRow}>
                  <View style={fs.toggleLabel}>
                    <Ionicons name="ticket-outline" size={18} color={C.oceanMid} />
                    <Text style={fs.toggleText}>{t('EVENTS_LIST.FREE_EVENTS_ONLY')}</Text>
                  </View>
                  <Switch
                    value={!!pending.is_free}
                    onValueChange={v => setPending(p => ({...p, is_free: v}))}
                    trackColor={{false: '#D1D5DB', true: C.oceanFoam}}
                    thumbColor={pending.is_free ? C.oceanMid : C.white}
                  />
                </View>

                {/* Featured only */}
                <View style={fs.toggleRow}>
                  <View style={fs.toggleLabel}>
                    <Ionicons name="star-outline" size={18} color={C.oceanMid} />
                    <Text style={fs.toggleText}>{t('EVENTS_LIST.FEATURED_EVENTS_ONLY')}</Text>
                  </View>
                  <Switch
                    value={!!pending.is_featured}
                    onValueChange={v => setPending(p => ({...p, is_featured: v}))}
                    trackColor={{false: '#D1D5DB', true: C.oceanFoam}}
                    thumbColor={pending.is_featured ? C.oceanMid : C.white}
                  />
                </View>

                {/* Upcoming only */}
                <View style={fs.toggleRow}>
                  <View style={fs.toggleLabel}>
                    <Ionicons name="time-outline" size={18} color={C.oceanMid} />
                    <Text style={fs.toggleText}>{t('EVENTS_LIST.UPCOMING_EVENTS_ONLY')}</Text>
                  </View>
                  <Switch
                    value={!!pending.upcoming}
                    onValueChange={v => setPending(p => ({...p, upcoming: v}))}
                    trackColor={{false: '#D1D5DB', true: C.oceanFoam}}
                    thumbColor={pending.upcoming ? C.oceanMid : C.white}
                  />
                </View>

                {/* Date range */}
                <Text style={fs.sectionLabel}>{t('EVENTS_LIST.DATE_RANGE')}</Text>
                <View style={fs.dateRow}>
                  <TouchableOpacity
                    style={[fs.datePill, pending.start_date && fs.datePillActive]}
                    onPress={() => setSheetMode('start_picker')}
                    activeOpacity={0.8}>
                    <Ionicons name="calendar-outline" size={14} color={pending.start_date ? C.oceanMid : C.textLight} />
                    <Text style={[fs.datePillText, !pending.start_date && fs.datePillPlaceholder]}>
                      {strToDisp(pending.start_date) || t('EVENTS_LIST.FROM_DATE')}
                    </Text>
                    {pending.start_date && (
                      <TouchableOpacity onPress={() => setPending(p => ({...p, start_date: null}))}
                        hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                        <Ionicons name="close-circle" size={14} color={C.textLight} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[fs.datePill, pending.end_date && fs.datePillActive]}
                    onPress={() => setSheetMode('end_picker')}
                    activeOpacity={0.8}>
                    <Ionicons name="calendar-outline" size={14} color={pending.end_date ? C.oceanMid : C.textLight} />
                    <Text style={[fs.datePillText, !pending.end_date && fs.datePillPlaceholder]}>
                      {strToDisp(pending.end_date) || t('EVENTS_LIST.TO_DATE')}
                    </Text>
                    {pending.end_date && (
                      <TouchableOpacity onPress={() => setPending(p => ({...p, end_date: null}))}
                        hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                        <Ionicons name="close-circle" size={14} color={C.textLight} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Sheet footer */}
              <View style={fs.footer}>
                <TouchableOpacity style={fs.clearBtn} onPress={clearFilters} activeOpacity={0.8}>
                  <Text style={fs.clearBtnText}>{t('EVENTS_LIST.CLEAR_ALL')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={fs.applyBtn} onPress={applyFilters} activeOpacity={0.85}>
                  <Text style={fs.applyBtnText}>{t('EVENTS_LIST.APPLY')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Inline date pickers ── */}
          {(sheetMode === 'start_picker' || sheetMode === 'end_picker') && (
            <>
              <View style={fs.header}>
                <TouchableOpacity onPress={() => setSheetMode('filters')} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Ionicons name="arrow-back" size={20} color={C.textMid} />
                </TouchableOpacity>
                <Text style={fs.title}>{sheetMode === 'start_picker' ? t('EVENTS_LIST.FROM_DATE') : t('EVENTS_LIST.TO_DATE')}</Text>
                <View style={{width: 22}} />
              </View>
              <CalendarView
                value={strToObj(sheetMode === 'start_picker' ? pending.start_date : pending.end_date)}
                minValue={sheetMode === 'end_picker' ? strToObj(pending.start_date) : undefined}
                onConfirm={d => {
                  const str = objToStr(d);
                  if (sheetMode === 'start_picker') {
                    setPending(p => ({...p, start_date: str, end_date: p.end_date && p.end_date < str ? null : p.end_date}));
                  } else {
                    setPending(p => ({...p, end_date: str}));
                  }
                  setSheetMode('filters');
                }}
                onCancel={() => setSheetMode('filters')}
                cancelLabel={t('EVENTS_LIST.CANCEL')}
                doneLabel={t('EVENTS_LIST.DONE')}
              />
            </>
          )}

        </View>
      </Modal>
      {connectivityModal}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  header: {paddingHorizontal: 16, paddingBottom: 52, position: 'relative', overflow: 'hidden'},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  iconBtn: {width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center'},
  headerText: {flex: 1},
  headerTitle: {fontSize: 20, fontWeight: '700', color: C.white, letterSpacing: 0.2},
  headerSub: {fontSize: 12, color: C.oceanFoam, marginTop: 2},
  filterBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: {backgroundColor: C.white},
  filterBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: {fontSize: 10, fontWeight: '700', color: C.white},
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 12,
    marginTop: 12, height: 42,
  },
  searchInput: {flex: 1, fontSize: 14, color: C.textDark, paddingHorizontal: 10},
  headerCurve: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
    backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },

  // Active filter chips
  chipsScroll: {maxHeight: 44, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)'},
  chipsContent: {paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row'},
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(27,107,123,0.1)', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(27,107,123,0.2)',
  },
  chipText: {fontSize: 12, fontWeight: '600', color: C.oceanMid},

  offlineBanner: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#B91C1C', paddingVertical: 8},
  offlineText: {fontSize: 13, color: C.white, fontWeight: '600'},

  list: {flex: 1},
  listContent: {paddingTop: 8, paddingHorizontal: 16},
  emptyContainer: {flex: 1},

  // Card
  card: {backgroundColor: C.white, borderRadius: 18, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)'},
  cardImage: {width: '100%', height: 170, resizeMode: 'cover'},
  cardImageFallback: {width: '100%', height: 170, alignItems: 'center', justifyContent: 'center'},
  datePill: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  datePillText: {fontSize: 11, fontWeight: '600', color: C.oceanDeep},
  featuredPill: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FEF3C7', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  featuredText: {fontSize: 10, fontWeight: '700', color: '#92400E'},
  cardBody: {padding: 14, gap: 6},
  cardTitle: {fontSize: 15, fontWeight: '700', color: C.textDark, lineHeight: 21},
  locationRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  locationText: {fontSize: 12, color: C.textLight, flex: 1},
  statsRow: {flexDirection: 'row', gap: 12, marginTop: 4, alignItems: 'center', flexWrap: 'wrap'},
  stat: {flexDirection: 'row', alignItems: 'center', gap: 4},
  statText: {fontSize: 12, color: C.textMid},
  freePill: {backgroundColor: '#D1FAE5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2},
  freePillText: {fontSize: 10, fontWeight: '700', color: '#065F46'},

  // Empty
  emptyWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24},
  emptyIcon: {fontSize: 52, opacity: 0.4, marginBottom: 4},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: C.textMid},
  emptyText: {fontSize: 13, color: C.textLight, textAlign: 'center'},
  clearFiltersBtn: {marginTop: 4, backgroundColor: C.oceanMid, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9},
  clearFiltersBtnText: {fontSize: 13, fontWeight: '700', color: C.white},
});

// Filter sheet styles
const fs = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet: {backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)'},
  title: {fontSize: 17, fontWeight: '700', color: C.textDark},
  sectionLabel: {fontSize: 12, fontWeight: '600', color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 18, marginBottom: 10, marginHorizontal: 20},
  talukaGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20},
  talukaChip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: C.cream},
  talukaChipActive: {backgroundColor: C.oceanMid, borderColor: C.oceanMid},
  talukaText: {fontSize: 13, fontWeight: '600', color: C.textMid},
  talukaTextActive: {color: C.white},
  toggleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)'},
  toggleLabel: {flexDirection: 'row', alignItems: 'center', gap: 10},
  toggleText: {fontSize: 15, color: C.textDark, fontWeight: '500'},
  dateRow: {flexDirection: 'row', gap: 10, paddingHorizontal: 20},
  datePill: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.cream, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 12, paddingVertical: 10},
  datePillActive: {borderColor: C.oceanMid},
  datePillText: {flex: 1, fontSize: 13, fontWeight: '500', color: C.textDark},
  datePillPlaceholder: {color: C.textLight, fontWeight: '400'},
  footer: {flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)'},
  clearBtn: {flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center'},
  clearBtnText: {fontSize: 14, fontWeight: '600', color: C.textMid},
  applyBtn: {flex: 2, paddingVertical: 13, borderRadius: 14, backgroundColor: C.oceanMid, alignItems: 'center'},
  applyBtnText: {fontSize: 14, fontWeight: '700', color: C.white},
});

export default EventsList;
