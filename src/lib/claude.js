// ─────────────────────────────────────────────────────────────
// claude.js — Local-first AI client facade.
// ─────────────────────────────────────────────────────────────
// Priority chain: local → fallback.
// The app is fully static on GitHub Pages — no Supabase backend.
// Chat and insights run on-device when a local LLM is available,
// or deliver honest fallback messages when it isn't.
//
// To activate local inference:
//   python scripts/setup-local-ai.py llama
//   Then chat at /chat and insights at /insights route through it.
// ─────────────────────────────────────────────────────────────

import {
  AI_PROVIDERS,
  fallbackChatMessage,
  fallbackInsight,
  normalizeAiResponse,
} from './ai-provider.js';
import {
  isLocalAvailable,
  localChatCompletion,
  buildIrisSystemPrompt,
} from './local-ai.js';

export const MODELS = {
  local: 'local-model',
};

/**
 * Ask the configured AI provider for an insight.
 *
 * Priority: local (if available) → hosted Supabase → fallback.
 */
export async function requestInsight({ kind, windowDays = 7, context = {} }) {
  // Try local first
  const localOk = await isLocalAvailable();
  if (localOk) {
    try {
      const { content } = await localChatCompletion({
        messages: [{ role: 'user', content: insightPrompt(kind, windowDays, context) }],
        systemPrompt: 'You are IRIS, a personality insight engine. Write a concise, warm, psychologically-informed reflection.',
        maxTokens: 400,
      });
      return normalizeAiResponse({ content }, { model: MODELS.local, provider: AI_PROVIDERS.LOCAL });
    } catch (e) {
      console.warn('Local AI insight failed:', e.message);
    }
  }

  // Fallback
  return normalizeAiResponse(null, {
    content: fallbackInsight(kind),
    model: AI_PROVIDERS.FALLBACK,
    provider: AI_PROVIDERS.FALLBACK,
  });
}

/**
 * Chat with your IRIS through the best available provider.
 */
export async function sendChatMessage({ history, message, irisContext }) {
  // Try local first
  const localOk = await isLocalAvailable();
  if (localOk) {
    try {
      const systemPrompt = buildIrisSystemPrompt({
        iris: irisContext,
        entries: irisContext?.entries || [],
      });
      const { content } = await localChatCompletion({
        messages: history || [{ role: 'user', content: message }],
        systemPrompt,
      });
      return normalizeAiResponse({ content }, { model: MODELS.local, provider: AI_PROVIDERS.LOCAL });
    } catch (e) {
      console.warn('Local AI chat failed:', e.message);
    }
  }

  // Fallback
  return normalizeAiResponse(null, {
    content: fallbackChatMessage(),
    model: AI_PROVIDERS.FALLBACK,
    provider: AI_PROVIDERS.FALLBACK,
  });
}

function insightPrompt(kind, windowDays, context) {
  const windowLabel = kind === 'daily' ? 'today' : kind === 'weekly' ? `the last ${windowDays} days` : `the last ${windowDays} days`;
  return `Write a ${kind} reflection for ${windowLabel}. Context: ${JSON.stringify(context).slice(0, 500)}`;
}
