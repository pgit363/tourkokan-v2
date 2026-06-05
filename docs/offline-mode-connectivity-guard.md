# Offline-Mode / Connectivity Guard for Data Fetches & Pull-to-Refresh

**Status:** Pattern defined. Implemented on HomeScreen (`onCitySelect`, `onRefresh`).
To be rolled out to every screen that fetches data or supports pull-to-refresh.

---

## 1. Why this exists

The app has a user-controlled **Mode** toggle:

- **Online mode** (`MODE === true`) → the app is allowed to hit the network for fresh data.
- **Offline mode** (`MODE === false`) → the app should only read cached/local data and must **not** call the API.

This is independent of the **device's actual internet connectivity** (`NetInfo.isConnected`).

Because the two are independent, any action that tries to fetch fresh data (open a
detail page, change city, search, pull-to-refresh, submit a form, etc.) has **four
possible states**. Without a guard, the most confusing one is _"I have internet but
nothing refreshes"_ — which happens when the device is connected but Mode is offline.
The user gets no feedback. This guard makes every fetch entry-point explain itself.

---

## 2. The four combinations

Let:
- `isConnected` = `(await NetInfo.fetch()).isConnected`
- `storedMode`  = `JSON.parse(await getFromStorage(STORAGE.MODE))` → `true` (online) / `false` (offline)

| # | `isConnected` | `storedMode` | What it means | Action | Alert key |
|---|---------------|--------------|---------------|--------|-----------|
| 1 | ✅ true  | online (`true`)  | Everything OK | **Proceed with the API call** | — |
| 2 | ✅ true  | offline (`false`) | Internet exists, but user chose offline | **Block + popup** prompting to switch to online | `ALERT.INTERNET_AVAILABLE_MODE_OFFLINE` |
| 3 | ❌ false | online (`true`)  | User wants online but there's no network | **Block + popup** to check network | `ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE` |
| 4 | ❌ false | offline (`false`) | No network and offline mode | **Block + popup** generic network message | `ALERT.NETWORK` |

> Only combination **#1** is allowed to hit the API. The other three are blocked and
> must show the corresponding message so the user knows _why_ nothing loaded and _what
> to change_.

---

## 3. Alert messages (i18n keys)

Defined in `src/localization/translations/{en,mr}.json` under `ALERT.*` and mirrored in
`src/Services/Constants/STRINGS.js`.

| Key | English text |
|-----|--------------|
| `ALERT.INTERNET_AVAILABLE_MODE_OFFLINE` | "Internet is available, but mode is set to offline, Please check your mode." |
| `ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE` | "No internet connection available, but the mode is set to online. Please check your network." |
| `ALERT.NETWORK` | "No internet connection available." |
| `ALERT.MODE_OFFLINE` | "The mode is set to offline; please switch to online to proceed." |

All user-facing strings **must** go through `t('ALERT.*')` — no hardcoded English
(see CLAUDE.md mobile rules).

---

## 4. Preferred: the shared `useConnectivityGate` hook

A reusable hook now encapsulates the whole guard **plus** the "Go Online"
popup (`RoutesOfflineGate`) and the no-internet info popup. Prefer this over
hand-rolling the snippet below.

File: `src/Components/Common/useConnectivityGate.js`

```js
import {useConnectivityGate} from '../../Components/Common/useConnectivityGate';

const {modal: connectivityModal, ensureOnline} = useConnectivityGate();

// pull-to-refresh / any fetch action:
const onRefresh = () =>
  ensureOnline(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  });

// render once in JSX:
{connectivityModal}
```

Behaviour of `ensureOnline(onProceed)`:
- connected + online → runs `onProceed` immediately.
- connected + offline mode → shows the **RoutesOfflineGate** popup with a
  **"Go Online"** button; tapping it switches mode online (persist + Redux)
  and then runs `onProceed`.
- no internet → shows an informational `Popup` and does not proceed.

The hook reads/writes the `mode` storage key and dispatches `setMode` to the
Redux store directly, so it works on any screen regardless of its own `connect`.

---

## 4b. Low-level guard snippet (only if the hook doesn't fit)

This is the single source-of-truth pattern. Copy it into any fetch entry-point.

```js
import NetInfo from '@react-native-community/netinfo';
import { getFromStorage } from '../../Services/Api/CommonServices';

const storedMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
const netState = await NetInfo.fetch();
const isConnected = netState.isConnected;

// Block fetch unless connected AND in online mode (combination #1).
if (!isConnected || !storedMode) {
  setIsAlert(true);
  setAlertMessage(
    !isConnected && !storedMode ? t('ALERT.NETWORK')                       // #4
    : !isConnected             ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE') // #3
    :                            t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE'),  // #2
  );
  return; // do NOT call the API
}

// #1 — safe to fetch
callTheApi();
```

### Screens that use `GlobalAlert` instead of local `Popup`

Some screens use the `showAlert(title, message, type)` helper rather than the local
`isAlert` / `alertMessage` + `<Popup>` state. Use the same branching, just swap the
output:

```js
if (!isConnected || !storedMode) {
  showAlert(
    '',
    !isConnected && !storedMode ? t('ALERT.NETWORK')
    : !isConnected             ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE')
    :                            t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE'),
    'warning',
  );
  return;
}
```

---

## 5. Pull-to-refresh specifics

For a `RefreshControl` `onRefresh` handler:

1. Run the guard **before** showing the spinner.
2. Only call `setRefreshing(true)` once combination #1 is confirmed — otherwise the
   spinner flashes while a popup is shown, which looks broken.
3. Always reset `setRefreshing(false)` when done.

Reference implementation — `src/Screens/HomeScreen.js` → `onRefresh`:

```js
const onRefresh = async () => {
  props.setSource('');
  props.setDestination('');

  const storedMode = JSON.parse(await getFromStorage(t('STORAGE.MODE')));
  const netState = await NetInfo.fetch();
  const isConnected = netState.isConnected;

  if (!isConnected || !storedMode) {
    setIsAlert(true);
    setAlertMessage(
      !isConnected && !storedMode ? t('ALERT.NETWORK')
      : !isConnected             ? t('ALERT.NO_INTERNET_AVAILABLE_MODE_ONLINE')
      :                            t('ALERT.INTERNET_AVAILABLE_MODE_OFFLINE'),
    );
    return;
  }

  setRefreshing(true);
  callLandingPageAPI();
  setRefreshing(false);
};
```

---

## 6. Rollout checklist

Apply the guard to **every** API-calling action and every pull-to-refresh.
Tick a box once the screen has been updated and tested.

### Already done
- [x] `src/Screens/HomeScreen.js` — `onCitySelect`
- [x] `src/Screens/HomeScreen.js` — `onRefresh` (pull-to-refresh) — via `useConnectivityGate`
- [x] `src/Screens/DetailPages/SiteDetailPage.js` — `onRefresh` — via `useConnectivityGate`
- [x] `src/Screens/DetailPages/CityDetails.js` — `onRefresh` — via `useConnectivityGate`
- [x] `src/Screens/MySubmissionsScreen.js` (My Sites) — `onRefresh` via `useConnectivityGate` + offline-first cache load
- [x] `src/Screens/MyEvents.js` — `onRefresh` via `useConnectivityGate` + offline-first cache load
- [x] `src/Screens/Emergency.js` — `onRefresh` + load-more now use `useConnectivityGate` (replaced old `showAlert` popup); already cache-first via `dataSync`

### Screens that already show the mode alert on actions (verify they cover all 4 combos + add to their refresh handlers)
- [ ] `src/Screens/DetailPages/SiteDetailPage.js`
- [ ] `src/Screens/DetailPages/CityDetails.js`
- [ ] `src/Screens/ListPages/CityList.js`
- [ ] `src/Screens/ContactUs.js`
- [ ] `src/Components/Common/SearchPanel.js`
- [ ] `src/Components/Common/ProfileViews/UpdateProfile.js`
- [ ] `src/Components/Common/ProfileViews/ChangeLang.js`
- [ ] `src/Screens/Profile.js` (currently only `NO_INTERNET_AVAILABLE_MODE_ONLINE` — extend to all 4 combos)
- [ ] `src/Screens/Emergency.js` (currently only `MODE_OFFLINE` — extend to all 4 combos)

### Screens to audit for missing guard (API calls and/or pull-to-refresh)
- [ ] `src/Screens/ListPages/*` (BusRouteList, RoutesList, AllRoutesSearch, MSRTCSearch, etc.)
- [ ] `src/Screens/DetailPages/*` (EventDetail, etc.)
- [ ] `src/Screens/ProfileView.js`
- [ ] Any screen with a `RefreshControl` / `onRefresh`
- [ ] Any screen calling `comnPost` / `comnGet` / `dataSync` directly

> Search helpers to find all entry-points:
> ```bash
> grep -rn "onRefresh\|RefreshControl" src/
> grep -rn "comnPost\|comnPostForm\|dataSync" src/
> ```

---

## 7. Notes & gotchas

- **Mode is read fresh each time** from storage (`STORAGE.MODE`), not from a stale
  closure/prop — always `await getFromStorage` inside the handler.
- **`NetInfo.fetch()`** gives a one-shot current state. Do not wire fetches to
  `NetInfo.addEventListener` for this purpose — the listener fires repeatedly and will
  cause duplicate API calls (see HomeScreen `init` history).
- **`dataSync`** already short-circuits to cached data when `online === false`, but it
  does **not** notify the user. The guard is what gives the user feedback; keep both.
- Keep the branching order exactly as shown (`both → network`, `!connected`, `else`)
  so the messages stay correct.
- Consider extracting this into a shared helper later, e.g.
  `Services/CommonMethods.js → canFetchFresh()` returning
  `{ ok: boolean, alertKey: string | null }`, to avoid copy-paste drift.
</content>
</invoke>
