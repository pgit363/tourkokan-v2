# Security TODO

Features already implemented are marked ✅. Everything below is pending.

---

## ✅ Done

- **Screenshot prevention (Android)** — `FLAG_SECURE` in `MainActivity.kt`. Screenshots and screen recordings produce a black image at OS level.
- **Background screen masking (both platforms)** — `SecurityOverlay` in `App.js` covers all content with a branded white screen whenever the app leaves the foreground (App Switcher, home button, incoming call). Prevents screen content leaking in the iOS/Android task switcher.

---

## Pending

### 1. Root / Jailbreak Detection
**Package:** `react-native-jail-monkey`  
**What:** Detect if the device is rooted (Android) or jailbroken (iOS) and refuse to run or show a warning.  
**Why:** Rooted devices can bypass `FLAG_SECURE` and extract app data from memory. Most banking/fintech apps block usage entirely on compromised devices.  
**Where:** `App.js` bootstrap — check on app launch before rendering anything.

---

### 2. SSL Certificate Pinning
**Where:** `src/Services/Api/AxiosInterceptor.js`  
**What:** Pin the backend's SSL certificate so that MITM proxies (Charles Proxy, Burp Suite) cannot intercept API traffic even on developer or rooted devices.  
**How:** Use `react-native-ssl-pinning` or configure certificate hashes in the Axios adapter.  
**Why:** Without pinning, any attacker with the device's trust store can intercept all API requests including JWT tokens and user data.

---

### 3. Session Timeout (Auto-Logout)
**Where:** `App.js` + `src/Services/Api/CommonServices.js`  
**What:** Track the last active timestamp in AsyncStorage. On app resume, if the gap is > N minutes (e.g. 30), clear the token and redirect to login.  
**Why:** Protects users whose unlocked phone is grabbed — without timeout, the session stays valid indefinitely.  
**Note:** Show a "Session expired for your security" message rather than a silent logout.

---

### 4. Biometric Lock on Resume
**Package:** `react-native-biometrics` or `expo-local-authentication`  
**What:** After the app has been in the background for more than 5 minutes, require FaceID / fingerprint before showing content again.  
**Where:** `App.js` — extend the existing `AppState` listener.  
**Why:** Complements the session timeout — for shorter gaps the session stays alive but a biometric check is still required to re-enter.

---

### 5. OTP / Clipboard Auto-Clear
**Where:** `src/Screens/AuthScreens/VerifyOTP.js`  
**What:** After an OTP is pasted or submitted, clear the clipboard after 30 seconds.  
**How:** `Clipboard.setString('')` inside a `setTimeout`.  
**Why:** OTPs sitting in the clipboard are a common attack surface on shared or compromised devices.

---

### 6. Sensitive Data Masking in Logs
**Where:** `src/Services/Api/AxiosInterceptor.js` and any `console.log` that prints tokens or user data.  
**What:** Strip `Authorization` headers, passwords, and OTPs from any log output in production builds.  
**How:** Guard all logs behind `if (__DEV__)` or remove them entirely in release.  
**Why:** Production log output can be read by other apps with `READ_LOGS` permission on Android.
