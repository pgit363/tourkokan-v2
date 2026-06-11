# Logging — tourkokan-v2

One event pipeline (`src/Services/Logger.js`). Sources emit events; sinks
consume them. The default console sink is gated by `ENV` (`.env` → `@env`):

| ENV           | console output                          |
|---------------|------------------------------------------|
| `development` | everything (debug/info/warn/error)       |
| `production`  | warn + error only, **plus** `installConsoleGate()` no-ops all stray `console.log/info/debug` app-wide |

## What is logged automatically (no code needed)

| Source              | Where wired                                | Event tag       |
|---------------------|--------------------------------------------|-----------------|
| Every screen visit  | `StackNavigator.js` → `createNavigationLogger` on `NavigationContainer` | `[NAV][Navigation]` |
| Every API call      | `CommonServices.js` axios interceptors (method, url, status, duration)  | `[API][CommonServices]` |
| Every redux action  | `Store.js` → `reduxLoggerMiddleware`       | `[STATE][Redux]` |
| Uncaught JS errors  | `index.js` → `installGlobalErrorLogger()`  | `[CRASH][Global]` |
| React render errors | `ErrorBoundary.js`                         | `[ErrorBoundary]` |

**Do not** add manual logs for navigation, API calls, redux actions, or crashes
— they're already captured at the chokepoints above.

## Manual logging (domain-specific moments only)

```js
import {createLogger} from '../Services/Logger'; // adjust relative path
const log = createLogger('HomeScreen');          // tag = module name

log.debug('raw value', value);     // dev-only diagnostic detail
log.info('profile applied');       // dev-only lifecycle milestone
log.warn('cache miss, refetching');// recoverable problem (kept in prod)
log.error('login failed', err);    // failure (kept in prod)
log.flow('NetInfo fired, connected=', c); // data-flow tracing ([FLOW] successor)
```

Level guide (SDLC):
- **debug** — values/branches useful only while actively debugging.
- **info** — coarse lifecycle milestones a future debugger would want.
- **warn** — something unexpected but recovered (caught errors, fallbacks).
- **error** — operation failed and the user may notice. Always pass the `Error`.

Rules:
- One `createLogger('<ModuleName>')` per file, tag = file/screen name.
- Never `console.*` in new code — ESLint `no-console` should flag it; use the logger.
- Never log secrets, tokens, passwords, or full user PII.
- Filter on device: `adb logcat | grep '\[HomeScreen\]'` or `grep '\[API\]'`.

## Adding a sink (e.g. Crashlytics, analytics, remote log buffer)

```js
import {addLogSink} from './src/Services/Logger';

addLogSink(({ts, level, kind, tag, args}) => {
  if (level === 'error') crashlytics().recordError(args[0]);
});
```

Sinks receive every event regardless of ENV — each sink decides its own
filtering. A throwing sink is swallowed; it can never break the app.
