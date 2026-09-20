/**
 * Backend-driven app update check.
 *
 * The store-based `react-native-version-check` needUpdate() is unreliable
 * (Android Play Store scraping breaks, iOS needs a live listing), so we drive
 * updates from our own backend instead: `v2/appVersion` returns the latest
 * `version_number` and a `min_supported_version` from the AppVersion table.
 * The app compares its installed version against those.
 */
import {Platform} from 'react-native';
import VersionCheck from 'react-native-version-check';
import {comnPost} from './Api/CommonServices';
import {createLogger} from './Logger';

const log = createLogger('appUpdate');

/**
 * Compare two dotted version strings numerically.
 * @returns {number} 1 if a>b, -1 if a<b, 0 if equal. e.g. ("2.0.4","2.0.5") => -1
 */
export const compareVersions = (a, b) => {
  const pa = String(a ?? '').split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b ?? '').split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
};

const safeStoreUrl = async () => {
  try {
    return await VersionCheck.getStoreUrl();
  } catch (e) {
    return null;
  }
};

/**
 * Ask the backend for the latest version and decide what to do.
 *
 * @returns {Promise<{status: 'forced'|'update'|'uptodate'|'unknown', storeUrl: string|null}>}
 *   forced   — installed < min_supported_version → non-dismissable update
 *   update   — installed < version_number        → dismissable "update available"
 *   uptodate — installed is current
 *   unknown  — couldn't determine (network/parse); never nag the user
 */
export const checkAppUpdate = async () => {
  try {
    const current = VersionCheck.getCurrentVersion();
    const res = await comnPost('v2/appVersion', {platform: Platform.OS});
    const data = res?.data?.data;

    if (!data?.version_number) {
      return {status: 'unknown', storeUrl: null};
    }

    const latest = data.version_number;
    const min = data.min_supported_version;
    const storeUrl = data.update_url || (await safeStoreUrl());

    if (min && compareVersions(current, min) < 0) {
      return {status: 'forced', storeUrl};
    }
    if (compareVersions(current, latest) < 0) {
      return {status: 'update', storeUrl};
    }
    return {status: 'uptodate', storeUrl: null};
  } catch (e) {
    log.debug('checkAppUpdate failed', e);
    return {status: 'unknown', storeUrl: null};
  }
};
