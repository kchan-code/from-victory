/**
 * FV-716. Web Push cannot be delivered inside either store shell, and there
 * is no native push path yet (FV-213). Store shells show this line instead
 * of "Add to Home Screen" or "your browser" copy.
 *
 * FV-703 (offer a daily reminder after Day 1) must not ship to store users
 * until FV-213 lands. A Day 1 offer in the shell would repeat this dead end.
 */
export const NATIVE_REMINDER_UNAVAILABLE_COPY =
  "Daily reminders aren't available in the app yet.";
