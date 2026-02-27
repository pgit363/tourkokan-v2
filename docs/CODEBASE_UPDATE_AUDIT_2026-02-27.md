# TourKokan Codebase Update Audit
Date: 2026-02-27

## Scope
- Repository-wide static review
- Build/config review (Android/iOS/Jest/Babel)
- Automated checks: lint + tests

## Executive Summary
- Codebase size: 132 source files, about 19,281 LOC under `src/`.
- Biggest concentration of logic is in a few very large screens (`HomeScreen`, `SignUp`, `CityDetails`, `ProfileView`).
- Lint status: 948 findings (106 errors, 842 warnings) across 98 files.
- Test status: failing at startup (`RNGestureHandlerModule` missing in Jest environment).
- Security/release blockers exist: hardcoded keys and signing credentials in source/build files.

## Evidence Snapshot
- `npm run lint` -> failed with 106 errors and 842 warnings.
- `npm test -- --watchAll=false` -> failed in `__tests__/App.test.tsx` due to unmocked native module.
- Top lint rules by volume: `no-unused-vars`, `react-native/no-inline-styles`, `react-hooks/exhaustive-deps`, `no-undef`.

## Major Updates (High Priority)

### 1. Secrets and signing credential handling (P0)
Risk: security exposure, compromised signing pipeline, hard-to-rotate credentials.

Findings:
- Firebase config hardcoded in app source.
- Android Maps API key hardcoded in manifest.
- Android release keystore path and passwords hardcoded in Gradle.
- Environment files tracked in git.

References:
- [App.js](/Users/pranavkamble/Documents/tourkokan-v2/App.js):73
- [AndroidManifest.xml](/Users/pranavkamble/Documents/tourkokan-v2/android/app/src/main/AndroidManifest.xml):21
- [build.gradle](/Users/pranavkamble/Documents/tourkokan-v2/android/app/build.gradle):108
- [.env](/Users/pranavkamble/Documents/tourkokan-v2/.env)
- [.env.development](/Users/pranavkamble/Documents/tourkokan-v2/.env.development)
- [.env.production](/Users/pranavkamble/Documents/tourkokan-v2/.env.production)

Required updates:
- Move all API keys/signing credentials to secure CI/CD secrets and local untracked env files.
- Replace hardcoded signing config with `gradle.properties`/environment-based lookup.
- Rotate exposed keys and regenerate release keystore if it was shared.
- Add `.env*` and keystore patterns to `.gitignore` and clean git history for secrets if needed.

### 2. Runtime correctness and lint error cleanup baseline (P0)
Risk: production crashes, undefined behavior, broken screens.

Findings:
- Undefined variables and duplicate keys exist.
- Hook dependency errors are widespread and can cause stale state bugs.
- Known concrete defects:
1. Undefined `navigation` in `SearchScreen`.
2. Undefined `props` usage in `CityCard`.
3. Duplicate object keys in constants/styles.

References:
- [SearchScreen.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Screens/SearchScreen.js):7
- [CityCard.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Components/Cards/CityCard.js):40
- [STRINGS.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Services/Constants/STRINGS.js):94
- [Styles.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Screens/Styles.js):680

Required updates:
- Set quality gate: zero eslint errors first, warnings reduced in controlled phases.
- Fix all `no-undef`, `no-dupe-keys`, and hook dependency errors before feature work.
- Add CI lint gate (`eslint . --max-warnings=0` after cleanup target is reached).

### 3. Authentication/session architecture consolidation (P0)
Risk: inconsistent login behavior, token desync, hard-to-debug auth state.

Findings:
- Multiple login screens implement overlapping token/storage logic differently.
- Endpoints are inconsistent (`auth/login` vs `v2/auth/login`).
- Token management splits across Redux and AsyncStorage with weak synchronization.
- `AsyncStorage.clear()` on 401 can remove unrelated app state.

References:
- [Email.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Screens/AuthScreens/Email.js):65
- [EmailSignIn.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Screens/AuthScreens/EmailSignIn.js):243
- [PasswordLogin.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Screens/AuthScreens/PasswordLogin.js):98
- [CommonServices.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Services/Api/CommonServices.js):41

Required updates:
- Build single `authService` with one canonical login flow and endpoint contract.
- Move token to secure storage mechanism (not plain AsyncStorage) and normalize refresh/logout handling.
- Replace `AsyncStorage.clear()` with targeted key deletion.
- Introduce typed API response guards before state writes.

### 4. Navigation architecture hardening (P1)
Risk: routing instability and localization coupling.

Findings:
- Route names are translation-driven (`t('SCREEN.*')`) instead of stable constants.
- Dynamic translation-based route names couple navigation identity to i18n values.
- Stack login state is hardcoded (`isLoggedIn` initialized `true`) and not sourced from auth state.

References:
- [StackNavigator.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Navigators/StackNavigator.js):53
- [TabNavigator.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Navigators/TabNavigator.js):61

Required updates:
- Define immutable route constants (e.g. `ROUTES.HOME`) and keep labels translated separately.
- Drive auth stack selection from centralized auth state bootstrap.
- Add deep-link configuration aligned with actual route graph and names.

### 5. Testability foundation and CI verification (P1)
Risk: regressions ship undetected.

Findings:
- Jest test suite cannot start due to missing mocks for native modules.
- No meaningful coverage around auth/API/navigation critical paths.

References:
- [App.test.tsx](/Users/pranavkamble/Documents/tourkokan-v2/__tests__/App.test.tsx):1
- [jest.config.js](/Users/pranavkamble/Documents/tourkokan-v2/jest.config.js):1

Required updates:
- Add `jest.setup.js` with mocks for gesture handler, reanimated, native async modules.
- Split `App` bootstrap side effects into testable units/hooks.
- Add smoke tests for auth bootstrap, route guards, and API failure handling.

### 6. Large-file decomposition and state management simplification (P1)
Risk: slow delivery velocity, fragile changes, high merge conflict rate.

Findings:
- Very large files carry mixed concerns (UI + network + storage + navigation + analytics).
- `HomeScreen` and auth screens combine orchestration and rendering in one component.

References:
- [HomeScreen.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Screens/HomeScreen.js):1
- [SignUp.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Screens/AuthScreens/SignUp.js):1
- [ProfileView.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Screens/ProfileView.js):1

Required updates:
- Extract data hooks (`useLandingData`, `useAuthBootstrap`, `useProfileData`).
- Move API/storage logic out of components into services.
- Break screens into container + presentational components.

## Minor Updates (Medium/Low Priority)

### A. Cleanup dead code and stale files
- Remove or archive unused files like `Categories copy.js`.
- Delete commented-out SQLite stubs and unused variables/imports.
- Remove placeholder endpoint definitions if unused.

References:
- [Categories copy.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Screens/ListPages/Categories copy.js)
- [Endpoints.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Services/Api/Endpoints.js):1

### B. Console logging and error hygiene
- Replace production `console.log` with controlled logger and environment gating.
- Standardize user-facing error messages and telemetry reporting.

References:
- [CommonServices.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Services/Api/CommonServices.js):14
- [ProfileView.js](/Users/pranavkamble/Documents/tourkokan-v2/src/Screens/ProfileView.js):235

### C. Asset optimization
- Assets are heavy (about 47MB images + about 8MB fonts).
- Compress, deduplicate, and lazy-load large image sets.

References:
- `src/Assets/Images` (about 47MB)
- `src/Assets/Fonts` (about 7.9MB)

### D. Native permission and policy alignment
- Revisit deprecated/unnecessary Android permissions (`GET_ACCOUNTS`, `USE_CREDENTIALS`, `WRITE_EXTERNAL_STORAGE`).
- Fill mandatory iOS purpose strings (location usage is empty).

References:
- [AndroidManifest.xml](/Users/pranavkamble/Documents/tourkokan-v2/android/app/src/main/AndroidManifest.xml):7
- [Info.plist](/Users/pranavkamble/Documents/tourkokan-v2/ios/tourkokan/Info.plist):35

### E. Dependency hygiene
- Remove questionable dependencies not needed in app runtime (`install`, `npm` package entries).
- Align package choices and keep only one env strategy (`react-native-config` vs dotenv plugin usage).

References:
- [package.json](/Users/pranavkamble/Documents/tourkokan-v2/package.json):1
- [babel.config.js](/Users/pranavkamble/Documents/tourkokan-v2/babel.config.js):1

### F. Documentation and developer workflows
- Replace generic RN README with project-specific setup, env, release, and troubleshooting docs.
- Add contribution guide and CI requirements.

References:
- [README.md](/Users/pranavkamble/Documents/tourkokan-v2/README.md):1

## Suggested Execution Plan

### Phase 1 (Week 1): Stabilize and secure
- Remove/rotate exposed secrets and fix signing configuration.
- Fix all eslint errors (not warnings yet).
- Fix Jest bootstrap (native mocks) and get one passing smoke test.

### Phase 2 (Week 2): Auth/navigation hardening
- Consolidate login/session flow and endpoint consistency.
- Move to stable route constants independent of translation values.
- Add auth bootstrap and route-guard tests.

### Phase 3 (Weeks 3-4): Refactor for maintainability
- Split large screens into hooks/services/presentational components.
- Reduce warnings by category (`no-unused-vars`, inline styles, hook deps).
- Standardize API error handling and logging.

### Phase 4 (Week 5+): Performance and polish
- Optimize assets and list rendering hot spots.
- Expand test coverage for critical journeys.
- Finalize docs and release checklist automation.

## Acceptance Criteria
- No hardcoded secrets or signing passwords in repo.
- `npm run lint` passes with zero errors.
- `npm test -- --watchAll=false` passes in CI.
- Auth flows unified and endpoint versions consistent.
- Stable route constants used across navigation.

