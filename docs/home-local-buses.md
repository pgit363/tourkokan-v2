# HomeScreen — "Local Buses" section

Surface a few MSRTC bus routes directly on the Home tab, rendered from data the
`landingpage` API **already returns**. No new API call, no new network state.

Mockup: the ocean‑teal themed reference is the `home-routes-mockup` artifact.

---

## 1. Why

- **Zero data cost.** `v2/landingpage` → `data.routes` is already fetched, cached
  (`STORAGE.LANDING_RESPONSE`) and **already stored in HomeScreen state** — it's
  just not destructured or rendered yet (see `HomeScreen.js`: the reducer payload
  sets `routes: res.routes`, but the render destructure omits `routes`).
- **Surfaces a core feature.** Bus routes otherwise live only behind the Routes /
  MSRTC tab. A Home strip drives discovery.
- **Consistent.** Mirrors the existing `PopularSpots` / `HotPlaces` section pattern.

---

## 2. Data source

Already in `HomeScreen.js`:

- `getFromStorage(STORAGE.LANDING_RESPONSE)` (offline / first paint) and
  `comnPost('v2/landingpage')` both dispatch a payload that includes
  `routes: res.routes`.
- **Change needed:** add `routes` to the state destructure (it's set but not read):

```js
// before
const {cities, bannerObject, trending, hot_sites, isLoading} = state;
// after
const {cities, routes, bannerObject, trending, hot_sites, isLoading} = state;
```

`routes` is an array; each item looks like:

```jsonc
{
  "id": 6704,
  "name": "Kankavli To Phonda Via Tiware",
  "start_time": "09:25:00", "end_time": "10:00:00",
  "total_time": "00:35:00", "distance": 20.3,
  "route_stops": [ /* … */ ],            // length = stop count
  "source_place":      { "id": 1545, "name": "Kankavli", "categories": [...] },
  "destination_place": { "id": 7452, "name": "Karul Vidyalaya", "categories": [...] },
  "bus_type": {
    "id": 4, "type": "Ordinary Express",
    "meta_data": "[{\"color_code\":\"#c42a2e\",\"Content\":\"172284201241\"}]"
  }
}
```

---

## 3. Field mapping (card ← route)

| Card element        | Source field |
|---------------------|--------------|
| Origin name         | `source_place.name` |
| Destination name    | `destination_place.name` |
| Depart time         | `start_time` (`HH:mm`, trim seconds) |
| Arrive time         | `end_time` (`HH:mm`) |
| Duration chip       | `total_time` → `"35 min"` / `"1h 05m"` |
| Distance chip       | `distance` → `"20.3 km"` |
| Stops               | `route_stops?.length` |
| Bus‑type pill text  | `bus_type.type` |
| Bus‑type pill colour| `JSON.parse(bus_type.meta_data)?.[0]?.color_code` (fallback `#C42A2E`) |

> **Title = source→destination, not `name`.** In the seed data `name`
> ("Phonda To Kankavli Via Karul") can differ from
> `source_place→destination_place` (Karul Vidyalaya→Kankavli) because the
> endpoints are the first/last **stops**. Use `source_place`/`destination_place`
> for the on‑card title; `name` can be a `numberOfLines={1}` subtitle if wanted.

Helpers to add (e.g. in the component or `CommonMethods`):

```js
const hhmm = t => (t ? String(t).slice(0, 5) : '');           // "09:25:00" → "09:25"
const durLabel = t => {                                        // "01:05:00" → "1h 05m"
  const [h, m] = String(t || '').split(':').map(Number);
  if (!h && !m) return '';
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} min`;
};
const busColor = bt => {
  try { return JSON.parse(bt?.meta_data)?.[0]?.color_code || '#C42A2E'; }
  catch { return '#C42A2E'; }
};
```

---

## 4. Component — `src/Components/Sections/LocalBuses.js`

New reusable section, same shape as `PopularSpots` (horizontal `FlatList`, section
header with accent bar + count badge + "View all"). Palette tokens match the app's
Home system.

```js
import React from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';

const C = {
  oceanDeep: '#0D3D4A', oceanMid: '#1B6B7B', sandMid: '#C9A227',
  white: '#FFFFFF', textDark: '#1C1917', textMid: '#44403C', textLight: '#78716C',
};

const hhmm = t => (t ? String(t).slice(0, 5) : '');
const durLabel = t => {
  const [h, m] = String(t || '').split(':').map(Number);
  if (!h && !m) return '';
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} min`;
};
const busColor = bt => {
  try { return JSON.parse(bt?.meta_data)?.[0]?.color_code || '#C42A2E'; }
  catch { return '#C42A2E'; }
};

const RouteCard = ({item, onPress, t}) => {
  const src = item?.source_place?.name || '';
  const dst = item?.destination_place?.name || '';
  const color = busColor(item?.bus_type);
  const stops = item?.route_stops?.length || 0;
  return (
    <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={() => onPress?.(item)}>
      <View style={s.top}>
        <View style={[s.pill, {backgroundColor: color + '1A'}]}>
          <View style={[s.dot, {backgroundColor: color}]} />
          <Text style={[s.pillTxt, {color}]} numberOfLines={1}>
            {item?.bus_type?.type || t('HOME.BUS')}
          </Text>
        </View>
        {stops ? <Text style={s.stops}>{t('HOME.STOPS_COUNT', {count: stops})}</Text> : null}
      </View>

      <View style={s.od}>
        <View style={s.track}>
          <View style={s.o} /><View style={s.line} /><View style={s.d} />
        </View>
        <View style={s.places}>
          <View style={s.row}>
            <Text style={s.nm} numberOfLines={1}>{src}</Text>
            <Text style={s.tm}>{hhmm(item?.start_time)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.nm} numberOfLines={1}>{dst}</Text>
            <Text style={s.tm}>{hhmm(item?.end_time)}</Text>
          </View>
        </View>
      </View>

      <View style={s.meta}>
        {!!item?.total_time && (
          <View style={s.chip}><Ionicons name="time-outline" size={13} color={C.oceanMid} />
            <Text style={s.chipTxt}>{durLabel(item.total_time)}</Text></View>
        )}
        {item?.distance != null && (
          <View style={s.chip}><Ionicons name="navigate-outline" size={13} color={C.oceanMid} />
            <Text style={s.chipTxt}>{item.distance} km</Text></View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * LocalBuses — Home section for landingpage routes.
 * Props: routes [], onCardPress(route), onViewAll()
 */
const LocalBuses = ({routes = [], onCardPress, onViewAll}) => {
  const {t} = useTranslation();
  if (!routes.length) return null;             // hide when empty

  return (
    <View style={s.section}>
      <View style={s.header}>
        <View style={s.titleRow}>
          <View style={s.accent} />
          <Text style={s.title}>{t('HOME.LOCAL_BUSES')}</Text>
          <View style={s.badge}><Text style={s.badgeTxt}>
            {t('HOME.ROUTES_COUNT', {count: routes.length})}
          </Text></View>
        </View>
        <TouchableOpacity onPress={onViewAll} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <Text style={s.all}>{t('HOME.VIEW_ALL')} →</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={routes}
        keyExtractor={(it, i) => `${it.id}_${i}`}
        renderItem={({item}) => <RouteCard item={item} onPress={onCardPress} t={t} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{width: 13}} />}
      />
    </View>
  );
};

const s = StyleSheet.create({
  section: {
    marginBottom: 8, paddingTop: 18, paddingBottom: 18,
    backgroundColor: 'rgba(27,107,123,0.05)',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(27,107,123,0.10)',
  },
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 14},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  accent: {width: 4, height: 20, borderRadius: 2, backgroundColor: C.oceanMid},
  title: {fontSize: 18, fontWeight: '800', color: C.oceanDeep},
  badge: {backgroundColor: 'rgba(27,107,123,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3},
  badgeTxt: {fontSize: 11, fontWeight: '700', color: C.oceanMid},
  all: {fontSize: 13, fontWeight: '600', color: C.oceanMid},
  list: {paddingHorizontal: 20},

  card: {width: 268, backgroundColor: C.white, borderRadius: 16, padding: 15,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)'},
  top: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
  pill: {flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, maxWidth: 170},
  dot: {width: 6, height: 6, borderRadius: 3},
  pillTxt: {fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3},
  stops: {fontSize: 11.5, fontWeight: '600', color: C.textLight},

  od: {flexDirection: 'row', gap: 11, marginBottom: 12},
  track: {alignItems: 'center', paddingTop: 5},
  o: {width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: C.oceanMid},
  line: {flex: 1, width: 2, backgroundColor: C.sandMid, marginVertical: 2},
  d: {width: 9, height: 9, borderRadius: 5, backgroundColor: C.sandMid},
  places: {flex: 1, justifyContent: 'space-between', gap: 12},
  row: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8},
  nm: {flex: 1, fontSize: 15, fontWeight: '700', color: C.textDark},
  tm: {fontSize: 13, fontWeight: '700', color: C.textMid},

  meta: {flexDirection: 'row', gap: 8, borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    borderStyle: 'dashed', paddingTop: 11},
  chip: {flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(27,107,123,0.07)',
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4},
  chipTxt: {fontSize: 12, fontWeight: '600', color: C.textMid},
});

export default LocalBuses;
```

---

## 5. Wire into `HomeScreen.js`

1. `import LocalBuses from '../Components/Sections/LocalBuses';`
2. Add `routes` to the state destructure (see §2).
3. Render it inside the Home scroll content, in the position you want (e.g. **below
   "Explore Talukas" and above Trending**). If Home uses a `KeyboardAwareFlatList`
   of sections, add it as one item; if it's inline JSX, drop the element in:

```jsx
<LocalBuses
  routes={routes}
  onCardPress={route => navigateTo(navigation, t('SCREEN.ROUTES_LIST'), {item: route})}
  onViewAll={() => navigateTo(navigation, t('SCREEN.ROUTES'))}
/>
```

- **Card tap** → `RoutesList` screen with `{item: route}` — the exact param shape
  `AllRoutesSearch` already uses (`navigateTo(navigation, t('SCREEN.ROUTES_LIST'), {item})`),
  so the route‑detail screen needs no change.
- **View all** → the Routes / MSRTC tab (`SCREEN.ROUTES`).

---

## 6. i18n keys (add to `en.json` + `mr.json`, `HOME` namespace)

| Key | en | mr |
|-----|----|----|
| `HOME.LOCAL_BUSES` | "Local Buses" | "स्थानिक बस" |
| `HOME.VIEW_ALL` | "View all" | "सर्व पहा" |
| `HOME.ROUTES_COUNT` | "{{count}} routes" | "{{count}} मार्ग" |
| `HOME.STOPS_COUNT` | "{{count}} stops" | "{{count}} थांबे" |
| `HOME.BUS` | "Bus" | "बस" |

---

## 7. Edge cases

- **Empty `routes`** → component returns `null` (section hidden). Handles guests /
  areas with no seeded routes.
- **Missing `bus_type.meta_data`** → `busColor` falls back to `#C42A2E`.
- **`name` vs source/destination** → title uses `source_place`/`destination_place`
  (see §3 note).
- **Long place names** → `numberOfLines={1}` on `nm`; card width fixed at 268
  (per the card‑width convention — adjust height, not width).
- **Seconds in times** → always trim with `hhmm()` (API returns `HH:mm:ss`).

---

## 8. Checklist

- [ ] `LocalBuses.js` added under `src/Components/Sections/`
- [ ] `routes` added to HomeScreen state destructure
- [ ] `<LocalBuses>` placed in the Home section order
- [ ] `onCardPress` → `ROUTES_LIST {item}`, `onViewAll` → `ROUTES` tab
- [ ] i18n keys added to en + mr
- [ ] Verified on the test API (`landingpage.routes` non‑empty)
