# Running Tourkokan on iOS

For `tourkokan-v2` (React Native 0.78). Android already builds and runs; **iOS has never been
built** — this guide takes it from zero to running on a physical iPhone.

Written August 2026 against RN 0.78.0 / React 19, Firebase 21, `react-native-maps` 1.18.

> **Status of this guide:** the repo-side changes in §1 are applied and committed. The build
> steps in §2–§5 have **not** been verified end-to-end, because the Mac they were written on
> had no Xcode installed. Expect to iterate on the first `pod install`.

---

## 0. Why iOS didn't work before

The `ios/` folder existed but was the untouched React Native template:

- no `Podfile.lock`, no `Pods/`, no `.xcworkspace` — pods had never been installed
- `AppDelegate.swift` was stock: no Firebase init, no Google Maps key
- `Info.plist` was missing every permission string the app actually needs, and every icon font
- `Podfile` had none of the Firebase / Google Maps configuration those libraries require
- bundle id was still `org.reactjs.native.example.tourkokan`

Android hid all of this because Gradle does much of it automatically — `fonts.gradle` copies the
icon fonts, `google-services.json` is picked up by a plugin, and permissions live in the
manifest. iOS has no equivalent; every one of these is manual.

---

## 1. Repo changes already applied

You do not need to redo these. They are listed so you know what changed and why.

### `ios/tourkokan/Info.plist`

| Key | Why it matters |
|---|---|
| `NSLocationWhenInUseUsageDescription` | Was an **empty string**. iOS refuses the permission prompt and App Review rejects the build. |
| `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` | Were **absent**. `react-native-image-picker` **hard-crashes** the app on iOS without them — this would have hit Submit Place and Add Product immediately. |
| `UIAppFonts` (11 icon faces added) | Android's `fonts.gradle` copies vector-icon fonts automatically. iOS renders **blank boxes** unless each face is listed. The app uses Ionicons in ~80 places, plus MaterialCommunityIcons, MaterialIcons, Feather, Octicons, FontAwesome, FontAwesome5, Fontisto, AntDesign. |
| `LSApplicationQueriesSchemes` | `whatsapp`, `tel`, `telprompt`, `mailto`, `comgooglemaps`, `maps`. Without `whatsapp` here, `Linking.canOpenURL('whatsapp://…')` returns `false` and the WhatsApp enquiry CTA silently does nothing. |
| `GMSApiKey` | Empty placeholder — you fill it in §3. |

### `ios/Podfile`

```ruby
$RNFirebaseAsStaticFramework = true
```
`@react-native-firebase` v21 ships as a static framework. Without this flag it disagrees with the
default static-library linkage and the build fails on duplicate symbols / missing modules.

```ruby
pod 'react-native-google-maps', :path => '../node_modules/react-native-maps'
```
`react-native-maps` ships Google Maps support as a **separate podspec** that autolinking does not
pick up. The app renders with `PROVIDER_GOOGLE` in `SiteDetailPage` and `CityPlaceSearch`; on iOS
that is a no-op — blank tiles — unless this pod is present *and* `GMSServices.provideAPIKey()`
runs. Remove both if you ever switch iOS to Apple Maps.

### `ios/tourkokan/AppDelegate.swift`

`FirebaseApp.configure()` before React Native starts (otherwise the first `@react-native-firebase`
call throws *"No Firebase App '[DEFAULT]' has been created"*), and `GMSServices.provideAPIKey()`
reading `GMSApiKey` from `Info.plist` so the key is not hardcoded in source.

### `package.json`

```
npm run pods         # cd ios && bundle exec pod install
npm run pods:clean   # nuke Pods/Podfile.lock/build and reinstall with --repo-update
npm run ios:device   # react-native run-ios --device
npm run ios:release  # react-native run-ios --mode Release
```

---

## 2. Machine setup

### 2.1 Xcode

Command Line Tools alone are **not** enough — you need full Xcode from the App Store (~10 GB).
Verify with `xcode-select -p`: if it prints `/Library/Developer/CommandLineTools`, point it at
Xcode and accept the licence:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

`xcodebuild -version` should now print a version instead of an error.

### 2.2 CocoaPods

macOS ships Ruby 2.6.10, which fights modern gems. The path of least resistance is Homebrew's
self-contained build:

```bash
brew install cocoapods
```

<details>
<summary>Alternative: match the repo's <code>Gemfile</code> (needed for Fastlane parity)</summary>

```bash
brew install rbenv
rbenv install 3.2.2 && rbenv local 3.2.2
gem install bundler
bundle install
```
Then use `npm run pods` (which runs `bundle exec pod install`) instead of bare `pod install`.
</details>

### 2.3 Install pods

```bash
npm install --legacy-peer-deps    # if node_modules isn't already present
cd ios && pod install
```

This generates **`ios/tourkokan.xcworkspace`**.

> ⚠️ From here on always open **`tourkokan.xcworkspace`**, never `tourkokan.xcodeproj`.
> Opening the project file gives you a build with no pods and a wall of missing-module errors.

---

## 3. Credentials

These need your Apple / Firebase / Google Cloud accounts.

### 3.1 Bundle identifier

Still the RN template default. In Xcode → target **tourkokan** → *Signing & Capabilities* →
Bundle Identifier, set:

```
com.tourkokan
```

Matching Android's `applicationId` keeps Firebase, Maps restrictions and Google Sign-In aligned.

### 3.2 Firebase

1. Firebase console → your project → **Add app → iOS**, bundle id `com.tourkokan`.
2. Download `GoogleService-Info.plist`.
3. **Drag it into Xcode** onto the `tourkokan` folder, with *Copy items if needed* ticked and the
   **tourkokan target ticked**.

> Copying the file in Finder is **not** enough. If it isn't a target member it never reaches the
> app bundle, and `FirebaseApp.configure()` crashes on launch.

### 3.3 Google Maps

Create a **new, iOS-restricted** key in Google Cloud (restrict to bundle id `com.tourkokan` —
do not reuse the Android key, Android keys are restricted by SHA-1 and will be rejected). Enable
**Maps SDK for iOS** on it. Paste it into the empty `GMSApiKey` string in `Info.plist`.

### 3.4 Google Sign-In

Used in `Email.js`, `SignUp.js` and `ProfileView.js`. Open `GoogleService-Info.plist`, copy the
`REVERSED_CLIENT_ID` value, and add to `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array><string>PASTE_REVERSED_CLIENT_ID_HERE</string></array>
  </dict>
</array>
```

Without this, Google sign-in opens and then fails to return to the app.

---

## 4. Run on the simulator

Get this green **before** touching a physical device — it separates build problems from signing
problems.

```bash
npm start          # terminal 1 — Metro
npm run ios        # terminal 2
```

---

## 5. Run on a physical iPhone

Verified target for this project: **iPhone 15 Plus**.

### 5.1 On the phone

Settings → Privacy & Security → **Developer Mode** → on → restart.

> The Developer Mode row only appears *after* the phone has been plugged into a Mac running Xcode
> at least once. Required on iOS 16 and later.

### 5.2 In Xcode

*Signing & Capabilities* → tick **Automatically manage signing** → select your Team.

A free Apple ID works, with limits: the build **expires after 7 days**, and you can register only
a handful of devices. A paid Apple Developer Program membership ($99/yr) removes both.

### 5.3 Build

Plug in over USB, unlock the phone, tap **Trust This Computer**, then:

```bash
npm run ios:device
```

First launch on a free account also needs: phone → Settings → General → VPN & Device Management →
trust your developer certificate.

---

## 6. Environment files

Android selects `.env` per Gradle flavour (`local` → `.env`, `qa` → `.env.development`,
`production` → `.env.production`). **iOS has no flavours configured**, so it always defaults to
`.env`. Override per build with `ENVFILE`:

```bash
ENVFILE=.env.development npm run ios      # QA backend
ENVFILE=.env.production  npm run ios:release
```

> ⚠️ Same trap as Android: a release build with no `ENVFILE` set ships pointing at the **test
> API**. See the `env-app-env-gotcha` note. If you set up iOS schemes later, bake `ENVFILE` into
> each scheme's Run/Archive pre-actions so it can't be forgotten.

---

## 7. Platform differences to expect

| Concern | Android | iOS |
|---|---|---|
| `react-native-edge-to-edge` | Native module; app is edge-to-edge | **No iOS native module.** Checked the source: `SystemBars` falls back to `StatusBar` on iOS, so all 32 screens are safe — but edge-to-edge layout is Android-only. |
| Screenshot blocking | `FLAG_SECURE` in `MainActivity.kt` | No equivalent. Screenshots and screen recording work on iOS. |
| Hardware back | `android:enableOnBackInvokedCallback="false"` in the manifest is **required** (targetSdk 36 + RN 0.78 kills every `BackHandler` otherwise) | No hardware back button. Swipe-back gesture is handled by the navigator. |
| Icon fonts | `fonts.gradle` copies them | Must be in `UIAppFonts` (done) **and** shipped by the `RNVectorIcons` pod (its podspec declares `s.resources = "Fonts/*.ttf"`, so `pod install` handles it). |
| Permissions | `AndroidManifest.xml` | `Info.plist` usage strings — a missing one is a **crash**, not a denied prompt. |

---

## 8. Troubleshooting

**`pod install` fails on Firebase or Google Maps**
```bash
npm run pods:clean
```
This is the most common first-run failure; the Firebase + Google Maps combination frequently needs
a `--repo-update`.

**Build errors about missing modules / duplicate symbols**
You opened `.xcodeproj` instead of `.xcworkspace`. Close it and open the workspace.

**App crashes immediately on launch, no JS logs**
`GoogleService-Info.plist` is missing from the target. Xcode → target → *Build Phases* → *Copy
Bundle Resources* — the file must be listed there.

**All icons are blank squares**
The `UIAppFonts` entries and the actual `.ttf` files disagree. Confirm the fonts landed in the
bundle: Xcode → *Build Phases* → *Copy Bundle Resources*.

**Maps are blank/grey but the app runs**
`GMSApiKey` is empty, the key isn't restricted to `com.tourkokan`, or **Maps SDK for iOS** isn't
enabled on that key in Google Cloud.

**WhatsApp / phone links do nothing**
`LSApplicationQueriesSchemes` is missing the scheme. Already configured — check it survived any
`Info.plist` merge.

**Metro connection errors on device**
Device and Mac must be on the same Wi-Fi, or use `npx react-native start --host 0.0.0.0` and set
the debug server host in the app's dev menu (shake the device).

---

## 9. Checklist

- [ ] Full Xcode installed, `xcode-select` points at it, licence accepted
- [ ] CocoaPods installed
- [ ] `pod install` succeeded, `tourkokan.xcworkspace` exists
- [ ] Bundle id changed to `com.tourkokan`
- [ ] `GoogleService-Info.plist` added **to the target**
- [ ] `GMSApiKey` filled in `Info.plist`
- [ ] `CFBundleURLTypes` reversed client id added
- [ ] Signing team selected
- [ ] Runs on simulator
- [ ] Developer Mode on the iPhone, computer trusted
- [ ] Runs on the iPhone 15 Plus
