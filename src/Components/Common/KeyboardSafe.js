/**
 * KeyboardSafe — the one place that knows how this app gets out of the
 * keyboard's way. Wrap any screen or sheet that contains an editable field.
 *
 * WHY THIS EXISTS
 *
 * AndroidManifest declares `android:windowSoftInputMode="adjustResize"`, and on
 * Android 15+ that line does nothing. The app is edge-to-edge
 * (react-native-edge-to-edge, required once we target SDK 35+), and that
 * library's own README says it plainly: enabling edge-to-edge "disrupts Android
 * keyboard management (android:windowSoftInputMode=adjustResize)". The window
 * no longer shrinks when the IME opens — the app simply draws behind it.
 *
 * So every approach that depended on that resize silently stopped working on
 * newer devices while continuing to work on older ones, which is exactly why
 * this reads as "a bug on some devices":
 *
 *   behavior="height"     needs the window to resize        → does nothing
 *   behavior={undefined}  no avoidance at all on Android    → does nothing
 *   no wrapper            relied on adjustResize            → does nothing
 *
 * `behavior="padding"` does NOT depend on a resize. It pads by the keyboard
 * height that React Native measures from its own Keyboard events, which fire on
 * both platforms regardless of edge-to-edge. That makes it correct on iOS and
 * Android alike — so there is deliberately no Platform branch here. A branch is
 * one more thing to get wrong, and getting it wrong is what caused this.
 *
 * INSIDE A <Modal>
 *
 * An RN Modal is a separate Android window and never inherits the activity's
 * soft-input mode under any configuration. A modal containing a field must have
 * this wrapper INSIDE the Modal, around the sheet — putting it outside does
 * nothing at all.
 *
 *   <Modal ...>
 *     <KeyboardSafe>
 *       <Pressable style={backdrop}>…sheet…</Pressable>
 *     </KeyboardSafe>
 *   </Modal>
 *
 * NOT NEEDED FOR
 *
 * A search field pinned to the top of a screen. The keyboard covers the bottom;
 * a top-anchored input is never behind it, and padding the container would only
 * squash the results list.
 *
 * LATER
 *
 * react-native-keyboard-controller is what react-native-edge-to-edge actually
 * recommends, and it handles IME insets natively instead of inferring them from
 * events. It is a native dependency, so it needs a rebuild on both platforms —
 * worth doing outside a release window. If it lands, this file is the only
 * place that has to change.
 */
import React from 'react';
import {KeyboardAvoidingView, StyleSheet} from 'react-native';

const KeyboardSafe = ({offset = 0, style, children, ...rest}) => (
  <KeyboardAvoidingView
    style={[styles.fill, style]}
    behavior="padding"
    keyboardVerticalOffset={offset}
    {...rest}>
    {children}
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  fill: {flex: 1},
});

export default KeyboardSafe;
