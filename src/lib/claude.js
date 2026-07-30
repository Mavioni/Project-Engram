// ─────────────────────────────────────────────────────────────
// claude.js — Multi-provider AI client facade.
// ─────────────────────────────────────────────────────────────
// Priority chain: local → hosted (Supabase) → fallback.
// The UI imports one function and gets the best available response.
//
// To activate local mode:
//   1. Start a local inference server (llama.cpp, Ollama, etc.)
//   2. Set VITE_LOCAL_AI_URL in .env (default: http://localhost:8080/v1)
//   3. The app auto-detects it on next chat message + caches for 30s
//
// For BitNet / 1-bit models, use llama.cpp server with IQ1_S quantisation
// or Microsoft's bitnet.cpp with an HTTP wrapper.
// ─────────────────────────────────────────────────────────────

import { getSupabase } from './supabase.js';
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

const HOSTED_EDGE_FUNCTION = 'claude-insight';

export const MODELS = {
  insight: 'claude-sonnet-4-6',
  chat: 'claude-sonnet-4-6',
  local: 'local-model',
};

export const INSIGHT_KINDS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CHAT: 'chat',
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
      console.warn('Local AI insight failed, falling back:', e.message);
    }
  }

  // Try hosted
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.functions.invoke(HOSTED_EDGE_FUNCTION, {
      body: { kind, windowDays, context },
    });
    if (!error) {
      return normalizeAiResponse(data, { model: MODELS.insight, provider: AI_PROVIDERS.HOSTED });
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
export async function sendChatMessage({ threadId, history, message, irisContext }) {
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
      console.warn('Local AI chat failed, falling back:', e.message);
    }
  }

  // Try hosted
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.functions.invoke(HOSTED_EDGE_FUNCTION, {
      body: { kind: INSIGHT_KINDS.CHAT, threadId, history, message, irisContext },
    });
    if (!error) {
      return normalizeAiResponse(data, { model: MODELS.chat, provider: AI_PROVIDERS.HOSTED });
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
