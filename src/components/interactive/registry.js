import TeentaalTrainer from "./TeentaalTrainer";

/**
 * Registry of interactive lesson widgets.
 * A lesson becomes interactive when its `media_url` is `interactive:<key>`.
 * Add new widgets here as you build them.
 */
export const INTERACTIVE_WIDGETS = {
  "teentaal-trainer": TeentaalTrainer,
};

/** Parse `interactive:<key>` → key, else null. */
export function interactiveKey(mediaUrl) {
  if (typeof mediaUrl === "string" && mediaUrl.startsWith("interactive:")) {
    return mediaUrl.slice("interactive:".length);
  }
  return null;
}

export function getInteractiveWidget(mediaUrl) {
  const key = interactiveKey(mediaUrl);
  return key ? INTERACTIVE_WIDGETS[key] || null : null;
}
