#!/usr/bin/env bash
# Android release preflight — From Victory (FV-212). READ-ONLY.
#
# Checks that a Play upload candidate can be built and is shaped correctly,
# WITHOUT reading or printing any signing secret. It never builds, signs,
# uploads, or edits files.
#
# Usage (from repo root):
#   apps/native/scripts/android-release-preflight.sh [--min-version-code N] [--aab path/to/app-release.aab]
#
#   --min-version-code N  versionCode the next upload must be >= (default 9; Play has 8)
#   --aab PATH            also inspect a built bundle (signature present? not uploaded)
#   FV_ROOT=/path/to/checkout  inspect a different checkout than the one holding this script
#
# Exit code: 0 = no FAIL lines, 1 = at least one FAIL. WARN lines don't fail.
set -u

MIN_VC=9
AAB=""
while [ $# -gt 0 ]; do
  case "$1" in
    --min-version-code|--aab)
      [ $# -ge 2 ] || { echo "$1 needs a value" >&2; exit 2; }
      if [ "$1" = --aab ]; then AAB="$2"; else MIN_VC="$2"; fi
      shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

# FV_ROOT lets the same script inspect another checkout (e.g. a PR worktree).
case "$MIN_VC" in ''|*[!0-9]*) echo "--min-version-code must be an integer" >&2; exit 2 ;; esac
ROOT="${FV_ROOT:-$(cd "$(dirname "$0")/../../.." && pwd)}"
NATIVE="$ROOT/apps/native"
ANDROID="$NATIVE/android"
fails=0
ok()   { printf '  OK    %s\n' "$*"; }
warn() { printf '  WARN  %s\n' "$*"; }
fail() { printf '  FAIL  %s\n' "$*"; fails=$((fails + 1)); }
gradle_var() { sed -nE "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*'?([^' ]+)'?.*/\1/p" "$ANDROID/variables.gradle" | head -1; }

echo "== Toolchain"
# Gradle uses JAVA_HOME when set, so check that JDK first.
JAVA_BIN=java; JAVA_SRC=PATH
if [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/java" ]; then JAVA_BIN="$JAVA_HOME/bin/java"; JAVA_SRC=JAVA_HOME; fi
jv=$("$JAVA_BIN" -version 2>&1 | sed -nE 's/.*version "([0-9]+).*/\1/p' | head -1)
if [ -n "$jv" ] && [ "$jv" -ge 21 ]; then ok "JDK $jv (>= 21, via $JAVA_SRC)"; else fail "JDK 21+ required (found: ${jv:-none} via $JAVA_SRC)"; fi
nv=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
need_node=$(sed -nE 's/.*"node": ">=([0-9]+)".*/\1/p' "$NATIVE/package.json" | head -1)
if [ -n "$nv" ] && [ "$nv" -ge "${need_node:-20}" ]; then ok "Node $nv (>= ${need_node:-20} per apps/native engines)"; else fail "Node >= ${need_node:-20} required (found: ${nv:-none})"; fi
sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$sdk" ] && [ -f "$ANDROID/local.properties" ]; then sdk=$(sed -nE 's/^sdk\.dir=(.*)/\1/p' "$ANDROID/local.properties"); fi
if [ -n "$sdk" ] && [ -d "$sdk" ]; then ok "Android SDK at $sdk"; else fail "Android SDK not found (set ANDROID_HOME or android/local.properties sdk.dir)"; fi

echo "== SDK levels (android/variables.gradle)"
tgt=$(gradle_var targetSdkVersion); cmp=$(gradle_var compileSdkVersion); mn=$(gradle_var minSdkVersion)
if [ "${tgt:-0}" -ge 36 ]; then ok "targetSdk $tgt (Play requires 36 for new uploads)"; else fail "targetSdk ${tgt:-?} < 36 — Play rejects new uploads (needs FV-502 / PR #458)"; fi
if [ "${cmp:-0}" -ge "${tgt:-0}" ]; then ok "compileSdk $cmp"; else fail "compileSdk ${cmp:-?} < targetSdk ${tgt:-?}"; fi
[ -n "$mn" ] && ok "minSdk $mn"
if [ -n "$sdk" ] && [ -n "$cmp" ]; then
  if [ -d "$sdk/platforms/android-$cmp" ]; then ok "SDK platform android-$cmp installed"; else fail "SDK platform android-$cmp missing (sdkmanager \"platforms;android-$cmp\")"; fi
fi

echo "== Identity + version (android/app/build.gradle)"
appid=$(sed -nE 's/^[[:space:]]*applicationId "([^"]+)".*/\1/p' "$ANDROID/app/build.gradle" | head -1)
if [ "$appid" = "com.fromvictoryapp.app" ]; then ok "applicationId $appid (Play-locked)"; else fail "applicationId '${appid:-?}' != com.fromvictoryapp.app (Play rejects)"; fi
vc=$(sed -nE 's/^[[:space:]]*versionCode ([0-9]+).*/\1/p' "$ANDROID/app/build.gradle" | head -1)
vn=$(sed -nE 's/^[[:space:]]*versionName "([^"]+)".*/\1/p' "$ANDROID/app/build.gradle" | head -1)
if [ "${vc:-0}" -ge "$MIN_VC" ]; then ok "versionCode $vc (>= $MIN_VC) / versionName $vn"; else fail "versionCode ${vc:-?} < $MIN_VC — Play rejects a code it has already seen; bump in a release PR"; fi

echo "== Shell configuration (production + consumption-only)"
if [ -n "${CAPACITOR_SERVER_URL:-}" ]; then fail "CAPACITOR_SERVER_URL is set in this shell — unset it before cap sync for a Play build"; else ok "CAPACITOR_SERVER_URL unset (shell loads https://www.fromvictoryapp.com)"; fi
gen="$ANDROID/app/src/main/assets/capacitor.config.json"
if [ -f "$gen" ]; then
  if grep -q '"url": "https://www.fromvictoryapp.com"' "$gen"; then ok "synced config points at production"; else fail "synced android config server.url is not production — re-run 'npx cap sync android' with CAPACITOR_SERVER_URL unset"; fi
  if grep -qi 'stripe' "$gen"; then fail "synced config mentions stripe (allowNavigation must stay fromvictoryapp.com only)"; else ok "no Stripe host in synced config"; fi
else warn "android config not synced yet (run 'npx cap sync android' from apps/native)"; fi
if grep -E '^[[:space:]]*allowNavigation:' "$NATIVE/capacitor.config.ts" | grep -qi stripe; then fail "allowNavigation lists a Stripe host"; else ok "allowNavigation has no Stripe host"; fi
[ -f "$ANDROID/app/google-services.json" ] && fail "google-services.json present (Firebase/FCM not allowed)" || ok "no google-services.json"

echo "== Manifest"
man="$ANDROID/app/src/main/AndroidManifest.xml"
grep -q 'android:usesCleartextTraffic="false"' "$man" && ok "usesCleartextTraffic=false" || fail "usesCleartextTraffic is not false (a local-test build must never be uploaded)"
grep -q 'com.android.vending.BILLING' "$man" && fail "BILLING permission present (Android is consumption-only)" || ok "no Play Billing permission"
perms=$(grep -oE 'uses-permission android:name="[^"]+"' "$man" | sed -E 's/.*name="([^"]+)"/\1/' | tr '\n' ' ')
[ "$perms" = "android.permission.INTERNET " ] && ok "permissions: INTERNET only" || warn "permissions: $perms(review against FV-211 Data safety)"

echo "== Upload-key signing setup (existence only; nothing is read aloud)"
kp="$ANDROID/keystore.properties"
if [ -f "$kp" ]; then
  ok "android/keystore.properties exists (gitignored)"
  if git -C "$ROOT" ls-files --error-unmatch "$kp" >/dev/null 2>&1; then fail "keystore.properties is TRACKED by git — remove it from the index"; fi
  store=$(sed -nE 's/^storeFile=(.*)$/\1/p' "$kp" | head -1)
  # Gradle's file() resolves a relative storeFile against android/app/.
  case "$store" in ''|/*) ;; *) store="$ANDROID/app/$store" ;; esac
  if [ -n "$store" ] && [ -f "$store" ]; then
    case "$store" in "$ROOT"/*) fail "keystore file lives inside the repo — move it outside (e.g. ~/fromvictory-android-keys/)";; *) ok "keystore file exists outside the repo";; esac
  else fail "storeFile in keystore.properties does not point at an existing file"; fi
  for k in storePassword keyAlias keyPassword; do grep -qE "^$k=.+" "$kp" && ok "$k is set" || fail "$k missing in keystore.properties"; done
else
  warn "android/keystore.properties absent — bundleRelease will be UNSIGNED (KC local step, see docs/android-play-release.md §3)"
fi

if [ -n "$AAB" ]; then
  echo "== Bundle: $AAB"
  if [ ! -f "$AAB" ]; then fail "bundle not found"; else
    if unzip -l "$AAB" 2>/dev/null | grep -q 'base/manifest/AndroidManifest.xml'; then ok "valid bundle layout"; else fail "not an Android App Bundle"; fi
    if unzip -l "$AAB" 2>/dev/null | grep -qE '[[:space:]]META-INF/[^/]+\.(RSA|EC|DSA)$'; then ok "bundle carries a signature block (verify upload cert in Play Console after upload)"; else fail "bundle is UNSIGNED — Play rejects it"; fi
  fi
fi

echo
if [ "$fails" -eq 0 ]; then echo "PREFLIGHT: PASS (no FAIL lines). Upload/promotion remain KC decisions."; else echo "PREFLIGHT: $fails FAIL line(s). Not upload-ready."; fi
[ "$fails" -eq 0 ]
