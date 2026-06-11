/**
 * Logger — global, event-based, env-gated logging for tourkokan-v2.
 *
 * Architecture: everything is a log EVENT flowing through one pipeline:
 *
 *   sources ──────────────► emit(event) ──► sinks (subscribers)
 *   • navigation chokepoint (onNavigationReady/StateChange → every screen visit)
 *   • axios interceptors   (CommonServices → every API call)
 *   • redux middleware     (reduxLoggerMiddleware → every action)
 *   • global error handler (installGlobalErrorLogger → every uncaught JS error)
 *   • manual createLogger() calls (domain-specific moments only)
 *
 * The default sink prints to the console, gated by the ENV build variable:
 *   development → everything · production → warn + error only.
 * Add more sinks (Crashlytics, analytics, file buffer) with addLogSink() —
 * no call site changes needed.
 *
 * Manual usage (only where auto-instrumentation can't see the intent):
 *   import {createLogger} from '../Services/Logger';
 *   const log = createLogger('HomeScreen');
 *   log.debug(...) log.info(...) log.warn(...) log.error(...)
 *   log.flow(...)  // screen/data lifecycle tracing (successor of [FLOW])
 *   log.api(...)   // API tracing (used by the axios interceptors)
 */

import {ENV} from '@env';

const LEVELS = {debug: 0, info: 1, warn: 2, error: 3, silent: 4};
const IS_PROD = ENV === 'production';

// ── Event pipeline ─────────────────────────────────────────────────────────────

// A sink receives {ts, level, kind, tag, args}. Returning is fire-and-forget.
const sinks = [];

/** Subscribe a sink, e.g. Crashlytics/analytics. Returns an unsubscribe fn. */
export const addLogSink = sink => {
  sinks.push(sink);
  return () => {
    const i = sinks.indexOf(sink);
    if (i >= 0) {sinks.splice(i, 1);}
  };
};

const emit = (level, tag, kind, args) => {
  const event = {ts: Date.now(), level, kind, tag, args};
  for (const sink of sinks) {
    try {
      sink(event);
    } catch (e) {
      // a broken sink must never break the app
    }
  }
};

// ── Default console sink (env-gated) ───────────────────────────────────────────

const MIN_LEVEL = IS_PROD ? LEVELS.warn : LEVELS.debug;

// HH:mm:ss.SSS — enough to order events; date is noise on-device.
const fmtTs = ts => new Date(ts).toISOString().slice(11, 23);

// console.debug is hidden by default in some inspectors — route debug→log.
const CONSOLE_FN = {
  debug: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

addLogSink(({ts, level, kind, tag, args}) => {
  if (LEVELS[level] < MIN_LEVEL) {return;}
  const head = kind
    ? `${fmtTs(ts)} [${level.toUpperCase()}][${kind}][${tag}]`
    : `${fmtTs(ts)} [${level.toUpperCase()}][${tag}]`;
  CONSOLE_FN[level](head, ...args);
});

// ── Manual tagged loggers ──────────────────────────────────────────────────────

/**
 * Create a tagged logger. Tag with the screen/component/service name so
 * output is filterable per module (e.g. adb logcat | grep '\[HomeScreen\]').
 */
export const createLogger = tag => ({
  debug: (...a) => emit('debug', tag, null, a),
  info: (...a) => emit('info', tag, null, a),
  warn: (...a) => emit('warn', tag, null, a),
  error: (...a) => emit('error', tag, null, a),
  /** Screen/data lifecycle tracing — successor of the ad-hoc [FLOW] logs. */
  flow: (...a) => emit('debug', tag, 'FLOW', a),
  /** API request/response tracing. */
  api: (...a) => emit('debug', tag, 'API', a),
});

// ── Auto-instrumentation: navigation ───────────────────────────────────────────
// Wire to NavigationContainer — logs EVERY screen visit with zero per-screen code:
//   const handlers = createNavigationLogger(navigationRef);
//   <NavigationContainer ref={navigationRef} onReady={handlers.onReady}
//                        onStateChange={handlers.onStateChange}>

export const createNavigationLogger = navigationRef => {
  let currentRoute = null;
  return {
    onReady: () => {
      currentRoute = navigationRef.current?.getCurrentRoute()?.name ?? null;
      emit('info', 'Navigation', 'NAV', ['app ready → screen:', currentRoute]);
    },
    onStateChange: () => {
      const next = navigationRef.current?.getCurrentRoute()?.name ?? null;
      if (next !== currentRoute) {
        emit('info', 'Navigation', 'NAV', [currentRoute, '→', next]);
        currentRoute = next;
      }
    },
  };
};

// ── Auto-instrumentation: redux ────────────────────────────────────────────────
// Add to configureStore middleware — logs every dispatched action (dev only via
// the console sink gate; other sinks can decide for themselves).

export const reduxLoggerMiddleware = () => next => action => {
  emit('debug', 'Redux', 'STATE', [action?.type ?? '(unknown action)']);
  return next(action);
};

// ── Auto-instrumentation: uncaught JS errors ───────────────────────────────────
// Catches errors outside the React render tree (ErrorBoundary handles those).

export const installGlobalErrorLogger = () => {
  if (typeof ErrorUtils === 'undefined' || !ErrorUtils.setGlobalHandler) {return;}
  const previous = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    emit('error', 'Global', 'CRASH', [isFatal ? 'FATAL' : 'non-fatal', error]);
    previous && previous(error, isFatal);
  });
};

// ── Production console gate ────────────────────────────────────────────────────

/**
 * Call once at app entry (index.js). In production builds, silences any
 * console.log/info/debug left anywhere in the codebase; warn/error stay.
 */
export const installConsoleGate = () => {
  if (!IS_PROD) {return;}
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
};

export default createLogger;
