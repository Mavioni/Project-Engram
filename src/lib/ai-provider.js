// Provider-neutral AI helpers.
// The UI should consume this contract, not a specific hosted model vendor.

export const AI_PROVIDERS = {
  HOSTED: 'hosted',
  LOCAL: 'local',
  FALLBACK: 'fallback',
};

export const AI_TASKS = {
  INSIGHT: 'insight',
  CHAT: 'chat',
  WEEKLY_REVIEW: 'weekly-review',
};

/**
 * Normalize an AI response into a consistent shape the UI can consume.
 * Includes optional error fields for diagnostic badges.
 */
export function normalizeAiResponse(data, defaults = {}) {
  return {
    content: String(data?.content ?? defaults.content ?? ''),
    model: data?.model ?? defaults.model ?? 'unknown',
    provider: data?.provider ?? defaults.provider ?? inferProvider(data?.model),
    cached: Boolean(data?.cached ?? defaults.cached ?? false),
    // Error diagnostics — surfaced as badges in the UI
    error: data?.error ?? defaults.error ?? null,
    errorType: data?.errorType ?? defaults.errorType ?? null,
  };
}

export function fallbackInsight(kind) {
  const base =
    'Engram needs a configured AI provider to generate live insights. ';
  if (kind === 'daily') {
    return (
      base +
      "Meanwhile: glance at today's entry. Whatever showed up - mood, activity, a line of text - is the data. Trust what you wrote."
    );
  }
  if (kind === 'weekly') {
    return (
      base +
      'Meanwhile: look at the last 7 days side-by-side. Which day stands out? That contrast is where your signal lives.'
    );
  }
  if (kind === 'monthly') {
    return (
      base +
      'Meanwhile: scroll the calendar. Color yourself a map of the month. What season were you in?'
    );
  }
  return (
    base +
    "Once configured, Engram can read your IRIS scores and recent entries and write something only your data could produce."
  );
}

export function fallbackChatMessage() {
  return "The in-browser AI model couldn't load. This might be because the model is still downloading (~50MB on first visit — check the loading bar above), your browser doesn't support WebGPU/WASM, or you're offline on your first visit. Once cached, the model loads instantly. Try refreshing, or check the status banner for details.";
}

function inferProvider(model) {
  if (!model || model === AI_PROVIDERS.FALLBACK) return AI_PROVIDERS.FALLBACK;
  if (String(model).startsWith('local:')) return AI_PROVIDERS.LOCAL;
  return AI_PROVIDERS.HOSTED;
}
