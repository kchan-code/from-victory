# From Victory — R8 keep rules for the release build (FV-740).
#
# The shell is a thin Capacitor host: almost everything it does is reached by
# name from outside the compiler's view (the WebView's JavaScript bridge, the
# Android manifest, and one Class.forName). R8 cannot see those callers, so the
# classes below are kept whole. Keeping them costs little: this package is a
# handful of small files.
#
# Any change here needs a smoke of a minified release build on a device or
# emulator (cold start, sign-in, Pregame audio with the screen off) and of an
# FV_PLAY_BILLING=1 build (the billing plugin registers). Unit tests do not
# prove R8 kept the bridge.

# 1. This app's own classes: MainActivity, FVNarrationPlugin, FVNarrationService
#    (manifest-declared foreground service), FVAuthPlugin, the offline entry
#    WebView client, and FVPlayBillingPlugin, which exists only in
#    FV_PLAY_BILLING=1 builds and is loaded with
#    Class.forName("com.fromvictoryapp.app.FVPlayBillingPlugin") in MainActivity.
#    A renamed or removed class there fails silently: the app runs, the plugin
#    is just absent.
-keep class com.fromvictoryapp.app.** { *; }

# 2. Capacitor bridge. Capacitor's own consumer rules already keep plugin
#    classes and their @PluginMethod methods; these cover the bridge itself,
#    which the WebView calls through addJavascriptInterface and which reads
#    plugin annotations at runtime.
-keep class com.getcapacitor.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# 3. Cordova compatibility layer that Capacitor links in (no Cordova plugins
#    are installed; the classes are still referenced by the bridge).
-keep class org.apache.cordova.** { *; }

# 4. Readable crash stack traces in Play Console (upload the mapping file with
#    the bundle if names matter; line numbers survive either way).
-keepattributes SourceFile,LineNumberTable
