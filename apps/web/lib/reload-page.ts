/**
 * Full-page reload, isolated in its own module so tests can mock it —
 * jsdom's `window.location.reload` is non-configurable and cannot be spied
 * on directly (FV-494).
 */
export function reloadPage(): void {
  window.location.reload();
}
