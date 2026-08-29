/**
 * Marketplace · Product detail — generic template, category-aware.
 *
 * Fixed scaffold (hero · price · attributes · vendor · contact bar); the
 * attribute block renders from the category's attribute_schema. Contact actions
 * fire recordProductLead before opening the dialler / WhatsApp / maps.
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SystemBars} from 'react-native-edge-to-edge';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import CachedImage from '../../Components/Customs/CachedImage';
import ReviewsSection from '../../Components/Marketplace/ReviewsSection';
import {C} from '../../Components/Marketplace/theme';
import {productTheme, tint, bookingMeta} from '../../Services/categoryTheme';
import {useDetailMetrics} from '../../Components/Detail/useDetailMetrics';
import {
  SectionHead, FactsGrid, Block, BlockText, PriceBar, BookingBox,
  VendorCard, GalleryGrid,
} from '../../Components/Detail/DetailKit';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import CategoryArt from '../../Components/Common/CategoryArt';
import {
  productCoverUri,
  productGallery,
  productPrice,
  unitSuffix,
  localised,
  mediaUri,
} from '../../Services/marketplace';
import {
  productDetail,
  recordProductView,
  recordProductLead,
  toggleProductFavourite,
} from '../../Services/Api/MarketplaceServices';
import {backPage, navigateTo} from '../../Services/CommonMethods';

const money = n => (n == null ? '' : '₹' + Number(n).toLocaleString('en-IN'));

/** Turn a schema field + value into a display row. */
const fmtAttr = (schema, key, value, t) => {
  const def = schema?.[key] || {};
  const label =
    def.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  let val = value;
  // The public productDetail response omits attribute_schema, so fall back to
  // the value's own shape — otherwise a boolean renders as the literal "true".
  const isBool =
    def.type === 'bool' ||
    typeof value === 'boolean' ||
    (typeof value === 'string' && /^(true|false)$/i.test(value));
  if (isBool) {
    const on = value === true || String(value).toLowerCase() === 'true';
    val = on ? t('MARKETPLACE.YES') : t('MARKETPLACE.NO');
  } else if (Array.isArray(value)) {
    val = value.join(', ');
  }
  return {label, value: String(val)};
};

const ProductDetailScreen = ({navigation, route}) => {
  useMarketBack(navigation);
  const {t, i18n} = useTranslation();
  const lang = i18n.language;
  const id = route.params?.id;
  const insets = useSafeAreaInsets();
  // Live responsive metrics — recomputed on rotation / fold / split-screen.
  const m = useDetailMetrics();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await productDetail({id}, navigation);
      if (!mounted) return;
      if (res?.data?.success) {
        setProduct(res.data.data);
        setFav(!!res.data.data?.is_favourite);
      }
      setLoading(false);
      recordProductView(id, navigation); // fire-and-forget
    })();
    return () => {
      mounted = false;
    };
  }, [id, navigation]);

  const onFav = async () => {
    setFav(v => !v);
    toggleProductFavourite(id, navigation);
  };

  const lead = async (type, action) => {
    recordProductLead(id, type, undefined, navigation); // before opening
    try {
      await Linking.openURL(action);
    } catch (e) {
      /* no handler for scheme */
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <SystemBars style="dark" />
        <ActivityIndicator color={C.oceanMid} />
      </View>
    );
  }
  if (!product) {
    return (
      <View style={s.center}>
        <SystemBars style="dark" />
        <Text style={s.muted}>{t('MARKETPLACE.LISTING_UNAVAILABLE')}</Text>
        <TouchableOpacity onPress={() => backPage(navigation)}>
          <Text style={s.back}>{t('MARKETPLACE.GO_BACK')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = localised(product, 'name', lang);
  const desc = localised(product, 'description', lang);
  const cat = product.product_category || {};
  // Product theme by booking_type (stay/experience/produce/menu) — kept separate
  // from site category themes.
  const pt = productTheme(cat.booking_type);
  // booking_type also decides the presentation: the pill, which attributes get
  // promoted into the booking box, and the CTA wording. v1 stays enquiry-only
  // (docs/app-api-integration.md) — nothing here starts a booking flow.
  const bm = bookingMeta(cat.booking_type);
  const catName = localised(cat, 'name', lang);
  const schema = cat.attribute_schema || {};
  const attrs = product.attributes || {};

  // Booking box — only keys that actually carry a value.
  const bookingItems = [];
  if (cat.booking_type === 'quantity') {
    const stock = product.default_variant?.stock;
    if (stock != null && stock !== '') {
      bookingItems.push({k: t('MARKETPLACE.STOCK'), v: String(stock)});
    }
  }
  bm.boxKeys.forEach(key => {
    if (attrs[key] == null || attrs[key] === '') return;
    const r = fmtAttr(schema, key, attrs[key], t);
    bookingItems.push({k: r.label, v: r.value});
  });
  const bookingBox = bookingItems.slice(0, 3);
  const promoted = new Set(bm.boxKeys);

  // Everything else becomes the attributes grid (from the category schema).
  const attrRows = Object.keys(attrs)
    .filter(k => attrs[k] !== null && attrs[k] !== '' && attrs[k] !== undefined && !promoted.has(k))
    .map(k => {
      const r = fmtAttr(schema, k, attrs[k], t);
      return {k: r.label, v: r.value};
    });

  const price = productPrice(product);
  const base = product.base_price != null ? Number(product.base_price) : null;
  const onSale = price != null && base != null && price < base;
  const unit = unitSuffix(product.unit);

  const site = product.site || {};
  const phone = site.phone;
  const whatsapp = site.whatsapp || site.phone;
  const cover = productCoverUri(product);
  const galleryRows = productGallery(product);
  const gallery = galleryRows.length
    ? galleryRows.map(g => mediaUri(g.path_url || g.path)).filter(Boolean)
    : cover
    ? [cover]
    : [];

  const enquire = () =>
    lead(
      'enquiry',
      `whatsapp://send?phone=${whatsapp}&text=${encodeURIComponent(
        t('MARKETPLACE.WHATSAPP_MSG', {name}),
      )}`,
    );

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollPad}>
        {/* Hero — swipeable gallery */}
        <View style={[s.hero, {height: m.heroH}]}>
          {gallery.length > 0 ? (
            <FlatList
              data={gallery}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(u, i) => `${i}_${u}`}
              onMomentumScrollEnd={e =>
                setActive(Math.round(e.nativeEvent.contentOffset.x / m.width))
              }
              renderItem={({item}) => (
                <CachedImage source={{uri: item}} style={{width: m.width, height: m.heroH}} resizeMode="cover" />
              )}
            />
          ) : (
            <CategoryArt bookingType={cat.booking_type} style={StyleSheet.absoluteFill} />
          )}
          {gallery.length > 1 && (
            <View style={s.dots}>
              {gallery.map((_, i) => (
                <View key={i} style={[s.dot, i === active && s.dotOn]} />
              ))}
            </View>
          )}
          {/* legibility + category wash */}
          <LinearGradient
            colors={[tint(pt.deep, 0.92), tint(pt.deep, 0.15), 'transparent']}
            locations={[0, 0.5, 1]}
            style={s.heroWash} start={{x: 0, y: 1}} end={{x: 0, y: 0}}
            pointerEvents="none"
          />
          <View style={[s.heroTop, {top: insets.top + 8, left: m.gutter, right: m.gutter}]}>
            <TouchableOpacity style={s.circle} onPress={() => backPage(navigation)}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.circle} onPress={onFav}>
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={20}
                color={fav ? '#eb5757' : '#fff'}
              />
            </TouchableOpacity>
          </View>
          {/* Overlaid identity — badge · name · rating */}
          <View style={[s.heroContent, {left: m.gutter, right: m.gutter, bottom: m.ms(26)}]} pointerEvents="none">
            <View style={[s.heroBadge, {backgroundColor: pt.accent}]}>
              <Text style={[s.heroBadgeTxt, {fontSize: m.ms(11)}]}>{pt.glyph} {catName}</Text>
            </View>
            <Text style={[s.heroName, {fontSize: m.ms(24)}]} numberOfLines={2}>{name}</Text>
            <View style={s.heroRateRow}>
              {!!product.rating_avg_rate && (
                <>
                  <Ionicons name="star" size={m.ms(13)} color="#FFC94D" />
                  <Text style={[s.heroRateNum, {fontSize: m.ms(13)}]}>{Number(product.rating_avg_rate).toFixed(1)}</Text>
                  <Text style={[s.heroRateSub, {fontSize: m.ms(12)}]}>
                    · {t('MARKETPLACE.RATINGS_COUNT', {count: product.rating_count || 0})}
                  </Text>
                </>
              )}
              {!!site.name && <Text style={[s.heroRateSub, {fontSize: m.ms(12)}]}>· {site.name}</Text>}
            </View>
          </View>
        </View>

        {/* Sheet — centred and width-capped on tablets */}
        <View style={[s.sheet, {width: m.contentW, marginLeft: m.sideInset}]}>
          {/* Price + the booking_type pill */}
          <PriceBar
            m={m} theme={pt}
            price={money(price)}
            unit={unit}
            strike={onSale ? money(base) : null}
            pill={t(bm.pillKey)}
          />

          {/* Booking box — check-in/out, slots, stock… only what exists */}
          {bookingBox.length > 0 && (
            <View style={s.gap12}>
              <BookingBox m={m} items={bookingBox} />
            </View>
          )}

          {!!desc && (
            <View style={s.gap14}>
              <Block m={m} label={t('MARKETPLACE.ABOUT')}>
                <BlockText m={m}>{desc}</BlockText>
              </Block>
            </View>
          )}

          {/* Attributes — rendered from the category's attribute_schema */}
          {attrRows.length > 0 && (
            <>
              <SectionHead m={m} theme={pt} title={t('MARKETPLACE.DETAILS')} />
              <FactsGrid m={m} theme={pt} items={attrRows} />
            </>
          )}

          {/* Sold by */}
          {!!site.name && (
            <>
              <SectionHead m={m} theme={pt} title={t('MARKETPLACE.SOLD_BY')} />
              <VendorCard
                m={m} theme={pt}
                initial={(site.name || '?').slice(0, 2).toUpperCase()}
                logo={site.logo ? {uri: mediaUri(site.logo)} : null}
                name={site.name}
                sub={[site.pin_code ? t('MARKETPLACE.PIN', {code: site.pin_code}) : null]
                  .filter(Boolean)
                  .join(' · ')}
                // vendorProfile is keyed by the vendor's USER id — site.id is a
                // site id and 404s. Only link when the payload carries user_id.
                onPress={
                  site.user_id
                    ? () => navigateTo(navigation, t('SCREEN.VENDOR_PROFILE'), {id: site.user_id})
                    : undefined
                }
              />
            </>
          )}

          {/* Photos */}
          {gallery.length > 1 && (
            <>
              <SectionHead m={m} theme={pt} title={t('MARKETPLACE.PHOTOS')} more={String(gallery.length)} />
              <GalleryGrid
                m={m}
                sources={gallery.map(u => ({uri: u}))}
                onPressItem={i => setActive(i)}
              />
            </>
          )}

          <View style={{paddingHorizontal: m.gutter}}>
            <ReviewsSection
              productId={id}
              ratingAvg={product.rating_avg_rate}
              ratingCount={product.rating_count}
              navigation={navigation}
            />
          </View>
        </View>
      </ScrollView>

      {/* Contact bar — the CTA wording follows booking_type, the action stays
          the enquiry channel (v1 is enquiry-only). */}
      <View style={[s.bar, {paddingBottom: Math.max(insets.bottom, 10), paddingHorizontal: m.gutter}]}>
        {!!phone && (
          <TouchableOpacity
            style={[s.cIc, {borderColor: tint(pt.accent, 0.4)}]}
            onPress={() => lead('call', `tel:${phone}`)}>
            <Ionicons name="call" size={19} color={pt.accent} />
          </TouchableOpacity>
        )}
        {(site.latitude != null && site.longitude != null) && (
          <TouchableOpacity
            style={[s.cIc, {borderColor: tint(pt.accent, 0.4)}]}
            onPress={() =>
              lead(
                'directions',
                `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`,
              )
            }>
            <Ionicons name="navigate" size={19} color={pt.accent} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.cta, {backgroundColor: pt.accent}]} onPress={enquire}>
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={[s.ctaTxt, {fontSize: m.ms(14)}]} numberOfLines={1}>{t(bm.ctaKey)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream, gap: 10},
  muted: {fontSize: 11.5, color: C.textLight},
  back: {color: C.oceanMid, fontWeight: '700'},
  hero: {backgroundColor: '#e8f5f7'},
  dots: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)'},
  dotOn: {backgroundColor: '#fff', width: 18},
  heroWash: {...StyleSheet.absoluteFillObject},
  heroContent: {position: 'absolute', left: 15, right: 15, bottom: 30},
  heroBadge: {alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, marginBottom: 8},
  heroBadgeTxt: {color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.2},
  heroName: {color: '#fff', fontSize: 23, fontWeight: '800', letterSpacing: -0.3, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 12},
  heroRateRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, flexWrap: 'wrap'},
  heroRateNum: {color: '#fff', fontSize: 13, fontWeight: '800'},
  heroRateSub: {color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500'},
  heroTop: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(12,20,22,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: C.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: -24,
    paddingTop: 16,
  },
  scrollPad: {paddingBottom: 12},
  gap12: {marginTop: 12},
  gap14: {marginTop: 14},
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingHorizontal: 13,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cIc: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.wa,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaTxt: {color: '#fff', fontWeight: '800', fontSize: 14.5},
});

export default ProductDetailScreen;
