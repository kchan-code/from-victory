# Android TWA Runbook — From Victory

This runbook walks KC through generating a signed Android App Bundle (AAB),
wiring the Digital Asset Links fingerprint, and submitting to Play Internal
Testing. Assumes minimal Android experience; every command is spelled out.

---

## What is a TWA?

A Trusted Web Activity (TWA) is an Android app that displays your PWA full-screen
with no browser chrome. The user sees a native-feeling app; under the hood it is
Chrome rendering your web app. Bubblewrap (Google's CLI tool) generates the
Android project from your web manifest in about 10 minutes.

---

## Prerequisites (one-time setup)

### 1. Install Java 17+
Bubblewrap requires Java. On macOS:

```bash
brew install openjdk@17
# Add to your shell profile:
echo 'export JAVA_HOME=$(brew --prefix openjdk@17)' >> ~/.zshrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
java --version   # should print 17.x.x
```

### 2. Install Android command-line tools (no Android Studio needed)

```bash
# Download the command-line tools from:
# https://developer.android.com/studio#command-line-tools-only
# Choose the macOS zip, unzip to ~/Library/Android/sdk/cmdline-tools/latest/

mkdir -p ~/Library/Android/sdk/cmdline-tools
cd ~/Library/Android/sdk/cmdline-tools
# Unzip the downloaded file here so the structure is:
#   ~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager

# Add to shell profile:
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/build-tools/34.0.0:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Accept licenses and install build tools:
sdkmanager --licenses
sdkmanager "build-tools;34.0.0" "platforms;android-34"
```

### 3. Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
bubblewrap --version   # confirm install
```

---

## Step 1 — Confirm the web app passes TWA readiness checks

Before generating the Android project, verify the live PWA meets TWA requirements:

| Requirement | Current state | Action needed |
|---|---|---|
| `display: "standalone"` | PASS — set in `apps/web/app/manifest.ts` | None |
| `start_url` set | PASS — `"/"` | None |
| `theme_color` set | PASS — `"#050505"` | None |
| `background_color` set | PASS — `"#050505"` | None |
| 192×192 icon (`any`) | PASS — `icon-192.png` | None |
| 512×512 icon (`any`) | PASS — `icon-512.png` | None |
| 512×512 maskable icon | PASS — `icon-maskable.png` (added in this PR) | None |
| `short_name` ≤ 12 chars | GAP — `"From Victory"` is 12 chars including space, which is exactly the limit; some launchers truncate at 10 | Consider `"FromVictory"` (11 chars) as a follow-up if Play Console warns |
| HTTPS served | PASS on Vercel prod | None |
| Service worker | Partial — `sw.js` exists but is manifest-only (no precaching). TWA works without SW precaching; full offline is a follow-up | None blocking |

Run the official PWA checker to confirm nothing is missing:

```
https://www.pwabuilder.com/  → paste your prod URL
```

---

## Step 2 — Create a release signing keystore (one-time, keep it safe)

A keystore is a password-protected file holding your app's signing key.
**You must use the same keystore for every future update — if you lose it you
cannot update the app on Play.**

```bash
mkdir -p ~/fromvictory-android-keys
cd ~/fromvictory-android-keys

keytool -genkey -v \
  -keystore fromvictory-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias fromvictory \
  -dname "CN=From Victory, OU=App, O=From Victory, L=Unknown, ST=Unknown, C=US"
```

You will be prompted for a keystore password and a key password. Write both
down somewhere secure (a password manager, not a plaintext file in the repo).

**Back this file up immediately.** If you lose `fromvictory-release.jks` you
cannot publish updates. Store it outside the git repo.

---

## Step 3 — Extract the SHA-256 fingerprint for Digital Asset Links

```bash
keytool -list -v \
  -keystore ~/fromvictory-android-keys/fromvictory-release.jks \
  -alias fromvictory
```

Look for the line that starts with `SHA256:`. It will look like:

```
SHA256: AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67
```

Copy the full colon-separated string (64 hex chars, 32 pairs).

---

## Step 4 — Wire the fingerprint into assetlinks.json

Open `apps/web/public/.well-known/assetlinks.json` in the repo. Replace the
placeholder value with your real fingerprint:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.fromvictory.app",
      "sha256_cert_fingerprints": [
        "AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67"
      ]
    }
  }
]
```

Commit and deploy this change to production **before** submitting the app to
Play. The TWA will not pass verification until this file is live and accessible
at `https://fromvictoryapp.com/.well-known/assetlinks.json`.

Verify it is live:

```bash
curl https://fromvictoryapp.com/.well-known/assetlinks.json
```

---

## Step 5 — Generate the Android project with Bubblewrap

```bash
mkdir -p ~/fromvictory-twa
cd ~/fromvictory-twa
bubblewrap init --manifest https://fromvictoryapp.com/manifest.webmanifest
```

Bubblewrap will ask several questions. Use these answers:

| Prompt | Answer |
|---|---|
| Application package name | `com.fromvictory.app` |
| Application name | `From Victory` |
| Short name | `FromVictory` |
| Application version | `1` (increment for every Play update) |
| Application version name | `1.0.0` |
| Android min SDK | `19` (Bubblewrap default; do not lower) |
| Signing key path | `~/fromvictory-android-keys/fromvictory-release.jks` |
| Signing key alias | `fromvictory` |
| Signing key password | (your keystore password) |
| Key password | (your key password) |
| Orientation | `portrait` |
| Display mode | `standalone` |
| Theme color | `#050505` |
| Background color | `#050505` |
| Start URL | `/` |
| Enable notifications | `yes` (Web Push is wired) |
| Enable location | `no` |

After init, Bubblewrap creates an Android Studio project in the current directory.

---

## Step 6 — Build the signed AAB

```bash
cd ~/fromvictory-twa
bubblewrap build
```

This produces `app-release-signed.aab` in the current directory.
An AAB (Android App Bundle) is what Play Console requires (not an APK).

If the build fails with a Gradle error, run:

```bash
bubblewrap build --skipPwaValidation
```

(Only use this flag locally; the real validation happens on Play.)

---

## Step 7 — Verify the AAB locally (optional but recommended)

Install `bundletool` to extract a local APK set and test on a real device:

```bash
brew install bundletool

bundletool build-apks \
  --bundle=app-release-signed.aab \
  --output=fromvictory.apks \
  --ks=~/fromvictory-android-keys/fromvictory-release.jks \
  --ks-key-alias=fromvictory \
  --ks-pass=pass:YOUR_KEYSTORE_PASSWORD \
  --key-pass=pass:YOUR_KEY_PASSWORD

bundletool install-apks --apks=fromvictory.apks
```

The app will install on any connected Android device or emulator.

---

## Step 8 — Create the Play Console listing

1. Go to https://play.google.com/console and sign in with the Google account
   that will own the app.
2. Click **Create app**.
3. Fill in: App name = "From Victory", Default language = English (US),
   App/Game = App, Free/Paid = Paid (you have Stripe subscriptions; select Free
   if you plan to gate via Stripe only — no IAP).
4. Accept the declarations and click **Create app**.

---

## Step 9 — Upload to Play Internal Testing

Internal Testing is private (up to 100 testers, no review required).
This is the right track for beta families.

1. In Play Console, navigate to **Testing > Internal testing**.
2. Click **Create new release**.
3. Under "App bundles," click **Upload** and select `app-release-signed.aab`.
4. Fill in release notes (e.g., "Beta release for family testers").
5. Click **Review release**, then **Start rollout to Internal testing**.

The release will be available within minutes (no review queue for Internal).

---

## Step 10 — Add beta testers

1. In Play Console, go to **Testing > Internal testing > Testers**.
2. Click **Create email list** and add family/beta tester emails.
3. Share the opt-in URL shown on that page with your testers.
4. Testers open the opt-in URL on their Android device, then install from Play.

---

## Step 11 — Verify TWA linkage is working

After testers install the app, open a test URL that should deep-link into the
TWA. If the URL bar appears inside the app, the Digital Asset Links verification
failed — recheck Step 4 (fingerprint must be live on the exact domain in the
manifest).

Google's verification tool:
```
https://digitalassetlinks.googleapis.com/v1/statements:list
  ?source.web.site=https://fromvictoryapp.com
  &relation=delegate_permission/common.handle_all_urls
```

A passing response includes your package name in the `statements` array.

---

## Updating the app

Every time you update the web app (Vercel auto-deploys), users get the new
version automatically — no Play Store update needed for content changes.

You only need to publish a new AAB to Play when you change:
- Native Android capabilities (permissions, notification channels)
- The signing keystore
- The package name or application name
- The target SDK version (Google requires annual bumps)

For those updates: increment `versionCode` by 1 in `bubblewrap.config.json`,
run `bubblewrap build`, and upload the new AAB to a new Play release.

---

## Package name note

The package name `com.fromvictory.app` is used throughout this runbook and is
baked into the `assetlinks.json` file. If KC decides on a different package name
(e.g., `com.fromvictoryapp.android`), update both `assetlinks.json` and the
Bubblewrap init answers, then regenerate.

---

## PWABuilder as an alternative to Bubblewrap

If Bubblewrap gives you trouble, PWABuilder (https://www.pwabuilder.com) provides
a web UI that does the same thing: paste your prod URL, click Android, download
the zip, open in Android Studio, and sign with your keystore. The underlying
output is the same Bubblewrap project. Use whichever feels easier.
