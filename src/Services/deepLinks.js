/**
 * Deep links — referral invites.
 *
 * Two URL shapes resolve to the same thing:
 *
 *   https://tourkokan.com/invite/{code}   Android App Link (verified via
 *                                         /.well-known/assetlinks.json). Opens
 *                                         the app when installed, the website
 *                                         when not — which is why referral
 *                                         links use it: most recipients are not
 *                                         users yet.
 *   tourkokan://invite/{code}             Custom scheme. Needs no domain
 *                                         verification, so it works for testing
 *                                         before the well-known file is hosted.
 *                                         Fails silently without the app, so it
 *                                         is a fallback, never the shared link.
 *
 * The handler deliberately only PARKS the code in storage. The referral plumbing
 * already exists — OnboardingScreen writes STORAGE.REFERRAL_CODE, Email.js reads
 * it for googleAuth, and SignUp prefills its field from it — so parking is
 * enough, and it avoids driving navigation from outside the navigator.
 */
import {Linking} from 'react-native';
import {saveToStorage} from './Api/CommonServices';
import STRING from './Constants/STRINGS';
import {createLogger} from './Logger';

const log = createLogger('deepLinks');

/** Referral codes are the user's `uid` — alphanumeric, dashes/underscores. */
const CODE = /^[A-Za-z0-9_-]{3,64}$/;

/**
 * Pull a referral code out of a deep link, or null if the URL isn't one.
 * Tolerates a trailing slash, a query string, and either URL shape.
 */
export const parseReferral = url => {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/(?:^tourkokan:\/\/|\/\/[^/]+\/)?invite\/([^/?#]+)/i);
  if (!m) return null;
  const code = decodeURIComponent(m[1]).trim();
  return CODE.test(code) ? code : null;
};

const handleUrl = async url => {
  const code = parseReferral(url);
  if (!code) return false;
  try {
    await saveToStorage(STRING.STORAGE.REFERRAL_CODE, code);
    log.flow('[deeplink] referral code stored');
    return true;
  } catch (e) {
    log.warn('[deeplink] could not store referral code', e);
    return false;
  }
};

/**
 * Wire up both entry points. Returns an unsubscribe function.
 *
 * Both are required and they are NOT interchangeable: getInitialURL covers a
 * cold start (the app was not running, so no event ever fires), addEventListener
 * covers a warm one (already running/backgrounded, so there is no initial URL).
 * Handling only one silently drops half the taps.
 */
export const initDeepLinks = () => {
  Linking.getInitialURL()
    .then(url => url && handleUrl(url))
    .catch(e => log.warn('[deeplink] getInitialURL failed', e));

  const sub = Linking.addEventListener('url', ({url}) => handleUrl(url));
  return () => sub.remove();
};

/** The link to share. Uses the https form so it works without the app too. */
export const referralLink = code => `https://tourkokan.com/invite/${encodeURIComponent(code)}`;

export default initDeepLinks;
