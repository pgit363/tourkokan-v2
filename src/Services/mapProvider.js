/**
 * Which map engine to render with, per platform.
 *
 * WHY THIS EXISTS — on iOS, `provider={PROVIDER_GOOGLE}` makes react-native-maps
 * construct a GMSMapView, and the Google Maps SDK **raises an NSException and
 * aborts the whole process** if `GMSServices.provideAPIKey()` was never called
 * with a real key. Not a red box — a native SIGABRT that kicks the user back to
 * the home screen. That is what made every detail page crash on iOS while
 * `GMSApiKey` in Info.plist was still the empty placeholder.
 *
 * Android has no such precondition (the key lives in the manifest and a missing
 * one just yields blank tiles), so Android always gets Google.
 *
 * On iOS we only opt into Google when a key is actually configured; otherwise we
 * fall back to Apple Maps, which is native, needs no key and cannot crash.
 *
 * TO ENABLE GOOGLE MAPS ON iOS:
 *   1. Create an iOS-restricted key in Google Cloud (bundle id com.tourkokan)
 *      with "Maps SDK for iOS" enabled.
 *   2. Put it in GOOGLE_MAPS_API_KEY_IOS in .env / .env.development /
 *      .env.production. That single value feeds BOTH this check and the
 *      GMSApiKey entry in Info.plist, so the two can never drift apart.
 */
import {Platform} from 'react-native';
import {PROVIDER_GOOGLE} from 'react-native-maps';
import {GOOGLE_MAPS_API_KEY_IOS} from '@env';

// An unsubstituted "$(VAR)" means the build-time substitution did not run —
// treat that as "not configured" rather than passing junk to the Maps SDK.
const iosKey = String(GOOGLE_MAPS_API_KEY_IOS || '').trim();
export const iosGoogleMapsReady = iosKey.length > 0 && !iosKey.includes('$(');

/**
 * Pass straight to <MapView provider={mapProvider}>. `undefined` is the correct
 * value for "platform default" — Apple Maps on iOS, Google Maps on Android.
 */
export const mapProvider =
  Platform.OS === 'android' || iosGoogleMapsReady ? PROVIDER_GOOGLE : undefined;

export default mapProvider;
