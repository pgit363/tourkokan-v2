import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import GoogleMaps
import GoogleSignIn

@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    // Firebase must be configured BEFORE React Native starts, or the first
    // @react-native-firebase call throws
    // "No Firebase App '[DEFAULT]' has been created".
    // Requires ios/tourkokan/GoogleService-Info.plist (downloaded from the
    // Firebase console for the iOS bundle id) to be added to the Xcode target.
    FirebaseApp.configure()

    // Google Maps. The app renders with PROVIDER_GOOGLE, which on iOS shows
    // blank tiles unless a key is supplied here. Read from Info.plist rather
    // than hardcoded so the key is not committed in source.
    if let mapsKey = Bundle.main.object(forInfoDictionaryKey: "GMSApiKey") as? String,
       !mapsKey.isEmpty {
      GMSServices.provideAPIKey(mapsKey)
    }

    self.moduleName = "tourkokan"
    self.dependencyProvider = RCTAppDependencyProvider()

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Google Sign-In redirects back to the app via the reversed-client-id URL
  // scheme (CFBundleURLTypes in Info.plist). With the new-architecture
  // RCTAppDelegate the template's openURL handler is gone, so without this the
  // OAuth callback is dropped and GoogleSignin reports {type: "cancelled"} even
  // after a successful sign-in. Forward the URL to GIDSignIn first, then fall
  // back to RN Linking for any other deep links.
  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    if GIDSignIn.sharedInstance.handle(url) {
      return true
    }
    return super.application(app, open: url, options: options)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
