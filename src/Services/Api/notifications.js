/**
 * Unread-count refresh.
 *
 * The old version lived inside HomeScreen and ended with `?? 0`:
 *
 *   const n = d?.unread_message_count ?? d?.count ?? d?.unread_count ?? 0;
 *   setUnreadCount(n);
 *
 * Because `comnPost` RESOLVES on failure rather than rejecting, a 401, a 500, a
 * dropped connection or any unexpected envelope all fell through to that `?? 0`
 * and blanked a correct badge — while the inbox, fetched fresh on entry, still
 * listed unread rows. That mismatch is the bug this file fixes: the count is
 * only ever written when the server actually returned a number.
 */
import {comnPost} from './CommonServices';
import {createLogger} from '../Logger';
import store from '../../../Store';
import {unreadLoading, unreadSet} from '../../Reducers/notificationsSlice';

const log = createLogger('notifications');

/** Backend: sendResponse(['count' => N]) — accept the older aliases too. */
const readCount = body => {
  const d = body?.data;
  const n = d?.count ?? d?.unread_message_count ?? d?.unread_count;
  return typeof n === 'number' ? n : Number.isFinite(Number(n)) ? Number(n) : null;
};

/**
 * Refresh the badge. Safe to call often — it never clears a good value just
 * because a request failed.
 */
export const refreshUnreadCount = async ({navigation} = {}) => {
  try {
    store.dispatch(unreadLoading(true));
    const res = await comnPost('v2/unreadMessageCount', {}, navigation);
    const body = res?.data;

    // Explicit failure, or a blocked/offline call — leave the last known count
    // alone rather than lying with a zero.
    if (!body || body.success === false || body.blocked) {
      store.dispatch(unreadLoading(false));
      return null;
    }

    const n = readCount(body);
    if (n === null) {
      log.warn('[unread] unexpected response shape', body?.data);
      store.dispatch(unreadLoading(false));
      return null;
    }

    store.dispatch(unreadSet(n));
    return n;
  } catch (e) {
    log.warn('[unread] failed', e);
    store.dispatch(unreadLoading(false));
    return null;
  }
};

export default refreshUnreadCount;
