# Requirements

## HomeScreen – Trending Data Integration in Popular Spots

### Context

The `v2/landingpage` API returns a `trending` object inside `data.data`. The HomeScreen already stores this in state and has rendering logic for it, but there is a bug that prevents trending data from ever appearing in the UI.

### Problem

`activeSpotTab` is initialized to `'all'` and is never updated when trending data loads from the API. The render condition:

```js
if (validTrendingKeys.includes(activeSpotTab) && trending[activeSpotTab]?.length > 0)
```

always evaluates to `false` because `'all'` is not a key in the trending object returned by the API. As a result, the Popular Spots section always falls back to `STATIC_SPOTS` instead of showing real trending data.

### Requirement

When trending data is loaded (from any of the 3 data paths below), automatically set `activeSpotTab` to the first valid trending key so that the trending data is shown by default in the Popular Spots section.

### Files to Change

- `src/Screens/HomeScreen.js`

### Specific Changes

In all 3 data-loading paths, after computing `validKeys`, call `setActiveSpotTab(validKeys[0])` alongside setting `newActiveTab`:

**1. From AsyncStorage cache (init `useEffect`, ~line 321):**
```js
if (res.trending) {
  const validKeys = Object.keys(res.trending).filter(k => res.trending[k]?.length > 0);
  if (validKeys.length > 0) {
    newActiveTab = validKeys[0];
    setActiveSpotTab(validKeys[0]); // ADD THIS
  }
}
```

**2. From `dataSync` callback (init `useEffect`, ~line 378):**
```js
if (res.trending) {
  const validKeys = Object.keys(res.trending).filter(k => res.trending[k]?.length > 0);
  if (validKeys.length > 0) {
    newActiveTab = validKeys[0];
    setActiveSpotTab(validKeys[0]); // ADD THIS
  }
}
```

**3. From direct API call in `callLandingPageAPI` (~line 471):**
```js
if (res.data.data.trending) {
  const validKeys = Object.keys(res.data.data.trending).filter(k => res.data.data.trending[k]?.length > 0);
  if (validKeys.length > 0) {
    newActiveTab = validKeys[0];
    setActiveSpotTab(validKeys[0]); // ADD THIS
  }
}
```

### Notes

- No UI component changes needed — `PackageCard` rendering for trending and `SpotCard` fallback for static spots are already in place.
- The `listHeader` useMemo already has `activeSpotTab` in its dependency array, so it will re-render correctly once the state is updated.
- The tab bar (`SPOT_TABS`) already switches to trending keys when available; this fix just ensures the selected tab follows.
