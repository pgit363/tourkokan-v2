/**
 * Marketplace · Browse — listProducts feed with search + category grouping.
 *
 * Category chips group by the design's card families (booking_type); search is
 * server-side. Tapping a card opens ProductDetail.
 */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {SystemBars} from 'react-native-edge-to-edge';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import ProductCard from '../../Components/Marketplace/ProductCard';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import {cardStyleFor} from '../../Services/marketplace';
import {listProducts} from '../../Services/Api/MarketplaceServices';
import {navigateTo, backPage} from '../../Services/CommonMethods';

const GROUPS = [
  {key: 'all', tkey: 'ALL'},
  {key: 'stay', tkey: 'GROUP_STAYS'},
  {key: 'food', tkey: 'GROUP_FOOD'},
  {key: 'experience', tkey: 'GROUP_EXPERIENCES'},
  {key: 'produce', tkey: 'GROUP_SHOP'},
  {key: 'service', tkey: 'GROUP_SERVICES'},
];

const BrowseScreen = ({navigation}) => {
  useMarketBack(navigation);
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const debounce = useRef(null);

  const fetch = useCallback(
    async (pageArg = 1, searchArg = '', append = false) => {
      if (!append) setLoading(true);
      const res = await listProducts(
        {search: searchArg || undefined, page: pageArg, per_page: 15},
        navigation,
      );
      const body = res?.data;
      if (body?.success) {
        const rows = body.data?.data ?? [];
        setProducts(prev => (append ? [...prev, ...rows] : rows));
        setPage(body.data?.current_page ?? pageArg);
        setLastPage(body.data?.last_page ?? pageArg);
      } else if (!append) {
        setProducts([]);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [navigation],
  );

  useEffect(() => {
    fetch(1, '');
  }, [fetch]);

  // debounced search
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetch(1, search), 400);
    return () => debounce.current && clearTimeout(debounce.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetch(1, search);
  };

  const loadMore = () => {
    if (!loading && page < lastPage) fetch(page + 1, search, true);
  };

  const openProduct = product =>
    navigateTo(navigation, t('SCREEN.PRODUCT_DETAIL'), {id: product.id});

  const visible =
    group === 'all'
      ? products
      : products.filter(p => cardStyleFor(p) === group);

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <LinearGradient
        colors={[C.oceanDeep, '#1A3320']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <View style={s.hTop}>
          <TouchableOpacity
            onPress={() => backPage(navigation)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.hTitle}>{t('MARKETPLACE.EXPLORE_KOKAN')}</Text>
          <TouchableOpacity
            onPress={() => navigateTo(navigation, t('SCREEN.MARKET_FAVOURITES'))}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="heart-outline" size={23} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.search}>
          <Ionicons name="search" size={18} color={C.oceanMid} />
          <TextInput
            style={s.searchInput}
            placeholder={t('MARKETPLACE.SEARCH_PH')}
            placeholderTextColor={C.textLight}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={C.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <FlatList
        data={GROUPS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={g => g.key}
        style={s.chipsRow}
        contentContainerStyle={s.chipsContent}
        renderItem={({item}) => {
          const on = group === item.key;
          return (
            <TouchableOpacity
              style={[s.chip, on && s.chipOn]}
              onPress={() => setGroup(item.key)}
              activeOpacity={0.8}>
              <Text style={[s.chipTxt, on && s.chipTxtOn]}>{t('MARKETPLACE.' + item.tkey)}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading && products.length === 0 ? (
        <ActivityIndicator style={{marginTop: 40}} color={C.oceanMid} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item, i) => `${item.id}_${i}`}
          contentContainerStyle={s.feed}
          renderItem={({item}) => (
            <ProductCard product={item} onPress={openProduct} />
          )}
          ItemSeparatorComponent={() => <View style={{height: 13}} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            loading && products.length > 0 ? (
              <ActivityIndicator style={{paddingVertical: 16}} color={C.oceanMid} />
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyTxt}>{t('MARKETPLACE.NO_PRODUCTS')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  header: {paddingHorizontal: 15, paddingBottom: 14},
  hTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  hTitle: {color: '#fff', fontSize: 19, fontWeight: '800', letterSpacing: -0.3},
  search: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 11,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 9,
  },
  searchInput: {flex: 1, fontSize: 13.5, color: C.textDark, padding: 0},
  chipsRow: {maxHeight: 52, flexGrow: 0},
  chipsContent: {paddingHorizontal: 15, paddingVertical: 10, gap: 7},
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
  },
  chipOn: {backgroundColor: C.oceanMid, borderColor: C.oceanMid},
  chipTxt: {fontSize: 12.5, fontWeight: '600', color: C.textMid},
  chipTxtOn: {color: '#fff'},
  feed: {paddingHorizontal: 15, paddingTop: 4, paddingBottom: 24},
  empty: {alignItems: 'center', paddingTop: 70},
  emptyIcon: {fontSize: 40, marginBottom: 12},
  emptyTxt: {fontSize: 14, fontWeight: '700', color: C.textLight},
});

export default BrowseScreen;
