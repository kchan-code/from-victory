import type { ShellCapability } from "./native-shell";

/**
 * True for the shell capabilities that render the restricted, consumption-only
 * ("reader-style") experience: `legacy-native` and `android-play`.
 *
 * FV-659: `android-play` (a future Android build carrying Play Billing) renders
 * EXACTLY like `legacy-native` everywhere today. Every call site that used to
 * check `=== "legacy-native"` uses this instead, so a later issue can diverge
 * `android-play` in one place per surface, behind a server flag.
 *
 * Deliberately a separate module (type-only import from native-shell.ts):
 * pages/actions that call it keep working in suites that mock
 * `@/lib/native-shell` with only the header readers.
 *
 * Presentation hint only — never authorization (see getShellCapability()).
 */
export function isRestrictedShell(
  capability: ShellCapability | null,
): boolean {
  return capability === "legacy-native" || capability === "android-play";
}
