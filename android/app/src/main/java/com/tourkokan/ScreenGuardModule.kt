package com.tourkokan

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Toggles FLAG_SECURE on the current Activity window so individual screens can block
 * screenshots / screen-recording. The app no longer sets FLAG_SECURE globally (screenshots
 * are allowed by default); JS calls enable() when a sensitive screen — e.g. the vendor
 * "Verify" step that shows a registration number and certificate — is on screen, and
 * disable() when it leaves. Android only; iOS has no equivalent hard block.
 */
class ScreenGuardModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ScreenGuard"

    @ReactMethod
    fun enable() {
        val activity = currentActivity ?: return
        activity.runOnUiThread {
            activity.window.setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE,
            )
        }
    }

    @ReactMethod
    fun disable() {
        val activity = currentActivity ?: return
        activity.runOnUiThread {
            activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
}
