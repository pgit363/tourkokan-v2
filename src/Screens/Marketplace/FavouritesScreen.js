/**
 * Marketplace · Saved — listFavourites. Each row carries the product under
 * `favouritable`; a row with `unavailable: true` (product no longer live) is
 * rendered as a tombstone instead of a card.
 */
import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import ProductCard from '../../Components/Marketplace/ProductCard';
import MarketHeader from '../../Components/Marketplace/MarketHeader';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import {listFavourites} from '../../Services/Api/MarketplaceServices';
import {navigateTo} from '../../Services/CommonMethods';

const FavouritesScreen = ({navigation}) => {
  useMarketBack(navigation);
  const {t} = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listFavourites({}, navigation);
    if (res?.data?.success) setRows(res.data.data?.data ?? res.data.data ?? []);
    else setRows([]);
    setLoading(false);
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openProduct = product =>
    navigateTo(navigation, t('SCREEN.PRODUCT_DETAIL'), {id: product.id});

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <MarketHeader navigation={navigation} title={t('MARKETPLACE.SAVED')} />

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} color={C.oceanMid} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, i) => `${item.id ?? item.favouritable?.id ?? i}_${i}`}
          contentContainerStyle={s.list}
          renderItem={({item}) => {
            const product = item.favouritable || (item.id ? item : null);
            if (item.unavailable || !product) {
              return (
                <View style={s.gone}>
                  <Ionicons name="heart-dislike-outline" size={18} color={C.textLight} />
                  <Text style={s.goneTxt}>{t('MARKETPLACE.LISTING_UNAVAILABLE')}</Text>
                </View>
              );
            }
            return <ProductCard product={product} onPress={openProduct} />;
          }}
          ItemSeparatorComponent={() => <View style={{height: 13}} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>💛</Text>
              <Text style={s.emptyTxt}>{t('MARKETPLACE.NO_SAVED')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  list: {padding: 15},
  gone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    padding: 14,
    opacity: 0.7,
  },
  goneTxt: {fontSize: 12, fontWeight: '600', color: C.textLight},
  empty: {alignItems: 'center', paddingTop: 70},
  emptyIcon: {fontSize: 40, marginBottom: 12},
  emptyTxt: {fontSize: 14, fontWeight: '700', color: C.textLight},
});

export default FavouritesScreen;
