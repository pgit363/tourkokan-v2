# Banner Navigation — Design & Implementation Guide

## Overview

Banners in the app (home hero, mid-page, footer) can optionally carry a link from the backend. When a user taps a banner, the app checks the link value and either:

- **Navigates to an in-app screen** — if the value matches a known screen key
- **Opens a URL in the browser** — if the value is a real web URL (`https://...`)

---

## How the Backend Sends the Link

The API response for a banner object includes:

```json
{
  "id": 12,
  "image": "banners/home_hero.jpg",
  "redirect_url": "SubmitPlace"
}
```

Or for an external link:

```json
{
  "id": 13,
  "image": "banners/promo.jpg",
  "redirect_url": "https://tourkokan.com/offers"
}
```

The Banner component reads:

```js
const url = item.redirect_url || item.meta_data?.url;
```

---

## Screen Map

The mapping lives inside `Banner.js`. It translates the backend string into a React Native screen name.

```js
const SCREEN_MAP = {
  SubmitPlace:  STRING.SCREEN.SUBMIT_PLACE,
  EventsList:   STRING.SCREEN.EVENTS_LIST,
  ContactUs:    STRING.SCREEN.CONTACT_US,
  Profile:      STRING.SCREEN.PROFILE_VIEW,
  Explore:      STRING.SCREEN.EXPLORE,
  // add more here as backend defines them
};
```

**Rule:** the key in `SCREEN_MAP` must exactly match what the backend sends in `redirect_url`.

---

## Decision Logic

```
banner tapped
     │
     ▼
  url present?
   No → do nothing
   Yes
     │
     ▼
  SCREEN_MAP[url] exists?
   Yes → navigation.navigate(SCREEN_MAP[url])   ← in-app screen
   No  → Linking.openURL(url)                   ← browser / deep link
```

---

## Changes Required to Implement

### 1. `Banner.js` — add `navigation` prop + screen map + smart handler

```js
const SCREEN_MAP = {
  SubmitPlace: STRING.SCREEN.SUBMIT_PLACE,
  EventsList:  STRING.SCREEN.EVENTS_LIST,
  ContactUs:   STRING.SCREEN.CONTACT_US,
  // ...
};

const Banner = ({style, bannerImages, navigation}) => {
  const bannerClick = url => {
    if (!url) return;
    if (navigation && SCREEN_MAP[url]) {
      navigation.navigate(SCREEN_MAP[url]);
    } else {
      Linking.openURL(url);
    }
  };
  // ...
};
```

### 2. Every parent that renders `<Banner />` — pass `navigation`

| File | Component usage |
|------|----------------|
| `HomeScreen.js` | `<Banner bannerImages={...} navigation={navigation} />` |
| `SiteDetailPage.js` | `<AdBanner bannerImages={...} navigation={navigation} />` |
| `CityDetails.js` | `<AdBanner bannerImages={...} navigation={navigation} />` |

> If `navigation` is not passed, the banner falls back to `Linking.openURL` safely — no crash.

---

## Adding a New In-App Destination

1. Decide the key with the backend team (e.g. `"MyEvents"`)
2. Add one line to `SCREEN_MAP` in `Banner.js`:

```js
MyEvents: STRING.SCREEN.MY_EVENTS,
```

3. The backend sets `redirect_url: "MyEvents"` on the banner record in the admin panel.
4. No other code changes needed.

---

## Backend — Admin Panel Setup

In the admin panel, when creating or editing a banner:

- **`redirect_url` field** — enter one of:
  - A key from the table below for in-app navigation
  - A full URL (`https://...`) to open in the browser
  - Leave empty for a non-tappable banner

### Supported In-App Keys

| `redirect_url` value | Navigates to |
|----------------------|-------------|
| `SubmitPlace` | Add a new site form |
| `EventsList` | Events listing page |
| `ContactUs` | Contact Us screen |
| `Profile` | User profile view |
| `Explore` | Explore / browse screen |

*(Table grows as `SCREEN_MAP` is extended)*

---

## Notes

- Screen keys are **case-sensitive** — `submitplace` will not match `SubmitPlace`.
- If `navigation` prop is absent (e.g. Banner used in a context without a navigator), the app falls back to `Linking.openURL` — a non-crashing graceful degradation.
- Deep links to specific items (e.g. a particular site or event) are out of scope for this feature. Those require passing params alongside the screen name, which needs a different API contract (e.g. `{ "screen": "SiteDetail", "id": 42 }`).
