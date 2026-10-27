import {NativeModules, Platform} from 'react-native';

/**
 * Per-screen screenshot / screen-recording block.
 *
 * The app allows screenshots by default (FLAG_SECURE is no longer set globally).
 * Sensitive screens call blockScreenshots() on enter and allowScreenshots() on leave.
 * Android-only — iOS has no equivalent hard block, so these are no-ops there.
 */
const {ScreenGuard} = NativeModules;

export const blockScreenshots = () => {
  if (Platform.OS === 'android' && ScreenGuard?.enable) {
    ScreenGuard.enable();
  }
};

export const allowScreenshots = () => {
  if (Platform.OS === 'android' && ScreenGuard?.disable) {
    ScreenGuard.disable();
  }
};
