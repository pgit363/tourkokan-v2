/**
 * ProductCard — category-aware marketplace card.
 *
 * One component, four layouts keyed on the product's booking_type
 * (see cardStyleFor): stays/experiences lead with the photo and overlay the
 * price; produce shows stock; food/services use a compact horizontal row.
 */
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import CachedImage from '../Customs/CachedImage';
import {
  productCoverUri,
  productPrice,
  unitSuffix,
  localised,
  cardStyleFor,
} from '../../Services/marketplace';
import {C, RADIUS} from './theme';
import CategoryArt from '../Common/CategoryArt';

const money = n => (n == null ? '' : '₹' + Number(n).toLocaleString('en-IN'));

const Rating = ({value, light}) =>
  value ? (
    <View style={s.rateRow}>
      <Ionicons name="star" size={11} color={light ? '#F1C766' : C.sandMid} />
      <Text style={[s.rateTxt, light && {color: '#fff'}]}>
        {Number(value).toFixed(1)}
      </Text>
    </View>
  ) : null;

const ProductCard = ({product, onPress}) => {
  const {i18n} = useTranslation();
  const lang = i18n.language;

  const style = cardStyleFor(product);
  const name = localised(product, 'name', lang);
  const price = productPrice(product);
  const unit = unitSuffix(product.unit);
  const cover = productCoverUri(product);
  const bookingType = product.product_category?.booking_type;
  const catName = localised(product.product_category, 'name', lang);
  const siteName = product.site?.name;
  const rating = product.rating_avg_rate;
  const horizontal = style === 'food' || style === 'service';

  const press = () => onPress?.(product);

  // ── Horizontal (food / service) ─────────────────────────────────────────────
  if (horizontal) {
    return (
      <TouchableOpacity style={s.hCard} activeOpacity={0.85} onPress={press}>
        {cover ? (
          <CachedImage source={{uri: cover}} style={s.hImg} resizeMode="cover" />
        ) : (
          <CategoryArt bookingType={bookingType} style={s.hImg} />
        )}
        <View style={s.hBody}>
          <Text style={[s.eyebrow, {color: C.sandMid}]} numberOfLines={1}>
            {catName}
          </Text>
          <Text style={s.name} numberOfLines={2}>
            {name}
          </Text>
          {!!siteName && (
            <Text style={s.sub} numberOfLines={1}>
              {siteName}
            </Text>
          )}
          <View style={s.hFoot}>
            <Text style={[s.price, {color: C.forestMid}]}>
              {money(price)} {!!unit && <Text style={s.unit}>{unit}</Text>}
            </Text>
            <Rating value={rating} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Vertical image-led (stay / experience / produce) ────────────────────────
  const overlayPrice = style === 'stay' || style === 'experience';
  const imgH = style === 'experience' ? 168 : style === 'produce' ? 120 : 140;

  return (
    <TouchableOpacity style={s.vCard} activeOpacity={0.85} onPress={press}>
      <View style={[s.media, {height: imgH}]}>
        {cover ? (
          <CachedImage source={{uri: cover}} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <CategoryArt bookingType={bookingType} style={StyleSheet.absoluteFill} />
        )}

        {!!rating && (
          <View style={s.ratePill}>
            <Ionicons name="star" size={10} color="#F1C766" />
            <Text style={s.ratePillTxt}>{Number(rating).toFixed(1)}</Text>
          </View>
        )}

        {style === 'produce' && (
          <View style={s.stock}>
            <Text style={s.stockTxt}>In stock</Text>
          </View>
        )}

        {overlayPrice && (
          <View style={s.scrim}>
            <Text style={s.overlayPrice}>
              {money(price)} {!!unit && <Text style={s.overlayUnit}>{unit}</Text>}
            </Text>
          </View>
        )}
      </View>

      <View style={s.vBody}>
        <Text
          style={[
            s.eyebrow,
            {color: style === 'produce' ? C.forestMid : C.oceanMid},
          ]}
          numberOfLines={1}>
          {catName}
        </Text>
        <Text style={s.name} numberOfLines={2}>
          {name}
        </Text>
        {!overlayPrice ? (
          <View style={s.vFoot}>
            <Text style={[s.price, {color: C.oceanMid}]}>
              {money(price)} {!!unit && <Text style={s.unit}>{unit}</Text>}
            </Text>
            {!!siteName && (
              <Text style={s.sub} numberOfLines={1}>
                {siteName}
              </Text>
            )}
          </View>
        ) : (
          !!siteName && (
            <Text style={s.sub} numberOfLines={1}>
              {siteName}
            </Text>
          )
        )}
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  // vertical
  vCard: {
    backgroundColor: C.white,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },
  media: {width: '100%', backgroundColor: '#e8f5f7', position: 'relative'},
  vBody: {padding: 12},
  vFoot: {marginTop: 6},
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 11,
  },
  overlayPrice: {color: '#fff', fontSize: 17, fontWeight: '800'},
  overlayUnit: {color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600'},
  ratePill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(12,20,22,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  ratePillTxt: {color: '#fff', fontSize: 10.5, fontWeight: '800'},
  stock: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  stockTxt: {color: C.forestMid, fontSize: 10, fontWeight: '800'},

  // horizontal
  hCard: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },
  hImg: {width: 104, height: '100%', minHeight: 104, backgroundColor: '#e8f5f7'},
  hBody: {flex: 1, padding: 11},
  hFoot: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // shared text
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  name: {
    fontSize: 14.5,
    fontWeight: '800',
    color: C.textDark,
    marginTop: 3,
    lineHeight: 18,
  },
  sub: {fontSize: 11, color: C.textLight, marginTop: 3},
  price: {fontSize: 15, fontWeight: '800'},
  unit: {fontSize: 11, color: C.textLight, fontWeight: '600'},
  rateRow: {flexDirection: 'row', alignItems: 'center', gap: 3},
  rateTxt: {fontSize: 12, fontWeight: '700', color: C.textMid},
});

export default ProductCard;
