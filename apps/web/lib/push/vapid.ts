/**
 * urlBase64ToUint8Array — convert a base64url-encoded VAPID public key string
 * to a Uint8Array suitable for PushManager.subscribe({ applicationServerKey }).
 *
 * Standard conversion used by every Web Push implementation. No third-party
 * deps. Pure math — safe to call on the client only.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Pad to a multiple of 4, then swap base64url chars back to standard base64.
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
