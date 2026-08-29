/**
 * DetailKit — the themed building blocks shared by every detail page.
 *
 * One skeleton, themed per category: each primitive takes the resolved
 * `theme` ({accent, deep, kind}) from Services/categoryTheme and the live
 * `m` metrics from useDetailMetrics, so the SAME component renders saffron on a
 * Temple, aqua on a Beach and indigo on a stay product — and re-sizes itself on
 * every screen from a 320dp budget phone to a 10" tablet in landscape.
 *
 * Sections are meant to be rendered conditionally by the caller: if the data
 * isn't there, don't render the block. Nothing here fabricates content.
 */
import React, {useMemo} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CachedImage from '../Customs/CachedImage';
import {tint} from '../../Services/categoryTheme';

// Shared palette (mirrors the approved mockup's :root tokens).
export const D = {
  cream: '#FAF7F0',
  card: '#FFFFFF',
  line: 'rgba(0,0,0,0.08)',
  ink: '#1C1917',
  inkMid: '#44403C',
  inkSoft: '#78716C',
  sand: '#C4972A',
  wa: '#25D366',
  flame: 'rgba(193,73,46,0.95)',
};

/**
 * Renders the photo when there is one, otherwise the `fallback` node (a
 * <CategoryArt/>, so an item with no picture still reads as its category).
 */
const Img = ({source, style, fallback, ...rest}) =>
  source ? (
    <CachedImage source={source} style={style} resizeMode="cover" {...rest} />
  ) : (
    fallback ? React.cloneElement(fallback, {style: [style, fallback.props.style]}) : <View style={style} />
  );

// ── Styles are rebuilt only when the metrics actually change ──────────────────
const useKit = m =>
  useMemo(() => {
    const {ms, gutter} = m;
    return StyleSheet.create({
      // .sec-h
      secH: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, paddingHorizontal: gutter, marginTop: ms(24), marginBottom: ms(12),
      },
      secTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1},
      secDot: {width: ms(7), height: ms(7), borderRadius: 99},
      secTitle: {fontSize: ms(15.5), fontWeight: '800', color: D.ink, letterSpacing: -0.2, flexShrink: 1},
      secMore: {fontSize: ms(12), fontWeight: '700'},

      // .facts / .fact
      facts: {flexDirection: 'row', flexWrap: 'wrap', gap: ms(8), paddingHorizontal: gutter},
      fact: {
        backgroundColor: D.card, borderWidth: 1, borderColor: D.line, borderRadius: ms(13),
        paddingVertical: ms(10), paddingHorizontal: ms(11),
      },
      factK: {fontSize: ms(9.5), fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase'},
      factV: {fontSize: ms(13.5), fontWeight: '700', color: D.ink, marginTop: 2},

      // .quickstrip / .qc
      strip: {flexDirection: 'row', flexWrap: 'wrap', gap: ms(7), paddingHorizontal: gutter},
      qc: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: ms(11), paddingVertical: ms(7), borderRadius: 99,
        backgroundColor: D.card, borderWidth: 1, borderColor: D.line,
      },
      qcEmoji: {fontSize: ms(12.5)},
      qcTxt: {fontSize: ms(12), fontWeight: '600', color: D.inkMid},
      qcVal: {fontWeight: '800'},

      // .block
      block: {
        marginHorizontal: gutter, backgroundColor: D.card, borderWidth: 1, borderColor: D.line,
        borderRadius: ms(16), padding: ms(14),
      },
      blockLbl: {
        fontSize: ms(10.5), fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase',
        color: D.sand, marginBottom: ms(8),
      },
      blockTxt: {fontSize: ms(13.5), color: D.inkMid, lineHeight: ms(22)},
      moreBtn: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: ms(8), alignSelf: 'flex-start'},
      moreTxt: {fontSize: ms(12.5), fontWeight: '700'},

      // .special
      callout: {
        flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginHorizontal: gutter,
        borderWidth: 1, borderRadius: ms(14), padding: ms(12),
      },
      calloutIc: {fontSize: ms(16)},
      calloutTxt: {flex: 1, fontSize: ms(12.5), color: D.inkMid, lineHeight: ms(20)},

      // .row
      row: {
        flexDirection: 'row', alignItems: 'center', gap: ms(11), marginHorizontal: gutter,
        backgroundColor: D.card, borderWidth: 1, borderColor: D.line, borderRadius: ms(13),
        paddingVertical: ms(9), paddingHorizontal: ms(10), marginTop: ms(8),
      },
      rowThumb: {width: ms(46), height: ms(46), borderRadius: ms(10), overflow: 'hidden'},
      rowMeta: {flex: 1, minWidth: 0},
      rowName: {fontSize: ms(13), fontWeight: '800', color: D.ink},
      rowSub: {fontSize: ms(11), color: D.inkSoft, marginTop: 2},
      rowPrice: {fontSize: ms(13), fontWeight: '800'},

      // .hscroll / .tcard
      rail: {
        paddingHorizontal: gutter, gap: ms(12),
        paddingTop: ms(4), paddingBottom: ms(6),
      },
      tcard: {
        width: m.railCard, backgroundColor: D.card, borderWidth: 1, borderColor: D.line,
        borderRadius: ms(14), overflow: 'hidden',
      },
      tImg: {width: '100%', height: m.railImage, backgroundColor: '#EEF4F5'},
      // minHeight reserves the meta line even when an item has no rating or
      // category, so a rail never ends up with ragged card bottoms.
      tBody: {paddingHorizontal: ms(10), paddingVertical: ms(9), minHeight: ms(54)},
      tName: {fontSize: ms(12.5), fontWeight: '800', color: D.ink, lineHeight: ms(17)},
      tMeta: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: ms(4)},
      tMetaTxt: {fontSize: ms(10.5), color: D.inkSoft},
      flame: {
        position: 'absolute', top: 6, left: 6, backgroundColor: D.flame,
        paddingHorizontal: ms(7), paddingVertical: 2, borderRadius: 99,
      },
      flameTxt: {fontSize: ms(8.5), fontWeight: '800', color: '#fff', letterSpacing: 0.3},

      // .filtchips
      chips: {paddingHorizontal: gutter, gap: ms(7), paddingBottom: ms(8)},
      fc: {
        paddingHorizontal: ms(11), paddingVertical: ms(6), borderRadius: 99,
        borderWidth: 1, borderColor: D.line, backgroundColor: D.card,
      },
      fcTxt: {fontSize: ms(11.5), fontWeight: '700', color: D.inkSoft},

      // .event
      event: {
        flexDirection: 'row', gap: ms(11), marginHorizontal: gutter, marginTop: ms(8),
        backgroundColor: D.card, borderWidth: 1, borderColor: D.line,
        borderRadius: ms(14), padding: ms(11),
      },
      evDate: {width: ms(52), alignItems: 'center', borderRadius: ms(11), paddingVertical: ms(7)},
      evDay: {fontSize: ms(20), fontWeight: '800', lineHeight: ms(22)},
      evMon: {fontSize: ms(9.5), fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2},
      evBody: {flex: 1, minWidth: 0, justifyContent: 'center'},
      evTitle: {fontSize: ms(13), fontWeight: '800', color: D.ink},
      evVenue: {fontSize: ms(11), color: D.inkSoft, marginTop: 3},

      // .busrow
      bus: {
        flexDirection: 'row', alignItems: 'center', gap: ms(10), marginHorizontal: gutter,
        marginTop: ms(7), backgroundColor: D.card, borderWidth: 1, borderColor: D.line,
        borderRadius: ms(12), padding: ms(10),
      },
      busTag: {paddingHorizontal: ms(7), paddingVertical: 3, borderRadius: 6},
      busTagTxt: {fontSize: ms(9), fontWeight: '800', color: '#fff', letterSpacing: 0.4},
      busPath: {fontSize: ms(12.5), fontWeight: '800', color: D.ink},
      busSub: {fontSize: ms(10.5), color: D.inkSoft, marginTop: 1},
      busTime: {fontSize: ms(11), fontWeight: '800', textAlign: 'right'},

      // .gal
      gal: {flexDirection: 'row', flexWrap: 'wrap', gap: ms(6), paddingHorizontal: gutter},
      galCell: {borderRadius: ms(11), overflow: 'hidden', backgroundColor: '#EEF4F5'},

      // .rev
      rev: {flexDirection: 'row', gap: ms(10), marginHorizontal: gutter, marginTop: ms(12)},
      revAv: {
        width: ms(34), height: ms(34), borderRadius: 99,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      },
      revAvTxt: {fontWeight: '800', fontSize: ms(12)},
      revTop: {flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'},
      revName: {fontSize: ms(12.5), fontWeight: '800', color: D.ink},
      revStars: {flexDirection: 'row', gap: 1},
      revTxt: {fontSize: ms(12.5), color: D.inkMid, marginTop: 2, lineHeight: ms(19)},

      // .pricebar
      priceBar: {flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: ms(8)},
      priceBig: {fontSize: ms(26), fontWeight: '800'},
      priceUnit: {fontSize: ms(12.5), color: D.inkSoft},
      priceStrike: {fontSize: ms(12.5), color: D.inkSoft, textDecorationLine: 'line-through'},
      btPill: {paddingHorizontal: ms(10), paddingVertical: ms(5), borderRadius: 99},
      btPillTxt: {fontSize: ms(10), fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase'},

      // .booking
      booking: {flexDirection: 'row', gap: ms(8), paddingHorizontal: gutter},
      bx: {
        flex: 1, backgroundColor: D.card, borderWidth: 1, borderColor: D.line,
        borderRadius: ms(12), paddingVertical: ms(9), paddingHorizontal: ms(11),
      },
      bxK: {fontSize: ms(9), fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: D.inkSoft},
      bxV: {fontSize: ms(12.5), fontWeight: '800', color: D.ink, marginTop: 2},

      // .vendorcard
      vendor: {
        flexDirection: 'row', alignItems: 'center', gap: ms(11), marginHorizontal: gutter,
        backgroundColor: D.card, borderWidth: 1, borderColor: D.line,
        borderRadius: ms(14), padding: ms(11),
      },
      vLogo: {
        width: ms(42), height: ms(42), borderRadius: ms(11),
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      },
      vLogoTxt: {color: '#fff', fontWeight: '800', fontSize: ms(15)},
      vName: {fontSize: ms(13), fontWeight: '800', color: D.ink},
      vSub: {fontSize: ms(11), color: D.inkSoft, marginTop: 1},

      empty: {alignItems: 'center', paddingVertical: ms(22), marginHorizontal: gutter},
      emptyIc: {fontSize: ms(26), marginBottom: 6},
      emptyTxt: {fontSize: ms(12.5), color: D.inkSoft},
    });
  }, [m]);

export const useKitStyles = useKit;

// ── Primitives ────────────────────────────────────────────────────────────────

export const SectionHead = ({m, theme, title, more, onMore, style}) => {
  const k = useKit(m);
  return (
    <View style={[k.secH, style]}>
      <View style={k.secTitleRow}>
        <View style={[k.secDot, {backgroundColor: theme.accent}]} />
        <Text style={k.secTitle} numberOfLines={1}>{title}</Text>
      </View>
      {!!more && (
        <TouchableOpacity onPress={onMore} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}} activeOpacity={0.7}>
          <Text style={[k.secMore, {color: theme.accent}]}>{more} ›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/** items: [{k, v}] — the mockup's 2-up facts grid (3-up once there's room). */
export const FactsGrid = ({m, theme, items}) => {
  const k = useKit(m);
  if (!items?.length) return null;
  const cols = m.factCols;
  const w = m.gridWidth(cols, m.ms(8));
  return (
    <View style={k.facts}>
      {items.map((f, i) => (
        <View key={`${f.k}-${i}`} style={[k.fact, {width: w}]}>
          <Text style={[k.factK, {color: theme.accent}]} numberOfLines={1}>{f.k}</Text>
          <Text style={k.factV} numberOfLines={2}>{f.v}</Text>
        </View>
      ))}
    </View>
  );
};

/** items: [{emoji, val, label}] */
export const QuickStrip = ({m, theme, items}) => {
  const k = useKit(m);
  if (!items?.length) return null;
  return (
    <View style={k.strip}>
      {items.map((q, i) => (
        <View key={i} style={k.qc}>
          <Text style={k.qcEmoji}>{q.emoji}</Text>
          <Text style={k.qcTxt}>
            <Text style={[k.qcVal, {color: theme.accent}]}>{q.val}</Text>
            {q.label ? ` ${q.label}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
};

export const Block = ({m, label, children, footer, style}) => {
  const k = useKit(m);
  return (
    <View style={[k.block, style]}>
      {!!label && <Text style={k.blockLbl}>{label}</Text>}
      {children}
      {footer}
    </View>
  );
};

export const BlockText = ({m, children, numberOfLines}) => {
  const k = useKit(m);
  return <Text style={k.blockTxt} numberOfLines={numberOfLines}>{children}</Text>;
};

export const MoreToggle = ({m, theme, expanded, onPress, labelMore, labelLess}) => {
  const k = useKit(m);
  return (
    <TouchableOpacity style={k.moreBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={[k.moreTxt, {color: theme.accent}]}>{expanded ? labelLess : labelMore}</Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={m.ms(14)} color={theme.accent} />
    </TouchableOpacity>
  );
};

export const Callout = ({m, theme, icon = '✨', children}) => {
  const k = useKit(m);
  return (
    <View style={[k.callout, {backgroundColor: tint(theme.accent, 0.09), borderColor: tint(theme.accent, 0.22)}]}>
      <Text style={k.calloutIc}>{icon}</Text>
      <Text style={k.calloutTxt}>{children}</Text>
    </View>
  );
};

/** The mockup's `.row` — thumb · name/sub · price or chevron. */
export const ListRow = ({m, theme, source, fallback, title, sub, price, onPress, chevron = true, badge}) => {
  const k = useKit(m);
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={k.row} onPress={onPress} activeOpacity={0.85}>
      <View style={[k.rowThumb, {backgroundColor: tint(theme.accent, 0.12)}]}>
        <Img source={source} fallback={fallback} style={{width: '100%', height: '100%'}} />
      </View>
      <View style={k.rowMeta}>
        <Text style={k.rowName} numberOfLines={1}>{title}</Text>
        {!!sub && <Text style={k.rowSub} numberOfLines={1}>{sub}</Text>}
        {badge}
      </View>
      {!!price && <Text style={[k.rowPrice, {color: theme.accent}]} numberOfLines={1}>{price}</Text>}
      {!price && chevron && <Ionicons name="chevron-forward" size={m.ms(16)} color={D.inkSoft} />}
    </Wrap>
  );
};

/** Horizontal rail of compact cards (`.hscroll` + `.tcard`). */
export const CardRail = ({m, children}) => {
  const k = useKit(m);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={k.rail}>
      {children}
    </ScrollView>
  );
};

export const TCard = ({m, source, fallback, title, meta, metaIcon, flameLabel, onPress}) => {
  const k = useKit(m);
  return (
    <TouchableOpacity style={k.tcard} onPress={onPress} activeOpacity={0.85}>
      <View>
        <Img source={source} fallback={fallback} style={k.tImg} />
        {!!flameLabel && (
          <View style={k.flame}><Text style={k.flameTxt}>{flameLabel}</Text></View>
        )}
      </View>
      <View style={k.tBody}>
        <Text style={k.tName} numberOfLines={1}>{title}</Text>
        {!!meta && (
          <View style={k.tMeta}>
            {!!metaIcon && <Ionicons name={metaIcon} size={m.ms(11)} color={D.sand} />}
            <Text style={k.tMetaTxt} numberOfLines={1}>{meta}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/** items: [{key, label}] */
export const FilterChips = ({m, theme, items, activeKey, onSelect}) => {
  const k = useKit(m);
  if (!items?.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={k.chips}>
      {items.map(it => {
        const on = it.key === activeKey;
        return (
          <TouchableOpacity
            key={it.key}
            style={[k.fc, on && {backgroundColor: theme.accent, borderColor: theme.accent}]}
            onPress={() => onSelect(it.key)}
            activeOpacity={0.8}>
            <Text style={[k.fcTxt, on && {color: '#fff'}]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export const EventRow = ({m, theme, day, mon, title, venue, onPress}) => {
  const k = useKit(m);
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={k.event} onPress={onPress} activeOpacity={0.85}>
      <View style={[k.evDate, {backgroundColor: tint(theme.accent, 0.11)}]}>
        <Text style={[k.evDay, {color: theme.accent}]}>{day}</Text>
        <Text style={[k.evMon, {color: theme.accent}]}>{mon}</Text>
      </View>
      <View style={k.evBody}>
        <Text style={k.evTitle} numberOfLines={2}>{title}</Text>
        {!!venue && <Text style={k.evVenue} numberOfLines={1}>📍 {venue}</Text>}
      </View>
    </Wrap>
  );
};

export const BusRow = ({m, theme, tag, path, sub, time, onPress}) => {
  const k = useKit(m);
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={k.bus} onPress={onPress} activeOpacity={0.85}>
      <View style={[k.busTag, {backgroundColor: theme.accent}]}>
        <Text style={k.busTagTxt}>{tag}</Text>
      </View>
      <View style={{flex: 1, minWidth: 0}}>
        <Text style={k.busPath} numberOfLines={1}>{path}</Text>
        {!!sub && <Text style={k.busSub} numberOfLines={1}>{sub}</Text>}
      </View>
      {!!time && <Text style={[k.busTime, {color: theme.accent}]}>{time}</Text>}
    </Wrap>
  );
};

/** Square photo grid — column count follows the available width. */
export const GalleryGrid = ({m, sources, fallback, onPressItem, max}) => {
  const k = useKit(m);
  if (!sources?.length) return null;
  const cols = m.galCols;
  const gap = m.ms(6);
  const size = m.gridWidth(cols, gap);
  const shown = max ? sources.slice(0, max) : sources;
  return (
    <View style={k.gal}>
      {shown.map((src, i) => (
        <TouchableOpacity
          key={i}
          style={[k.galCell, {width: size, height: size}]}
          activeOpacity={0.9}
          onPress={() => onPressItem?.(i)}>
          <Img source={src} fallback={fallback} style={{width: '100%', height: '100%'}} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const ReviewRow = ({m, theme, initials, avatar, name, rating, text, badge}) => {
  const k = useKit(m);
  const full = Math.round(Number(rating) || 0);
  return (
    <View style={k.rev}>
      <View style={[k.revAv, {backgroundColor: tint(theme.accent, 0.12)}]}>
        {avatar ? (
          <Img source={avatar} style={{width: '100%', height: '100%'}} />
        ) : (
          <Text style={[k.revAvTxt, {color: theme.accent}]}>{initials}</Text>
        )}
      </View>
      <View style={{flex: 1, minWidth: 0}}>
        <View style={k.revTop}>
          <Text style={k.revName}>{name}</Text>
          {full > 0 && (
            <View style={k.revStars}>
              {[0, 1, 2, 3, 4].map(i => (
                <Ionicons key={i} name={i < full ? 'star' : 'star-outline'} size={m.ms(11)} color={D.sand} />
              ))}
            </View>
          )}
          {badge}
        </View>
        {!!text && <Text style={k.revTxt}>{text}</Text>}
      </View>
    </View>
  );
};

export const PriceBar = ({m, theme, price, unit, strike, pill}) => {
  const k = useKit(m);
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: m.ms(10), paddingHorizontal: m.gutter,
    }}>
      <View style={k.priceBar}>
        <Text style={[k.priceBig, {color: theme.accent}]}>{price}</Text>
        {!!unit && <Text style={k.priceUnit}>{unit}</Text>}
        {!!strike && <Text style={k.priceStrike}>{strike}</Text>}
      </View>
      {!!pill && (
        <View style={[k.btPill, {backgroundColor: tint(theme.accent, 0.11)}]}>
          <Text style={[k.btPillTxt, {color: theme.accent}]}>{pill}</Text>
        </View>
      )}
    </View>
  );
};

/** items: [{k, v}] — check-in/out, slots, stock… driven by booking_type. */
export const BookingBox = ({m, items}) => {
  const k = useKit(m);
  if (!items?.length) return null;
  return (
    <View style={k.booking}>
      {items.map((b, i) => (
        <View key={i} style={k.bx}>
          <Text style={k.bxK} numberOfLines={1}>{b.k}</Text>
          <Text style={k.bxV} numberOfLines={2}>{b.v}</Text>
        </View>
      ))}
    </View>
  );
};

export const VendorCard = ({m, theme, initial, logo, name, sub, onPress}) => {
  const k = useKit(m);
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={k.vendor} onPress={onPress} activeOpacity={0.85}>
      <View style={[k.vLogo, {backgroundColor: theme.accent}]}>
        {logo ? <Img source={logo} style={{width: '100%', height: '100%'}} /> : <Text style={k.vLogoTxt}>{initial}</Text>}
      </View>
      <View style={{flex: 1, minWidth: 0}}>
        <Text style={k.vName} numberOfLines={1}>{name}</Text>
        {!!sub && <Text style={k.vSub} numberOfLines={1}>{sub}</Text>}
      </View>
      {!!onPress && <Ionicons name="chevron-forward" size={m.ms(18)} color={D.inkSoft} />}
    </Wrap>
  );
};

export const EmptyState = ({m, icon, text}) => {
  const k = useKit(m);
  return (
    <View style={k.empty}>
      <Text style={k.emptyIc}>{icon}</Text>
      <Text style={k.emptyTxt}>{text}</Text>
    </View>
  );
};

export default {
  D, SectionHead, FactsGrid, QuickStrip, Block, BlockText, MoreToggle, Callout,
  ListRow, CardRail, TCard, FilterChips, EventRow, BusRow, GalleryGrid,
  ReviewRow, PriceBar, BookingBox, VendorCard, EmptyState,
};
