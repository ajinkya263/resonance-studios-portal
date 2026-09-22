/**
 * Pure helpers for interactive lessons — safe to import from Server Components
 * (no React component imports here, unlike registry.js).
 *
 * A lesson is "interactive" when its media_url is `interactive:<key>`, e.g.
 *   interactive:teentaal-trainer
 *   interactive:anatomy
 *   interactive:bol:dha
 */
export function interactiveKey(mediaUrl) {
  if (typeof mediaUrl === "string" && mediaUrl.startsWith("interactive:")) {
    return mediaUrl.slice("interactive:".length);
  }
  return null;
}

/** True if the lesson renders an interactive widget. */
export function isInteractive(mediaUrl) {
  return interactiveKey(mediaUrl) !== null;
}
