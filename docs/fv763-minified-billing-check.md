# FV-763: prove Google Play Billing works on the minified (R8) release build

**Status:** recipe only. Nothing in this document has been run. Written 2026-11-19 by reading the repo.

**Why:** PR #669 (FV-740) turned R8 on for the Android release build. No billing call has ever been made on a minified build. A class or member that R8 removed or renamed would not show up in unit tests; it would fail on a customer's phone.

**Marking:** anything tagged `UNVERIFIED` comes from general Android / Capacitor / Play knowledge, not from this repo. Check it the first time you use it. The full list is in section 11.

**Stale doc warning (not fixed here):** `docs/android-play-release.md` still says `minifyEnabled` is `false` (its sections 4 and 11) and that the current version is `versionCode 9` / `1.0.0` (its "Locked facts" table and section 11; its own section 9 says 10). The build file says otherwise: `minifyEnabled true` and `versionCode 10` / `versionName "1.0.1"` in `apps/native/android/app/build.gradle`. Trust the build file.

---

## 1. What the source says (read this before running anything)

| Fact | Where |
|---|---|
| R8 is on for `release` only, with `proguard-android.txt` (the non-optimizing default) plus `proguard-rules.pro` | `apps/native/android/app/build.gradle`, `buildTypes.release` |
| One build switch: `FV_PLAY_BILLING=1`. It must be set for BOTH `npx cap sync android` and Gradle. Any value other than unset, `0` or `1` fails at configuration | same file, top; `apps/native/capacitor.config.ts` |
| With the switch on, Gradle adds `com.android.billingclient:billing:9.1.0`, compiles `src/playBillingCore/java` and `src/playBilling/java`, and sets `BuildConfig.FV_PLAY_BILLING = true` | same file |
| `verifyPlayBillingSwitch` runs before every `merge*Assets` task and fails the build if the synced `capacitor.config.json` and the Gradle switch disagree | same file |
| `stampNativeBuildMarker` appends `FVBuild/<versionCode>` to the effective Android user agent in the synced config | same file |
| The plugin class is `com.fromvictoryapp.app.FVPlayBillingPlugin`, annotated `@CapacitorPlugin(name = "FVPlayBillingPlugin")`, with four `@PluginMethod` methods: `getProducts`, `purchase`, `restore`, `manageSubscriptions` | `apps/native/android/app/src/playBilling/java/com/fromvictoryapp/app/FVPlayBillingPlugin.java` |
| Its nested types: `FVPlayBillingPlugin$Ready`, `$Failed`, `$Waiter`, `$PurchaseRequest` | same file |
| Pure helper: `com.fromvictoryapp.app.PlayBillingLogic` with nested `PlayBillingLogic$Offer`, `$PurchaseInfo`, `$Outcome` | `apps/native/android/app/src/playBillingCore/java/com/fromvictoryapp/app/PlayBillingLogic.java` |
| `MainActivity.registerPlayBillingIfEnabled()` loads the plugin with `Class.forName("com.fromvictoryapp.app.FVPlayBillingPlugin")`. If the class is missing it throws `IllegalStateException("FV_PLAY_BILLING build is missing FVPlayBillingPlugin")` in `onCreate` | `apps/native/android/app/src/main/java/com/fromvictoryapp/app/MainActivity.java` |
| Billing library types the plugin calls directly: `BillingClient`, `BillingClientStateListener`, `BillingFlowParams`, `BillingResult`, `PendingPurchasesParams`, `ProductDetails`, `Purchase`, `PurchasesUpdatedListener`, `QueryProductDetailsParams`, `QueryPurchasesParams`, `AccountIdentifiers` (all in `com.android.billingclient.api`) | plugin imports |
| JS side: `window.Capacitor.Plugins.FVPlayBillingPlugin`; `isPlayBillingBridgeAvailable()` is true when that object exists | `apps/web/lib/native/play-billing.ts` |
| Keep rules: `-keep class com.fromvictoryapp.app.** { *; }`, `-keep class com.getcapacitor.** { *; }`, `@JavascriptInterface` members, `org.apache.cordova.**`, attributes `*Annotation*,Signature,InnerClasses,EnclosingMethod,SourceFile,LineNumberTable` | `apps/native/android/app/proguard-rules.pro` |

Three things in the source change how this check has to be done:

1. **No page of the live site calls the bridge yet.** Nothing under `apps/web` imports `lib/native/play-billing.ts` except its own test. So you cannot tap through a purchase screen. Checks 1 to 3 below drive the bridge from the WebView's JavaScript console.
2. **Capacitor's own logging is off in a release build by default.** In `com.getcapacitor.Logger`, every level (including `error`) returns early unless `config.isLoggingEnabled()`, and `CapConfig` defaults `loggingBehavior` to `debug` (log only when the app is debuggable). WebView remote debugging has the same default (`android.webContentsDebuggingEnabled` defaults to the debuggable flag). Read in the Capacitor Android 7.6.8 source that sits in the primary checkout's `node_modules`; the lockfile pins 8.6.0, so confirm in the scratch install (section 3, step 4). Without turning both on, a release build gives you no console and almost no log lines.
3. **The plugin swallows runtime exceptions on purpose.** `FVPlayBillingPlugin.guarded()` catches `RuntimeException` and does not log it (the exception could carry call data). A runtime failure inside the minified billing library therefore surfaces only as `{ ok: false, error: "unknown" }` from `getProducts` / `restore`, or `{ status: "error", error: "unknown", reason: "internal_error" }` from `purchase`, with nothing in logcat. **Treat `unknown` as a suspected R8 failure, not as noise.**

A missing plugin class is NOT silent in this code: `MainActivity` throws and the app crashes on launch. (The comment in `proguard-rules.pro` that says it "fails silently" predates that throw or is simply out of step with it. Not fixed here.)

---

## 2. Prerequisites

| Need | Value | Source |
|---|---|---|
| JDK | 21 or newer. `capacitor.build.gradle` sets `sourceCompatibility` and `targetCompatibility` to `JavaVersion.VERSION_21`; the preflight script fails below 21. Gradle uses `JAVA_HOME` when set | `apps/native/android/app/capacitor.build.gradle`, `apps/native/scripts/android-release-preflight.sh` |
| Node | 22 or newer | `apps/native/package.json` `engines` |
| Gradle | 8.14.3, fetched by the wrapper. Do not install one | `apps/native/android/gradle/wrapper/gradle-wrapper.properties` |
| Android Gradle Plugin | 8.13.0 | `apps/native/android/build.gradle` |
| SDK platform | `platforms;android-36` (compileSdk 36, targetSdk 36, minSdk 24) | `apps/native/android/variables.gradle`, preflight script |
| SDK location | `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) exported. The scratch copy has no `android/local.properties` because that file is gitignored | preflight script |
| Other SDK parts | platform-tools (`adb`), build-tools (`apksigner`, `aapt2`), emulator, cmdline-tools (`avdmanager`, `sdkmanager`), one system image that includes the Play Store. `UNVERIFIED`: exact package names and which build-tools version AGP 8.13.0 selects | general knowledge |
| Capacitor | `^8.0.0` in `apps/native/package.json`; lockfile resolves `@capacitor/android` to 8.6.0 | `apps/native/package.json`, `package-lock.json` |

Optional toolchain check (read-only, prints no secrets):

```bash
apps/native/scripts/android-release-preflight.sh
```

It will WARN that signing is absent and that the config is not synced. That is expected at this point.

---

## 3. Make the scratch build copy

**Warnings from earlier work on this machine (reported, not re-verified):**

- The primary checkout's `node_modules` can hold a different `@capacitor/android` than the lockfile (7.6.8 was seen there against a locked 8.6.0). `apps/native/android/capacitor.settings.gradle` points Gradle at `../../../node_modules/@capacitor/android/capacitor`, so a build in the primary checkout or in any git worktree of it would compile the wrong Capacitor. **Never run `npm install` at the repo root to fix this.** Build in a scratch copy with its own install.
- `cap sync` rewrites `capacitor.settings.gradle` (and `capacitor.build.gradle`, and the untracked `app/src/main/assets/capacitor.config.json`). In the scratch copy that is harmless. Never copy those files back.
- Emulators `emulator-5554`, `emulator-5558` and `emulator-5562` hold signed-in state. Every `adb` command below names a different serial. Never run a bare `adb install`, `adb uninstall` or `adb shell pm clear`.

The scratch copy must keep the repo layout (`<scratch>/node_modules` and `<scratch>/apps/native/android`) because of the relative path above.

```bash
# 1. From the checkout that holds the commit to test. Export committed files only:
#    no node_modules, no keystore.properties, no .env files come along.
SCRATCH="$(mktemp -d)/fv763"            # UNVERIFIED: mktemp usage; any empty dir outside the repo works
mkdir -p "$SCRATCH"
git rev-parse HEAD                       # record this SHA as evidence
git archive --format=tar HEAD | tar -x -C "$SCRATCH"   # UNVERIFIED: general git; read-only

# 2. Install inside the scratch copy only (the command docs/android-play-release.md section 4 uses).
cd "$SCRATCH"
npm ci

# 3. Confirm the install matches the lockfile. Expect 8.6.0 (or whatever package-lock.json pins).
node -p "require('./node_modules/@capacitor/android/package.json').version"

# 4. Confirm the logging facts from section 1 in THIS Capacitor version.
grep -n "loggingBehavior\|webContentsDebuggingEnabled" \
  node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/CapConfig.java
grep -n "shouldLog" \
  node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/Logger.java
```

Do NOT put `android/keystore.properties` into the scratch copy for the local checks. Without it the release build comes out unsigned (`build.gradle` only wires `signingConfigs.release` when the file exists), and the real upload key stays out of a throwaway directory.

### 3.1 Scratch-only edit: turn on the console and Capacitor logs

Because of points 1 and 2 in section 1, add two keys to the `android:` block of `$SCRATCH/apps/native/capacitor.config.ts`:

```ts
    // FV-763 SCRATCH ONLY. Never commit. Never upload a build made with these.
    webContentsDebuggingEnabled: true,
    loggingBehavior: "production",
```

Both key names are the ones `CapConfig.java` reads (`android.webContentsDebuggingEnabled`, `android.loggingBehavior`; the value `production` means "log in every build"). `UNVERIFIED`: that the Capacitor 8 CLI's `CapacitorConfig` type accepts both under `android` (if `cap sync` rejects them, the type has moved).

What this edit changes: only the generated `capacitor.config.json` asset. It does not change one line of Java, the dependency set, the keep rules or R8's input, so the dex under test is the same dex a clean build produces. Say so in the evidence, and record that the edit was made.

Privacy note: with logging on, Capacitor's `Bridge.callPluginMethod` writes each call's `methodData` to logcat, which includes `obfuscatedAccountId` and any `replace.oldPurchaseToken`, and results can reach the console log. Use only the synthetic account id given below, and scrub purchase tokens from anything pasted into Linear.

---

## 4. Build the minified release with billing on

```bash
cd "$SCRATCH/apps/native"
unset CAPACITOR_SERVER_URL               # production shell; the preflight fails a build with this set

# The switch must be present for BOTH steps.
FV_PLAY_BILLING=1 npx cap sync android
cd android
FV_PLAY_BILLING=1 ./gradlew assembleRelease 2>&1 | tee "$SCRATCH/build.log"
```

- `FV_PLAY_BILLING=1 npx cap sync android` is the repo's own command (`docs/android-play-release.md` section 4, and the error text in `build.gradle`).
- `assembleRelease` is the standard AGP task for the `release` build type. `UNVERIFIED` by name: the repo's scripts only name `assembleDebug` and `bundleRelease`, though `build.gradle` says the guard is hooked onto every `assemble*` / `bundle*` / `install*` build. An APK is used here because an emulator installs an APK directly. For the internal track (section 8) the task is `bundleRelease` (`npm run build:android:bundle`).
- If you set the switch for only one of the two steps, the build stops at `verifyPlayBillingSwitch`. That is the guard working.

Expected output (`UNVERIFIED` exact file name): `app/build/outputs/apk/release/app-release-unsigned.apk`.

---

## 5. Confirm from the build output that R8 ran and the billing plugin is in

All paths are relative to `$SCRATCH/apps/native/android/app`. The R8 report location (`build/outputs/mapping/release/`) and the file names `mapping.txt`, `usage.txt`, `seeds.txt`, `configuration.txt` are `UNVERIFIED` (standard AGP layout; if they are missing, run `find build -name mapping.txt`).

| # | Check | Command | Pass |
|---|---|---|---|
| 5.1 | R8 task ran | `grep -n "minifyReleaseWithR8" "$SCRATCH/build.log"` (`UNVERIFIED` task name) | A line for `:app:minifyReleaseWithR8` that is not `SKIPPED` / `NO-SOURCE` |
| 5.2 | Mapping exists and is from R8 | `head -5 build/outputs/mapping/release/mapping.txt` | File exists; header names R8 (`UNVERIFIED` header text) |
| 5.3 | The switch reached both sides | `grep -n appendUserAgent src/main/assets/capacitor.config.json` | Android value starts with `FVNativeShell/1 (play)` and ends with `FVBuild/10` (or the current `versionCode`); top-level value is exactly `FVNativeShell/1` |
| 5.4 | Plugin class kept under its own name | `grep -n "^com.fromvictoryapp.app.FVPlayBillingPlugin -> " build/outputs/mapping/release/mapping.txt` | One line, and the right-hand side is the same name: `com.fromvictoryapp.app.FVPlayBillingPlugin -> com.fromvictoryapp.app.FVPlayBillingPlugin:` |
| 5.5 | Nested and helper classes kept | `grep -n "^com.fromvictoryapp.app.\(FVPlayBillingPlugin\\$\|PlayBillingLogic\)" build/outputs/mapping/release/mapping.txt` | Identity lines for `FVPlayBillingPlugin$Ready`, `$Failed`, `$Waiter`, `$PurchaseRequest`, `PlayBillingLogic`, `PlayBillingLogic$Offer`, `$PurchaseInfo`, `$Outcome` |
| 5.6 | The four bridge methods kept by name | `grep -n -A80 "^com.fromvictoryapp.app.FVPlayBillingPlugin -> " build/outputs/mapping/release/mapping.txt \| grep -E " (getProducts\|purchase\|restore\|manageSubscriptions)\(com.getcapacitor.PluginCall\) -> "` | Four lines, each mapping the method to its own name |
| 5.7 | Nothing of ours was removed | `grep -n "com.fromvictoryapp.app" build/outputs/mapping/release/usage.txt` | No output. `usage.txt` lists what R8 removed; any `com.fromvictoryapp.app` line is a FAIL |
| 5.8 | Billing library is in the build | `grep -c "^com.android.billingclient.api." build/outputs/mapping/release/mapping.txt` | A count well above zero. These classes may be renamed; that is fine, the plugin calls them directly |
| 5.9 | Billing library's own keep rules were merged | `grep -n "com.android.vending.billing\|ProxyBillingActivity\|play_billing" build/outputs/mapping/release/configuration.txt` | Shows `-keep class com.android.vending.billing.** { *; }`, the two `-keepnames ... ProxyBillingActivity` rules and a `-keepclassmembers ... com.google.android.gms.internal.play_billing...` rule (these are in `proguard.txt` inside `billing-9.1.0.aar`, read from the local Gradle cache) |
| 5.10 | Our rules were applied | `grep -n "com.fromvictoryapp.app\|com.getcapacitor" build/outputs/mapping/release/configuration.txt` | Shows `-keep class com.fromvictoryapp.app.** { *; }` and `-keep class com.getcapacitor.** { *; }` |
| 5.11 | Class is physically in the dex | `unzip -o -q build/outputs/apk/release/app-release-unsigned.apk 'classes*.dex' -d "$SCRATCH/dex" && grep -l "Lcom/fromvictoryapp/app/FVPlayBillingPlugin;" "$SCRATCH"/dex/classes*.dex` (`UNVERIFIED`: grepping raw dex for a type descriptor) | At least one dex file listed |
| 5.12 | Billing permission merged | `"$ANDROID_HOME"/build-tools/<version>/aapt2 dump permissions build/outputs/apk/release/app-release-unsigned.apk` (`UNVERIFIED` command) | Lists `com.android.vending.BILLING` (the release doc says it is present if and only if the switch is on) |

Control (optional, cheap): repeat `cap sync` and `assembleRelease` with the switch unset in a second scratch copy. Then 5.4 and 5.8 must return nothing. That proves the greps are measuring the switch and not something that is always there.

Keep `mapping.txt`, `usage.txt`, `seeds.txt` and `configuration.txt` from the billing build. They are the static half of the evidence.

Static checks prove the names survived. They do not prove the minified billing library still runs. That is what the three device checks are for.

---

## 6. Test device: a separate emulator

The owner has no physical Android device. Use a new AVD. Do not touch 5554, 5558 or 5562.

```bash
# All UNVERIFIED (general Android SDK tooling). Creating the AVD is an owner approval item.
sdkmanager "system-images;android-36;google_apis_playstore;arm64-v8a"
avdmanager create avd -n fv763-minify -k "system-images;android-36;google_apis_playstore;arm64-v8a" -d pixel_7
emulator -avd fv763-minify -port 5570 &
adb devices                               # expect emulator-5570 next to the three existing ones
export FV763=emulator-5570                # every adb command below uses -s "$FV763"
```

The image must be a Play Store image (`google_apis_playstore`), not a plain Google APIs or AOSP image. Without the Play Store app there is no billing service and every call answers `unavailable` (`UNVERIFIED`).

Sign and install the local build with the Android debug keystore (never the upload key):

```bash
# UNVERIFIED: apksigner flags and the default debug keystore location and credentials.
APK="$SCRATCH/apps/native/android/app/build/outputs/apk/release/app-release-unsigned.apk"
"$ANDROID_HOME"/build-tools/<version>/apksigner sign \
  --ks ~/.android/debug.keystore --ks-key-alias androiddebugkey \
  --ks-pass pass:android --key-pass pass:android \
  --out "$SCRATCH/app-release-debugsigned.apk" "$APK"
adb -s "$FV763" install "$SCRATCH/app-release-debugsigned.apk"
```

**Firebase Test Lab** is the alternative when no emulator can be used. `UNVERIFIED`: a Robo run can show check 1's "launches without a crash" half and return logcat, but it cannot type into a WebView console, so it cannot do the bridge half of check 1 or any of checks 2 and 3 while no page calls the bridge.

---

## 7. The three checks

### Logcat filters (used by all three)

Terminal A, start before launching the app:

```bash
adb -s "$FV763" logcat -c
adb -s "$FV763" logcat -v time \
  AndroidRuntime:E Capacitor:V Capacitor/Console:V Capacitor/Plugin:V \
  BillingClient:V chromium:I '*:S' | tee "$SCRATCH/logcat-live.txt"
```

- `Capacitor` and `Capacitor/Console` are real tags from `com.getcapacitor.Logger` (`LOG_TAG_CORE = "Capacitor"`, console messages use `Logger.tags("Console")`). They only appear because of the section 3.1 edit.
- `AndroidRuntime` (crashes), `BillingClient` (the billing library's own tag) and `chromium` (WebView console) are `UNVERIFIED` tag names.

After each check, save a full dump and run the stripped-class scan:

```bash
adb -s "$FV763" logcat -d -v time > "$SCRATCH/logcat-checkN.txt"
grep -n -E "ClassNotFoundException|NoClassDefFoundError|NoSuchMethodError|NoSuchFieldError|AbstractMethodError|IncompatibleClassChangeError|VerifyError|FV_PLAY_BILLING build is missing FVPlayBillingPlugin|unable to find plugin|Unable to execute plugin method|No method .* found for plugin|Unable to load plugin instance|No @CapacitorPlugin annotation found|Serious error executing plugin|UNIMPLEMENTED" \
  "$SCRATCH/logcat-checkN.txt"
```

Every string after the Java error names is a literal from this repo's `MainActivity.java` or from Capacitor's `Bridge.java`, `PluginHandle.java` and `PluginCall.java`. **Any hit is a FAIL for the whole ticket.** No hit is necessary but not sufficient (see section 9, silent failures).

### Opening the console

On the host, open Chrome at `chrome://inspect/#devices`, find the WebView for `com.fromvictoryapp.app` on `emulator-5570`, click inspect, use the Console tab (`UNVERIFIED`: general Chrome tooling; it works only because of `webContentsDebuggingEnabled: true`). The app shows the production site. You do not need to sign in to From Victory for any check, and should not sign in with a real family account on this emulator.

### Check 1: the app launches and the bridge reports billing available

Steps:

1. Launch the app from the emulator's launcher (cold start).
2. In the console:

```js
// a. The same test isPlayBillingBridgeAvailable() makes in apps/web/lib/native/play-billing.ts
window.Capacitor?.Plugins?.FVPlayBillingPlugin != null

// b. The user agent the server sees
navigator.userAgent

// c. Methods the native side exported for the plugin. UNVERIFIED: the PluginHeaders shape.
window.Capacitor.PluginHeaders.find(h => h.name === "FVPlayBillingPlugin")?.methods.map(m => m.name)

// d. One real round trip through the minified billing library (connects BillingClient, queries Play)
await window.Capacitor.Plugins.FVPlayBillingPlugin.restore()
```

| Result | Verdict |
|---|---|
| App reaches the site; (a) is `true`; (b) contains `FVNativeShell/1 (play)` and `FVBuild/`; (c) lists `getProducts`, `purchase`, `restore`, `manageSubscriptions`; (d) resolves `{ ok: true, purchases: [] }`; logcat shows `Registering plugin instance: FVPlayBillingPlugin`; scan is clean | **PASS** |
| (d) resolves `{ ok: false, error: "unavailable" }` or `"network"`, everything else as above | **PASS for the bridge, INCONCLUSIVE for the billing library.** The plugin mapped a real Play response code (`PlayBillingLogic.statusForResponseCode`). Usually the emulator has no Play Store or no signed-in Google account. Fix the emulator and repeat (d) |
| App crashes on launch; logcat has `IllegalStateException: FV_PLAY_BILLING build is missing FVPlayBillingPlugin` or `ClassNotFoundException` | **FAIL**: plugin class stripped or renamed |
| (a) is `false` or (c) is `undefined` or empty | **FAIL**: class present but its `@CapacitorPlugin` / `@PluginMethod` annotations or methods did not survive |
| (d) rejects with code `UNIMPLEMENTED`, or resolves `{ ok: false, error: "unknown" }` | **FAIL until explained** (section 9) |
| (d) never settles | **FAIL until explained**: a callback class in the billing library may be broken |

### Check 2: a product query returns the products with prices

Product ids are the provisional ones in the FV-651 record section 5.2 and `apps/web/lib/subscriptions/google-product-catalog.ts` (`family.1` to `family.5`). Whether they exist in Play Console yet is not recorded in the repo (FV-666). If they do not, use whatever subscription ids the owner created and write them in the evidence.

```js
const r = await window.Capacitor.Plugins.FVPlayBillingPlugin.getProducts({
  productIds: ["family.1", "family.2", "family.3", "family.4", "family.5"],
});
JSON.stringify(r, null, 2)
```

| Result | Verdict |
|---|---|
| `ok: true`; one entry per product that exists in Play; each has `productId`, `name`, `title`, and `offers[]` with `basePlanId`, `offerId` (string or `null`), a non-empty `offerToken`, and `pricingPhases[]` with a non-empty `formattedPrice`, a numeric `priceAmountMicros`, `priceCurrencyCode`, `billingPeriod` such as `P1M` / `P1Y`, `billingCycleCount`, `recurrenceMode` | **PASS (2b, full)**. Compare each `formattedPrice` with the price typed in Play Console |
| `ok: true, products: []` | **PASS (2a, call path only).** The minified library made the call and Play answered, but Play does not recognise this install or these ids. Expected on a debug-keystore sideload (section 8). Not sufficient for FV-763 |
| `ok: true` but entries are missing `offers`, or phases have empty or missing `formattedPrice` / `priceAmountMicros` | **FAIL**: this is the shape a stripped field in the billing library's generated data classes would produce |
| `ok: false, error: "unavailable"` or `"network"` or `"developer_error"` | **INCONCLUSIVE**: a typed Play answer. Fix the environment (Play Store image, Google account, install source, product ids) |
| `ok: false, error: "unknown"`, a rejection, or no answer | **FAIL until explained** |

### Check 3: one purchase and one restore with a license tester

Needs the internal-track install and a license-tester Google account (section 8). Test subscriptions bought by a license tester are not charged and renew on a short test clock (`UNVERIFIED`).

```js
// Synthetic, non-identifying account id. Do NOT use a real binding id. Do NOT send the token to the server.
const p = await window.Capacitor.Plugins.FVPlayBillingPlugin.purchase({
  productId: "family.2",
  basePlanId: "monthly",
  obfuscatedAccountId: "fv763-minify-check",
});
({ status: p.status, productId: p.productId, tokenLength: p.purchaseToken?.length, error: p.error, reason: p.reason })

const s = await window.Capacitor.Plugins.FVPlayBillingPlugin.restore();
s.purchases?.map(x => ({ productIds: x.productIds, purchaseState: x.purchaseState, acknowledged: x.acknowledged,
  autoRenewing: x.autoRenewing, obfuscatedAccountId: x.obfuscatedAccountId, tokenLength: x.purchaseToken?.length }))
```

`family.2` with base plan `monthly` and no offer is used so the check does not depend on the `trial-7d` offer or its eligibility rule. The plugin buys only the exact base plan and offer asked for and never falls back (`PlayBillingLogic.selectOffer`).

| Result | Verdict |
|---|---|
| Google's purchase sheet opens showing the test card; after confirming, `purchase` resolves `status: "purchased"` with `productId: "family.2"` and a non-empty token; `restore` then returns one purchase with `productIds: ["family.2"]`, `purchaseState: "purchased"`, `obfuscatedAccountId: "fv763-minify-check"`, `acknowledged: false` | **PASS**. `acknowledged: false` is correct: the plugin never acknowledges, the server does, and this test does not involve the server |
| Sheet opens, you back out, `status: "cancelled"` | Correct behaviour, but not a pass. Run it again and complete it |
| `status: "pending"` | Correct for a slow test payment method. Wait, then run `restore` |
| `status: "error", error: "unavailable", reason: "product_not_found"` or `"offer_not_found"` | **INCONCLUSIVE**: product or base plan id does not match Play Console |
| `status: "error", error: "unknown", reason: "internal_error"` | **FAIL**: an exception was swallowed by `guarded()` inside the purchase path |
| The sheet never opens and the promise never settles, or the app closes when the sheet should open | **FAIL**: check logcat for `ProxyBillingActivity` and the Java errors in the scan |
| `status: "purchased"` but `restore` returns `[]`, or a purchase missing `productIds` / `obfuscatedAccountId` | **FAIL**: read path broken |

After check 3: cancel the test subscription from the Play Store app on the emulator (or run `manageSubscriptions({ productId: "family.2" })` from the console, which is a fourth bridge method worth exercising; it should open Play's subscription page and resolve `{ ok: true }`). An unacknowledged purchase is refunded by Google on its own after a few days (`UNVERIFIED`). Tell the owner a test purchase exists on the tester account.

---

## 8. Which checks are possible on which build

| Check | Local build, debug keystore, sideloaded on the new AVD | Internal testing track, installed from Play by a license tester |
|---|---|---|
| Section 5 static checks | Yes | Yes (run them on the same build output that produced the uploaded bundle) |
| 1: launch, bridge present, methods exported | Yes | Yes |
| 1(d): `restore()` returns a typed answer | Yes on a Play Store image with a Google account signed in. `UNVERIFIED` whether Play answers `ok` with an empty list or `unavailable` for an app it did not install | Yes |
| 2a: `getProducts` returns a typed answer | Yes, same caveat | Yes |
| 2b: `getProducts` returns products with prices | **Not expected to work. `UNVERIFIED`.** Reported rule: Play returns product details only for a build whose application id and signing it knows and that was installed in a way it recognises. A debug-keystore sideload meets neither condition | Yes, once the products are active in Play Console |
| 3: purchase and restore | **No** (same reason; `UNVERIFIED` but do not plan on it) | Yes, with a license-tester account |

Notes on the internal-track route, each of which is an owner decision:

- **`versionCode`.** `build.gradle` says 10, and `docs/android-play-release.md` section 9 says 1.0.1 / versionCode 10 is the live build. Play rejects a reused code, so an upload needs 11 or higher, which is a repo change in its own release PR.
- **Upload gate.** `docs/android-play-release.md` section 4 says: do not upload a billing build until FV-669's release package is approved by KC, and the Data safety form and privacy text (FV-667) must reflect the billing library's components first. An internal-track upload for FV-763 needs an explicit owner decision on whether that gate applies to internal testing.
- **Update 2026-11-19.** `docs/android-play-release.md` now separates two gates (see its dated note at the top, its "Locked facts" row and section 4): a billing build may go to the **internal testing track only**, for testing, with KC's explicit go-ahead for that upload; any wider track and switching billing on still need this check passed in full, the FV-668 matrix, and the FV-669 package. So the full check in this document is not blocked by its own result, and nothing here is waived for release. A test-only build that carries the debug settings from section 4 is never promoted to another track. `versionCode` is 11 after the release-prep change.
- **Products.** FV-651 section 6.1 lists Play Console as one of three locks: with no products created, nothing can be queried or bought even by a tester (FV-666).
- **The console.** Because no page calls the bridge, checks 2b and 3 on an internal-track build still need the WebView console, which means the uploaded internal build would carry the two section 3.1 keys. Options: (a) upload a test-only internal build with those keys and never promote it; (b) wait for the purchase UI (FV-665) and the server flag `GOOGLE_PLAY_CATALOG_ACTIVE`, then do checks 2b and 3 through the real screens on a clean build. `UNVERIFIED`: whether Play's internal app sharing would avoid consuming a `versionCode` for option (a).
- **Signing.** The bundle is signed with the upload key (`android/keystore.properties`, owner's machine only) and re-signed by Play App Signing. Test the build that Play delivers, not the local file.
- **Build command.** `FV_PLAY_BILLING=1 npx cap sync android` then `FV_PLAY_BILLING=1 npm run build:android:bundle` from `apps/native` (from `docs/android-play-release.md`), in a scratch copy with a correct install, then `apps/native/scripts/android-release-preflight.sh --aab <bundle>`. Upload `mapping.txt` with the bundle (the `proguard-rules.pro` comment asks for this).

What the local build alone can honestly claim: R8 kept every class and bridge method the plugin needs, the app starts, the plugin registers, and the minified billing library can connect to Play and return a typed answer. It cannot claim that product data parses or that a purchase completes. FV-763's question ("a billing call on a minified build has never been verified") is only fully answered by 2b and 3.

---

## 9. What a stripped or broken class looks like

| Symptom | Where you see it | Likely cause |
|---|---|---|
| App closes at launch. `AndroidRuntime: FATAL EXCEPTION: main` with `java.lang.IllegalStateException: FV_PLAY_BILLING build is missing FVPlayBillingPlugin`, caused by `java.lang.ClassNotFoundException: com.fromvictoryapp.app.FVPlayBillingPlugin` | logcat, `AndroidRuntime` | Plugin class removed or renamed (rule 1 in `proguard-rules.pro` not applied) |
| `java.lang.NoClassDefFoundError` or `ClassNotFoundException` naming `com.android.billingclient...`, `com.android.vending.billing...` or `com.google.android.gms.internal.play_billing...` | logcat, `AndroidRuntime`, on the first bridge call | Billing library class removed; its consumer rules were not merged (check 5.9) |
| `java.lang.NoSuchMethodError` / `NoSuchFieldError` / `AbstractMethodError` | logcat, `AndroidRuntime`. These are `Error`s, not `RuntimeException`s, so `guarded()` does not catch them and the app dies | A member was removed or renamed underneath a caller R8 could not see |
| `Capacitor: unable to find plugin : FVPlayBillingPlugin` | logcat, `Capacitor` tag (needs section 3.1) | Plugin not registered |
| `Capacitor: Unable to execute plugin method` with `No method getProducts found for plugin com.fromvictoryapp.app.FVPlayBillingPlugin`; the JS promise rejects with code `UNIMPLEMENTED` | logcat and console | `@PluginMethod` annotation or the method itself did not survive |
| `No @CapacitorPlugin annotation found for plugin ...` | logcat, `Capacitor` tag | Runtime annotations stripped (`-keepattributes *Annotation*` not applied) |
| `window.Capacitor.Plugins.FVPlayBillingPlugin` is `undefined`; through the real wrapper every call would resolve `bridge_unavailable` | console | Same as the two rows above, seen from JS |
| **Silent:** `{ ok: false, error: "unknown" }` from `getProducts` / `restore`, or `{ status: "error", error: "unknown", reason: "internal_error" }` from `purchase`, and nothing in logcat | console only | A `RuntimeException` inside the minified billing library, swallowed by `FVPlayBillingPlugin.guarded()`. The billing AAR's own rules say its generated data classes are read by reflection over fields; a missing field there throws at runtime. This is the customer-phone failure FV-763 is about |
| **Silent:** `ok: true` but products have no `offers`, or `pricingPhases` are empty / unpriced | console only | Same family: data came back but could not be read |
| **Silent:** a call never resolves | console only | A listener class the library calls back into is broken |
| The purchase sheet never appears, with an `ActivityNotFoundException` or a class error naming `ProxyBillingActivity` | logcat | The billing activity's name did not survive (`-keepnames` rule in the AAR) |

If you hit a silent `unknown`, the next step is a scratch-only diagnostic build that logs the exception class name in `guarded()` (never the message). That is a code change to a privacy-reviewed file, so it stays in the scratch copy and is reported, not committed.

---

## 10. Evidence to record on FV-763

1. Commit SHA built, date, and who ran it.
2. Toolchain: `java -version`, `node -v`, the `@capacitor/android` version printed in section 3 step 3.
3. The exact two build commands, and a statement that the section 3.1 scratch edit was applied (and that it changes only `capacitor.config.json`).
4. Section 5 table, one line per row with the grep output: R8 task line, mapping header, the identity mapping lines for `FVPlayBillingPlugin`, its four methods and `PlayBillingLogic`, the empty `usage.txt` grep, the billing class count, the merged consumer rules. Attach `mapping.txt`, `usage.txt` and `configuration.txt` (they contain no secrets).
5. Device: AVD name, serial, system image, API level; or the Test Lab matrix id. How the build was signed and how it was installed (sideload or Play internal track, and the Play version code).
6. For each of checks 1, 2 and 3: PASS / FAIL / INCONCLUSIVE / NOT RUN, the console output (with tokens replaced by their length), a screenshot, and the logcat dump with the stripped-class scan result. For check 2, the Play Console price next to each `formattedPrice`.
7. Scrub before posting: remove every `purchaseToken` and `offerToken` value. The synthetic account id `fv763-minify-check` may stay. Do not post the tester's Google account email.
8. A plain statement of scope: which column of the section 8 table the evidence comes from, and which checks remain unproven. Do not write "billing verified on the minified build" on the strength of the local build alone.
9. Follow-ups found on the way (for example the stale lines in `docs/android-play-release.md`, or any keep-rule change), filed as their own issues.

---

## 11. `UNVERIFIED` list (general knowledge, not from this repo)

1. `git archive ... | tar -x`, `mktemp -d` for the scratch copy.
2. The `assembleRelease` task name and the unsigned APK output path and file name.
3. The `:app:minifyReleaseWithR8` task name, the `build/outputs/mapping/release/` location, the `mapping.txt` / `usage.txt` / `seeds.txt` / `configuration.txt` file names and formats, and the R8 header line in `mapping.txt`.
4. That `proguard-android.txt` still limits R8 to shrinking and renaming under AGP 8.13.0 (the `build.gradle` comment asserts it; not checked against AGP).
5. That consumer rules from the billing AAR and from Capacitor are merged automatically (check 5.9 and 5.10 test this).
6. Grepping a raw dex for a type descriptor; `aapt2 dump permissions`.
7. `sdkmanager` / `avdmanager` / `emulator` commands, system image package name, the `-port 5570` flag and the resulting serial `emulator-5570`.
8. `apksigner` flags and the debug keystore path, alias and passwords.
9. Logcat tag names `AndroidRuntime`, `BillingClient`, `chromium`.
10. `chrome://inspect` for WebView debugging; the `window.Capacitor.PluginHeaders` shape.
11. That the Capacitor 8 CLI config type accepts `android.webContentsDebuggingEnabled` and `android.loggingBehavior`, and that Capacitor 8.6.0 gates logging the same way as the 7.6.8 source that was read (section 3 step 4 checks the second half).
12. Everything about Play's behaviour: what a sideloaded debug-signed build gets back from `queryProductDetailsAsync` and `queryPurchasesAsync`, that product details require a Play-known signature and install source, that license-tester purchases are free and short-cycled, that unacknowledged purchases are auto-refunded, internal app sharing, and what Firebase Test Lab Robo can and cannot do.
13. The reported local-machine facts in section 3 (version mismatch in the primary `node_modules`, `cap sync` rewriting `capacitor.settings.gradle`, the three existing emulators). The 7.6.8 against 8.6.0 mismatch was seen again while writing this; the rest is as reported.

---

## 12. What the owner must do or approve

1. **Approve creating a new emulator** (`fv763-minify`, port 5570, Play Store image) and downloading its system image. Nothing touches 5554, 5558 or 5562.
2. **Approve the scratch build**: `npm ci` in a throwaway copy outside the repo, the two section 3.1 debug keys in that copy only, and a debug-keystore signature. No repo file changes.
3. **Sign a Google account into the new emulator's Play Store** (needed for check 1(d) and 2a to mean anything). Passwords are the owner's to type.
4. **Decide the internal-track question** (section 8): whether a billing build may go to Internal testing before FV-667 and FV-669 are done, and whether it is a test-only build with the console enabled or the checks wait for the purchase UI (FV-665).
5. If yes: **approve a `versionCode` bump to 11 or higher** in a release PR, **build and upload the bundle** with the upload key (owner's machine), and upload `mapping.txt` with it.
6. **Confirm the subscription products exist and are active** in Play Console (FV-666), and give the exact product and base plan ids if they differ from `family.1` to `family.5` / `monthly` / `yearly`.
7. **Add a license-tester account** in Play Console, add it to the internal testers list, accept the opt-in link on the emulator, and install from Play.
8. **Make the test purchase** in check 3 (the owner or the tester confirms the sheet), then cancel the test subscription afterwards.
9. **Decide what closes FV-763**: the local column only (static proof plus launch and a typed answer), or the internal-track column (products with prices, one purchase, one restore). This document recommends the second.
