# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# React Native Vector Icons (fonts)
-keep class com.oblador.vectoricons.** { *; }

# React Native Fast Image (Glide)
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule { <init>(...); }
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** { **[] $VALUES; public *; }
-keep class com.dylanvann.fastimage.** { *; }

# SVG support
-keep public class com.horcrux.svg.** { *; }

# OkHttp (networking)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ── R8 enabled (obfuscation/shrinking). Defensive keeps for reflection-heavy libs so
#    the minified release behaves like debug. Most RN libs ship their own consumer rules;
#    these cover the ones most likely to break and this app's own (small) native code. ──

# This app's native code: MainActivity/MainApplication + the ScreenGuard native module,
# referenced by name from the RN bridge. Tiny package, so keeping it costs no meaningful
# obfuscation while avoiding component/module registration breakage.
-keep class com.tourkokan.** { *; }

# Software Mansion suite: Reanimated, Gesture Handler, Screens.
-keep class com.swmansion.** { *; }
-dontwarn com.swmansion.**

# react-native-maps
-keep class com.rnmaps.** { *; }
-keep class com.google.android.gms.maps.** { *; }
-dontwarn com.google.android.gms.maps.**

# react-native-sqlite-storage (older, reflection-based)
-keep class org.pgsqlite.** { *; }

# Keep native-module entry points and JS-interface methods across all libraries.
-keepclassmembers class * { @com.facebook.react.bridge.ReactMethod <methods>; }
-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { <methods>; }
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }

# Hermes / JSC + annotations.
-keep class com.facebook.proguard.annotations.DoNotStrip { *; }
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
